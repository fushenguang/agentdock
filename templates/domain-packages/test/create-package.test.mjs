#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const generator = join(templateRoot, 'tools', 'create-package.mjs')
const checker = join(templateRoot, 'tools', 'check-workspace.mjs')

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function workspace() {
  const root = mkdtempSync(join(tmpdir(), 'agentdock-domain-packages-'))
  cpSync(templateRoot, root, {
    recursive: true,
    filter: (path) => !path.includes('/test/'),
  })
  return root
}

function packageSpec(overrides = {}) {
  return {
    id: 'new-domain',
    displayName: 'New Domain',
    intent: 'Help the user complete one concrete domain outcome with a reviewable artifact.',
    owner: '@team',
    lifecycle: 'active',
    repositoryClass: 'product',
    ...overrides,
  }
}

function mockNpx(root) {
  const bin = join(root, 'bin')
  mkdirSync(bin, { recursive: true })
  const file = join(bin, 'npx')
  writeFileSync(
    file,
    [
      '#!/bin/sh',
      'if ! printf "%s\\n" "$*" | grep -q "@cogito.ai/cli@0.32.6"; then',
      '  echo "expected pinned AgentDock CLI" >&2',
      '  exit 2',
      'fi',
      'for required in "--name web" "--dir apps/web" "--mode workspace"; do',
      '  if ! printf "%s\\n" "$*" | grep -q -- "$required"; then',
      '    echo "expected AgentDock workspace target $required" >&2',
      '    exit 2',
      '  fi',
      'done',
      'app="apps/web"',
      'mkdir -p "$app/src" "$app/scripts" "$app/dist/client" "$app/dist/server" "$app/.agents/skills/astryx-web-design"',
      'printf "---\\nname: astryx-web-design\\n---\\n" > "$app/.agents/skills/astryx-web-design/SKILL.md"',
      'printf \'{"name":"web","private":true,"scripts":{"dev":"echo dev","check":"node --test","build":"node scripts/fake-build.mjs"}}\\n\' > "$app/package.json"',
      'printf "export default defineConfig({\\n  resolve: {\\n    alias: {},\\n  },\\n});\\n" > "$app/vite.config.ts"',
      'printf "import { serve } from \\"srvx\\"; import server from \\"./dist/server/server.js\\"; serve({ fetch: (request) => server.fetch(request) })\\n" > "$app/server.mjs"',
      'printf "export {}\\n" > "$app/src/placeholder.ts"',
      'cat > "$app/scripts/fake-build.mjs" <<\'EOF\'',
      'import { mkdirSync, writeFileSync } from "node:fs";',
      'import { join } from "node:path";',
      'const root = process.cwd();',
      'mkdirSync(join(root, "dist/client"), { recursive: true });',
      'mkdirSync(join(root, "dist/server"), { recursive: true });',
      'writeFileSync(join(root, "dist/server/server.js"), "export default { async fetch() { return new Response(\\"ok\\"); } };\\n");',
      'writeFileSync(join(root, "dist/client/app.js"), `appPath=${join(root, "src/app.ts")}\n`);',
      'writeFileSync(join(root, "dist/server/manifest.js"), `filePath: ${JSON.stringify(join(root, "src/routes/__root.tsx"))}\n`);',
      'EOF',
      '',
    ].join('\n'),
  )
  execFileSync('chmod', ['+x', file])
  return { ...process.env, PATH: `${bin}:${process.env.PATH}` }
}

function createPackage(root, spec, env = process.env) {
  const specFile = join(root, 'package-spec.json')
  writeJson(specFile, spec)
  return spawnSync(process.execPath, [generator, '--spec', specFile, '--repo-root', root], {
    encoding: 'utf8',
    env,
  })
}

test('empty workspace has no business package and passes check', () => {
  const root = workspace()
  try {
    const check = spawnSync(process.execPath, [checker, '--repo-root', root], {
      encoding: 'utf8',
    })
    assert.equal(check.status, 0, check.stderr)
    assert.equal(existsSync(join(root, 'apps', 'new-domain')), false)
    assert.equal(existsSync(join(root, 'openspec', 'config.yaml')), true)
    assert.equal(existsSync(join(root, 'apps', 'docs', 'package.json')), true)
    assert.equal(existsSync(join(root, 'apps', 'web', '.gitkeep')), true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('empty workspace pre-approves web-tanstackstart build scripts', () => {
  const workspaceYaml = readFileSync(join(templateRoot, 'pnpm-workspace.yaml'), 'utf8')
  assert.match(workspaceYaml, /['"]?@astryxdesign\/cli['"]?:\s*true/)
  assert.match(workspaceYaml, /['"]?@astryxdesign\/core['"]?:\s*true/)
  assert.match(workspaceYaml, /better-sqlite3:\s*false/)
  assert.match(workspaceYaml, /esbuild:\s*true/)
  assert.match(workspaceYaml, /lightningcss:\s*true/)
})

test('generator creates a formal Web package with pinned AgentDock CLI', () => {
  const root = workspace()
  try {
    const result = createPackage(root, packageSpec(), mockNpx(root))
    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(join(root, 'apps', 'new-domain', 'contract.json')), true)
    assert.equal(existsSync(join(root, 'apps', 'new-domain', 'agent', 'web-surface.json')), true)
    assert.equal(existsSync(join(root, 'apps', 'web', 'package.json')), true)
    assert.match(
      readFileSync(join(root, 'apps', 'web', 'src', 'agent', 'web-channel-client.ts'), 'utf8'),
      /const \[majorPart = "", minorPart = "0"\]/,
    )
    assert.match(
      readFileSync(join(root, 'apps', 'web', 'src', 'server', 'hosted-runtime.mjs'), 'utf8'),
      /for \(const requestId of pendingWebInvocations\.keys\(\)\)/,
    )
    assert.equal(
      readlinkSync(join(root, 'apps', 'web', '.claude', 'skills', 'astryx-web-design')),
      '../../.agents/skills/astryx-web-design',
    )
    assert.equal(
      existsSync(join(root, 'apps', 'web', 'src', 'server', 'capability-service.mjs')),
      true,
    )
    assert.match(
      readFileSync(join(root, 'apps', 'web', 'src', 'server', 'capability-service.mjs'), 'utf8'),
      /Object\.assign\(error, \{\n\s+code:/,
    )
    assert.match(
      readFileSync(join(root, 'apps', 'web', 'src', 'server', 'vault-supply.mjs'), 'utf8'),
      /"not-signed-in": \(name\) => `.*`,/,
    )
    assert.match(
      readFileSync(join(root, 'apps', 'web', 'vite.config.ts'), 'utf8'),
      /ssr:\s*\{[\s\S]*?noExternal:\s*true/,
    )
    assert.equal(existsSync(join(root, 'apps', 'web', '.gitkeep')), false)
    assert.equal(existsSync(join(root, 'new-domain')), false)
    assert.equal(existsSync(join(root, 'apps', 'new-domain', 'web')), false)

    const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    assert.equal(
      rootPackage.scripts.check,
      'node tools/check-workspace.mjs && pnpm --filter web check',
    )
    assert.equal(rootPackage.scripts['dev:new-domain'], 'pnpm --filter web dev')
    assert.equal(
      rootPackage.scripts['build:new-domain-package'],
      'node tools/build-package.mjs new-domain',
    )
    assert.equal(
      rootPackage.scripts['smoke:new-domain-package'],
      'node tools/smoke-package.mjs new-domain',
    )

    const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'))
    assert.equal(catalog.packages[0].contextEntry, 'apps/new-domain/AGENTS.md')
    assert.equal(catalog.specVersion, '0.3.0')

    const contract = JSON.parse(
      readFileSync(join(root, 'apps', 'new-domain', 'contract.json'), 'utf8'),
    )
    assert.equal(contract.constraints.specVersion, '>=2.0.0 <3.0.0')
    assert.equal(contract.constraints.protocolVersion, '=2.0.0')
    assert.equal(contract.collaborationMode, 'conversation-led')
    assert.equal(contract.intent.intentSpace[0].fulfillment.skills[0], 'workbench-guide')

    const surface = JSON.parse(
      readFileSync(join(root, 'apps', 'new-domain', 'agent', 'surface.json'), 'utf8'),
    )
    assert.equal(surface.identity.audience, undefined)
    assert.equal(surface.web.hasWeb, true)
    assert.deepEqual(surface.web.topLevelRouteIds, ['workbench'])
    assert.equal(surface.contextTiers.l1.queryCapabilityIds.length, 2)

    const webSurface = JSON.parse(
      readFileSync(join(root, 'apps', 'new-domain', 'agent', 'web-surface.json'), 'utf8'),
    )
    assert.equal(webSurface.routes[0].actions[0].authorization.caller, 'agent')
    assert.equal(webSurface.routes[0].actions[0].authorization.audience, undefined)

    const capability = JSON.parse(
      readFileSync(
        join(root, 'apps', 'new-domain', 'capabilities', 'new-domain-workbench-get-state.json'),
        'utf8',
      ),
    )
    assert.equal(capability.errors[0].when.length > 0, true)
    assert.equal(capability.errors[0].message, undefined)

    const skills = JSON.parse(
      readFileSync(join(root, 'apps', 'new-domain', 'agent', 'skills-index.json'), 'utf8'),
    )
    assert.equal(skills[0].id, 'workbench-guide')
    assert.deepEqual(skills[0].intents, ['new-domain-outcome'])

    const standardsLock = JSON.parse(
      readFileSync(join(root, 'apps', 'new-domain', 'standards-lock.json'), 'utf8'),
    )
    assert.equal(
      standardsLock.standards.find((entry) => entry.id === 'domain-package-spec').version,
      '2.0.0',
    )
    assert.equal(
      standardsLock.standards.find((entry) => entry.id === 'domain-package-spec').digest,
      'sha256:d851c39223d3a65d2b82ede0dd033fb6d1505531d5918b1637303414c377165c',
    )

    const check = spawnSync(process.execPath, [checker, '--repo-root', root], {
      encoding: 'utf8',
    })
    assert.equal(check.status, 0, check.stderr)

    const build = spawnSync(
      process.execPath,
      [join(templateRoot, 'tools', 'build-package.mjs'), 'new-domain'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    )
    assert.equal(build.status, 0, build.stderr)
    const outputRoot = join(root, 'apps', 'new-domain', 'web')
    const packageJson = JSON.parse(
      readFileSync(join(root, 'apps', 'new-domain', 'package.json'), 'utf8'),
    )
    assert.equal(packageJson.scripts['start:web'], 'pnpm --dir ../.. --filter web start')
    const metadata = JSON.parse(readFileSync(join(outputRoot, 'build.json'), 'utf8'))
    assert.equal(metadata.entry, 'server.mjs')
    assert.equal(metadata.webApiVersion, '1.0.0')
    assert.equal(metadata.apiVersion, '1.0.0')
    for (const artifact of [
      'server.mjs',
      'runtime/server/hosted-runtime.mjs',
      'runtime/server/vault-supply.mjs',
      'server/assets/capability-service.mjs',
    ]) {
      assert.equal(existsSync(join(outputRoot, artifact)), true, `missing artifact: ${artifact}`)
    }
    const packagedText = [
      ...readdirSync(join(outputRoot, 'client'), { recursive: true }),
      ...readdirSync(join(outputRoot, 'server'), { recursive: true }),
    ].join('\n')
    assert.doesNotMatch(packagedText, new RegExp(root.replaceAll('/', '\\/')))
    const clientApp = readFileSync(join(outputRoot, 'client', 'app.js'), 'utf8')
    const serverManifest = readFileSync(join(outputRoot, 'server', 'manifest.js'), 'utf8')
    assert.equal(clientApp, 'appPath=apps/web/src/app.ts\n')
    assert.equal(serverManifest, 'filePath: "apps/web/src/routes/__root.tsx"\n')

    const smoke = spawnSync(
      process.execPath,
      [join(templateRoot, 'tools', 'smoke-package.mjs'), 'new-domain'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    )
    assert.equal(smoke.status, 0, `${smoke.stdout}${smoke.stderr}`)
    const smokeResult = JSON.parse(smoke.stdout.trim().split('\n').at(-1))
    assert.equal(smokeResult.ok, true)
    assert.equal(smokeResult.health.status, 'ready')

    rmSync(join(outputRoot, 'server.mjs'))
    const missingEntry = spawnSync(
      process.execPath,
      [join(templateRoot, 'tools', 'smoke-package.mjs'), 'new-domain'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    )
    assert.equal(missingEntry.status, 1)
    assert.match(missingEntry.stderr, /packaged runtime is incomplete/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('explicit generator fields work without a spec file', () => {
  const root = workspace()
  try {
    const result = spawnSync(
      process.execPath,
      [
        generator,
        '--id',
        'new-domain',
        '--intent',
        'Help the user complete one concrete domain outcome with a reviewable artifact.',
        '--repo-root',
        root,
      ],
      { encoding: 'utf8', env: mockNpx(root) },
    )
    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(join(root, 'apps', 'new-domain', 'contract.json')), true)
    assert.equal(existsSync(join(root, 'package-spec.json')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('missing or absent spec input fails with friendly errors', () => {
  const root = workspace()
  try {
    const missing = spawnSync(
      process.execPath,
      [generator, '--spec', join(root, 'package-spec.json'), '--repo-root', root],
      { encoding: 'utf8' },
    )
    assert.equal(missing.status, 1)
    assert.match(missing.stderr, /package spec file not found/)
    assert.doesNotMatch(missing.stderr, /ENOENT/)
    assert.equal(existsSync(join(root, 'apps', 'new-domain')), false)

    const noSpec = spawnSync(process.execPath, [generator, '--repo-root', root], {
      encoding: 'utf8',
    })
    assert.equal(noSpec.status, 1)
    assert.match(noSpec.stderr, /--spec is required in non-interactive mode/)
    assert.equal(existsSync(join(root, 'apps', 'new-domain')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('formal no-Web package requires an approved exception', () => {
  const root = workspace()
  try {
    const result = createPackage(root, packageSpec({ hasWeb: false }))
    assert.equal(result.status, 1)
    assert.match(result.stderr, /noWebException/)
    assert.equal(existsSync(join(root, 'apps', 'new-domain')), false)
    assert.equal(existsSync(join(root, 'openspec', 'config.yaml')), true)
    assert.equal(existsSync(join(root, 'apps', 'docs', 'package.json')), true)
    assert.equal(existsSync(join(root, 'apps', 'web', '.gitkeep')), true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('duplicate package creation fails without overwriting', () => {
  const root = workspace()
  try {
    const env = mockNpx(root)
    assert.equal(createPackage(root, packageSpec(), env).status, 0)
    const before = readFileSync(join(root, 'apps', 'new-domain', 'contract.json'), 'utf8')
    const second = createPackage(root, packageSpec(), env)
    assert.equal(second.status, 1)
    assert.match(second.stderr, /already exists/)
    assert.equal(readFileSync(join(root, 'apps', 'new-domain', 'contract.json'), 'utf8'), before)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

// Opt-in parity gate for the pinned standards lock. The pins in create-package.mjs are a snapshot
// of standards owned by two other repositories, so any change to them (a spec seal, a re-pin of a
// package-repository standard) must re-run this against real checkouts:
//
//   THEFOOLAI_ROOT=<TheFoolAI checkout> DOMAIN_PACKAGES_ROOT=<domain-packages checkout> pnpm test
//
// The digest algorithm is never re-implemented here: the package repository's own
// `scripts/standards-lock.mjs` computes the fresh lock and the generated lock must equal it.
const parityRoots = {
  thefoolai: process.env.THEFOOLAI_ROOT,
  domainPackages: process.env.DOMAIN_PACKAGES_ROOT,
}
const parityEnabled = Boolean(parityRoots.thefoolai && parityRoots.domainPackages)

test(
  'pinned standards lock equals the lock computed from the real standards',
  { skip: parityEnabled ? false : 'set THEFOOLAI_ROOT and DOMAIN_PACKAGES_ROOT to run' },
  () => {
    const root = workspace()
    const fresh = mkdtempSync(join(tmpdir(), 'agentdock-standards-lock-'))
    try {
      const result = createPackage(root, packageSpec(), mockNpx(root))
      assert.equal(result.status, 0, result.stderr)
      const computed = spawnSync(
        process.execPath,
        [
          join(parityRoots.domainPackages, 'scripts', 'standards-lock.mjs'),
          fresh,
          '--thefoolai-root',
          parityRoots.thefoolai,
        ],
        { encoding: 'utf8' },
      )
      assert.equal(computed.status, 0, `${computed.stdout}${computed.stderr}`)
      assert.deepEqual(
        JSON.parse(readFileSync(join(root, 'apps', 'new-domain', 'standards-lock.json'), 'utf8')),
        JSON.parse(readFileSync(join(fresh, 'standards-lock.json'), 'utf8')),
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
      rmSync(fresh, { recursive: true, force: true })
    }
  },
)
