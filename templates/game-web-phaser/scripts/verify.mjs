#!/usr/bin/env node
// verify.mjs — the three-tier judgement this template ships instead of
// prose ("take a screenshot and eyeball it"). See
// openspec/changes/game-template-verification/{proposal,design}.md in the
// AgentDock platform repo for the full rationale; short version:
//
//   BH-0  build   — the build command exits 0
//   BH-1  load    — headless Chromium loads the build with no uncaught
//                   exception and no failed resource request
//   BH-2  render  — the screenshot is provably non-empty (unique-colour +
//                   variance floor, not just "a PNG exists") and the game
//                   canvas has non-zero size
//
// Zero new dependencies (Gate ②): this spawns whatever Chromium already
// exists in the environment (scripts/lib/find-browser.mjs) and speaks CDP
// over Node's own built-in `WebSocket` (stable since Node 22).
//
// 🔴 Every gate below either passes, or prints what it expected/looked for
// and calls process.exit(1). None of them may print "skipping" and exit 0
// — a check that can be silently skipped is not a check.

import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveBrowser } from './lib/find-browser.mjs'
import { startStaticServer } from './lib/static-server.mjs'
import { createCdpClient } from './lib/cdp.mjs'
import { decodePng, judgeScreenshotNonEmpty } from './lib/png.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const DIST_DIR = join(PROJECT_ROOT, 'dist-play')

const PAGE_LOAD_TIMEOUT_MS = 15_000
const DEVTOOLS_LISTEN_TIMEOUT_MS = 10_000
// Grace period after `Page.loadEventFired` before we take the screenshot —
// Phaser boots across Boot -> Preload -> Game scenes and generates its
// placeholder textures on the way; this gives that a moment to settle so
// BH-1 can also catch an exception thrown just after load, not only during it.
const SETTLE_MS = 1000

function fail(stage, expected, actual, extra) {
  console.error(`\n[verify] ${stage} — FAILED`)
  console.error(`  expected: ${expected}`)
  console.error(`  actual:   ${actual}`)
  if (extra) console.error(`  detail:   ${extra}`)
  process.exit(1)
}

/**
 * Node-version self-check (task 1.2 / proposal's explicit contract note).
 * `engines.node` says >=22 because the zero-dep CDP transport needs the
 * built-in `WebSocket` global that only exists from Node 22 onward. This
 * MUST be a hard failure, not a silently-skipped BH-1 — a gate nobody can
 * see got skipped is not a gate.
 */
function checkNodeWebSocket() {
  if (typeof WebSocket !== 'function') {
    fail(
      'Node runtime check',
      'global `WebSocket` is a function (Node >=22)',
      `typeof WebSocket === ${JSON.stringify(typeof WebSocket)} on Node ${process.version}`,
      'This template’s zero-dependency CDP transport requires Node’s built-in WebSocket. Upgrade Node, or see design.md D2/D3 if you are deliberately porting this to an older runtime.',
    )
  }
}

function runBuild() {
  const viteBinName = process.platform === 'win32' ? 'vite.cmd' : 'vite'
  const viteBinPath = join(PROJECT_ROOT, 'node_modules', '.bin', viteBinName)
  if (!existsSync(viteBinPath)) {
    fail('BH-0 build', `${viteBinPath} exists (run \`pnpm install\` first)`, 'not found')
  }

  console.log('[verify] BH-0 build — running `vite build --mode play`...')
  const result = spawnSync(viteBinPath, ['build', '--mode', 'play'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  })

  if (result.error) {
    fail('BH-0 build', 'build command runs', `spawn error: ${result.error.message}`)
  }
  if (result.status !== 0) {
    fail('BH-0 build', 'exit code 0', `exit code ${result.status}`)
  }
  console.log('[verify] BH-0 build — passed')
}

/**
 * Launch the resolved browser headless, and resolve once it prints its
 * DevTools WebSocket endpoint to stderr (design D3: "从 stderr 抓 ws 地址").
 */
function launchBrowser(browser) {
  const args = [
    '--no-sandbox', // the guest runs as root; the sandbox can't start
    // The guest image has no /dev/shm — Chromium FATALs on startup without
    // this flag. Filed as fushenguang/tarit#34; once that's fixed this flag
    // can be dropped, but it's harmless to keep either way.
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--remote-debugging-port=0',
    '--remote-debugging-address=127.0.0.1',
  ]
  // chrome-headless-shell is inherently headless and doesn't understand
  // --headless; a full chrome/chromium binary needs it explicitly.
  if (!browser.isHeadlessShell) {
    args.unshift('--headless=new')
  }

  const proc = spawn(browser.path, args, { stdio: ['ignore', 'ignore', 'pipe'] })

  return new Promise((resolve, reject) => {
    let stderrBuf = ''
    let settled = false

    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      proc.kill()
      reject(
        new Error(
          `Timed out waiting for Chromium to print its DevTools listening address ` +
            `(${DEVTOOLS_LISTEN_TIMEOUT_MS}ms). stderr so far:\n${stderrBuf}`,
        ),
      )
    }, DEVTOOLS_LISTEN_TIMEOUT_MS)

    proc.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString()
      const match = stderrBuf.match(/DevTools listening on (ws:\/\/\S+)/)
      if (match && !settled) {
        settled = true
        clearTimeout(timeout)
        resolve({ proc, wsUrl: match[1] })
      }
    })

    proc.on('error', (err) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(new Error(`Failed to launch Chromium at ${browser.path}: ${err.message}`))
    })

    proc.on('exit', (code) => {
      if (settled) return
      if (code !== null && code !== 0) {
        settled = true
        clearTimeout(timeout)
        reject(new Error(`Chromium exited early (code ${code}). stderr:\n${stderrBuf}`))
      }
    })
  })
}

/**
 * Run BH-1 + BH-2 over CDP against `pageUrl`. Returns the raw evidence
 * (uncaught exceptions, failed requests, canvas size, screenshot) —
 * verify.mjs's main() decides pass/fail so the judgement stays visible at
 * the top level instead of buried in here.
 */
async function runCdpChecks(browserWsUrl, pageUrl) {
  const client = createCdpClient(browserWsUrl)
  await client.ready

  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true })

  const exceptions = []
  const failedRequests = []

  client.on('Runtime.exceptionThrown', (params, sid) => {
    if (sid !== sessionId) return
    exceptions.push(params)
  })
  client.on('Network.loadingFailed', (params, sid) => {
    if (sid !== sessionId) return
    failedRequests.push(params)
  })

  // 🔴 These MUST be enabled before Page.navigate — an exception thrown
  // during the page's earliest script evaluation is otherwise missed
  // entirely, which silently turns BH-1 into "verified something, just not
  // the thing it claims to verify" (design D3).
  await client.send('Runtime.enable', {}, sessionId)
  await client.send('Log.enable', {}, sessionId)
  await client.send('Network.enable', {}, sessionId)
  await client.send('Page.enable', {}, sessionId)

  const loadEventFired = new Promise((resolve) => {
    const unsubscribe = client.on('Page.loadEventFired', (params, sid) => {
      if (sid !== sessionId) return
      unsubscribe()
      resolve(undefined)
    })
  })

  await client.send('Page.navigate', { url: pageUrl }, sessionId)

  await Promise.race([
    loadEventFired,
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`Timed out waiting for Page.loadEventFired (${PAGE_LOAD_TIMEOUT_MS}ms)`),
          ),
        PAGE_LOAD_TIMEOUT_MS,
      ),
    ),
  ])

  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))

  const canvasEval = await client.send(
    'Runtime.evaluate',
    {
      expression:
        "(() => { const c = document.querySelector('canvas'); return c ? { w: c.clientWidth, h: c.clientHeight } : { w: 0, h: 0 } })()",
      returnByValue: true,
    },
    sessionId,
  )
  const canvasWidth = canvasEval.result?.value?.w ?? 0
  const canvasHeight = canvasEval.result?.value?.h ?? 0

  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' }, sessionId)

  client.close()

  return {
    exceptions: exceptions.map((e) => e.exception?.description ?? e.text ?? JSON.stringify(e)),
    failedRequests: failedRequests.map((f) => ({
      requestId: f.requestId,
      errorText: f.errorText,
      type: f.type,
    })),
    canvasWidth,
    canvasHeight,
    screenshotBase64: screenshot.data,
  }
}

async function main() {
  checkNodeWebSocket()
  runBuild()

  const browser = resolveBrowser()
  console.log(`[verify] Using browser: ${browser.path} (found via: ${browser.source})`)

  const { server, url: staticUrl } = await startStaticServer(DIST_DIR)
  console.log(`[verify] Serving ${DIST_DIR} at ${staticUrl}`)

  let launched
  try {
    launched = await launchBrowser(browser)
  } catch (err) {
    fail('Browser launch', 'Chromium starts and prints its DevTools listening address', err.message)
    return // unreachable — fail() exits — but keeps TypeScript-less linters happy
  }
  const { proc, wsUrl } = launched
  console.log(`[verify] Chromium DevTools endpoint: ${wsUrl}`)

  try {
    const result = await runCdpChecks(wsUrl, staticUrl)

    if (result.exceptions.length > 0 || result.failedRequests.length > 0) {
      fail(
        'BH-1 load',
        'no uncaught exceptions and no failed resource requests',
        `${result.exceptions.length} uncaught exception(s), ${result.failedRequests.length} failed request(s)`,
        JSON.stringify(
          { exceptions: result.exceptions, failedRequests: result.failedRequests },
          null,
          2,
        ),
      )
    }
    console.log('[verify] BH-1 load — passed (no uncaught exceptions, no failed resource requests)')

    if (result.canvasWidth <= 0 || result.canvasHeight <= 0) {
      fail(
        'BH-2 render (canvas size)',
        'canvas clientWidth/clientHeight > 0',
        `${result.canvasWidth}x${result.canvasHeight}`,
      )
    }

    const decoded = decodePng(result.screenshotBase64)
    const judged = judgeScreenshotNonEmpty(decoded)
    if (!judged.nonEmpty) {
      fail(
        'BH-2 render (screenshot non-empty)',
        'unique-colour count and pixel variance both clear their floor',
        'below floor',
        judged.reason,
      )
    }
    console.log(
      `[verify] BH-2 render — passed (canvas ${result.canvasWidth}x${result.canvasHeight}, ` +
        `${judged.uniqueColors} unique colours, variance ${judged.variance.toFixed(2)})`,
    )

    console.log('\n[verify] All gates passed.')
  } finally {
    proc.kill()
    server.close()
  }
}

main().catch((err) => {
  console.error('[verify] Unexpected error:', err)
  process.exit(1)
})
