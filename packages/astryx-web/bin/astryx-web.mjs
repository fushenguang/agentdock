#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const COMMAND = 'samples'
const APPEARANCE_STORAGE_KEY = 'agentdock.appearance'

function requiredValue(args, index, flag) {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} needs a value`)
  }
  return value
}

function parseSize(value) {
  const match = /^(\d+)x(\d+)$/.exec(value)
  if (!match) throw new Error(`invalid --size ${value}; expected WIDTHxHEIGHT`)
  return { width: Number(match[1]), height: Number(match[2]) }
}

function parseStorage(value) {
  const at = value.indexOf('=')
  if (at <= 0) throw new Error(`invalid --storage ${value}; expected key=value`)
  return [value.slice(0, at), value.slice(at + 1)]
}

export function parseArgs(argv) {
  if (argv[0] !== COMMAND) {
    throw new Error(`astryx-web only provides the ${COMMAND} command`)
  }

  const config = {
    baseUrl: null,
    routes: [],
    themes: [],
    modes: [],
    sizes: [],
    storage: {},
    out: null,
  }

  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag === '--base-url') {
      config.baseUrl = requiredValue(argv, index, flag)
      index += 1
    } else if (flag === '--route') {
      config.routes.push(requiredValue(argv, index, flag))
      index += 1
    } else if (flag === '--theme') {
      config.themes.push(requiredValue(argv, index, flag))
      index += 1
    } else if (flag === '--mode') {
      config.modes.push(requiredValue(argv, index, flag))
      index += 1
    } else if (flag === '--size') {
      config.sizes.push(parseSize(requiredValue(argv, index, flag)))
      index += 1
    } else if (flag === '--out') {
      config.out = requiredValue(argv, index, flag)
      index += 1
    } else if (flag === '--storage') {
      const first = requiredValue(argv, index, flag)
      const [key, value] = parseStorage(first)
      config.storage[key] = value
      index += 1
      while (argv[index + 1] && !argv[index + 1].startsWith('--')) {
        const [nextKey, nextValue] = parseStorage(argv[index + 1])
        config.storage[nextKey] = nextValue
        index += 1
      }
    } else {
      throw new Error(`unknown option ${flag}`)
    }
  }

  for (const [name, value] of [
    ['--base-url', config.baseUrl],
    ['--out', config.out],
  ]) {
    if (!value) throw new Error(`${name} is required`)
  }
  for (const [name, values] of [
    ['--route', config.routes],
    ['--theme', config.themes],
    ['--mode', config.modes],
    ['--size', config.sizes],
  ]) {
    if (values.length === 0) throw new Error(`${name} is required at least once`)
  }

  new URL(config.baseUrl)
  return config
}

export function routeSlug(route) {
  const slug = route
    .split(/[?#]/, 1)[0]
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'root'
}

export function sampleFileName(route, theme, mode, size) {
  return `${routeSlug(route)}__${theme}__${mode}__${size.width}x${size.height}.png`
}

function gitCommit(cwd) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : null
}

async function waitForJson(url, timeoutMs = 15_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return await response.json()
    } catch {
      // Chrome has not opened the debugging endpoint yet.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100))
  }
  throw new Error(`Chrome debugging endpoint did not start: ${url}`)
}

class Cdp {
  constructor(url) {
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Set()
    this.socket = new WebSocket(url)
  }

  async open() {
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener('open', resolveOpen, { once: true })
      this.socket.addEventListener('error', rejectOpen, { once: true })
    })
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id) {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result)
        return
      }
      for (const listener of this.listeners) listener(message)
    })
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId
    this.nextId += 1
    const payload = { id, method, params }
    if (sessionId) payload.sessionId = sessionId
    this.socket.send(JSON.stringify(payload))
    return new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, { resolve: resolveSend, reject: rejectSend })
    })
  }

  onMessage(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  close() {
    this.socket.close()
  }
}

function waitForNetworkIdle(cdp, sessionId, timeoutMs = 30_000) {
  return new Promise((resolveIdle, rejectIdle) => {
    let timeoutTimer = null

    const finish = (error) => {
      clearTimeout(timeoutTimer)
      off()
      if (error) rejectIdle(error)
      else resolveIdle()
    }
    const off = cdp.onMessage((message) => {
      if (message.sessionId !== sessionId) return
      if (message.method === 'Page.lifecycleEvent' && message.params?.name === 'networkIdle') {
        finish()
      }
    })
    timeoutTimer = setTimeout(
      () => finish(new Error('page did not reach network idle within 30 seconds')),
      timeoutMs,
    )
  })
}

async function openSamplePage(cdp) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
  await cdp.send('Page.enable', {}, sessionId)
  await cdp.send('Page.setLifecycleEventsEnabled', { enabled: true }, sessionId)
  await cdp.send('Network.enable', {}, sessionId)
  return { targetId, sessionId }
}

async function renderSample(cdp, page, config, storage, route, theme, mode, size, out) {
  const { sessionId } = page
  await cdp.send(
    'Emulation.setDeviceMetricsOverride',
    {
      width: size.width,
      height: size.height,
      deviceScaleFactor: 1,
      mobile: size.width < 600,
    },
    sessionId,
  )

  for (const [name, value] of Object.entries(storage)) {
    await cdp.send(
      'Network.setCookie',
      {
        name,
        value,
        url: config.baseUrl,
        path: '/',
        sameSite: 'Lax',
      },
      sessionId,
    )
  }

  const idle = waitForNetworkIdle(cdp, sessionId)
  const url = new URL(route, config.baseUrl).href
  await cdp.send('Page.navigate', { url }, sessionId)
  await idle

  const screenshot = await cdp.send(
    'Page.captureScreenshot',
    { format: 'png', fromSurface: true, captureBeyondViewport: false },
    sessionId,
  )
  const file = sampleFileName(route, theme, mode, size)
  writeFileSync(join(out, file), Buffer.from(screenshot.data, 'base64'))
  return {
    file,
    route,
    theme,
    mode,
    size: `${size.width}x${size.height}`,
    width: size.width,
    height: size.height,
  }
}

export async function runSamples(config, env = process.env) {
  const chromePath = env.CHROME_PATH
  if (!chromePath) {
    throw new Error('CHROME_PATH must name the system Chrome executable')
  }

  const out = resolve(config.out)
  mkdirSync(out, { recursive: true })
  const profile = mkdtempSync(join(tmpdir(), 'astryx-web-chrome-'))
  const port = 20_000 + Math.floor(Math.random() * 20_000)
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let cdp
  let page
  try {
    const version = await waitForJson(`http://127.0.0.1:${port}/json/version`)
    cdp = new Cdp(version.webSocketDebuggerUrl)
    await cdp.open()
    page = await openSamplePage(cdp)

    const entries = []
    for (const route of config.routes) {
      for (const theme of config.themes) {
        for (const mode of config.modes) {
          for (const size of config.sizes) {
            const storage = {
              ...config.storage,
              [APPEARANCE_STORAGE_KEY]: `${theme}.${mode}`,
            }
            entries.push(
              await renderSample(cdp, page, config, storage, route, theme, mode, size, out),
            )
          }
        }
      }
    }

    const index = {
      commit: gitCommit(process.cwd()),
      routes: config.routes,
      files: entries,
    }
    writeFileSync(join(out, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)
    return index
  } finally {
    if (page) {
      await cdp.send('Target.closeTarget', { targetId: page.targetId }).catch(() => undefined)
    }
    cdp?.close()
    if (chrome.exitCode === null) {
      chrome.kill('SIGTERM')
      await Promise.race([
        once(chrome, 'exit'),
        new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000)),
      ])
    }
    if (chrome.exitCode === null) chrome.kill('SIGKILL')
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

async function main() {
  try {
    const config = parseArgs(process.argv.slice(2))
    const index = await runSamples(config)
    console.log(`Rendered ${index.files.length} samples to ${resolve(config.out)}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
