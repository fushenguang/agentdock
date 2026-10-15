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
      'if ! printf "%s\\n" "$*" | grep -q "@cogito.ai/cli@0.27.1"; then',
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
      'mkdir -p "$app/src" "$app/scripts" "$app/dist/client" "$app/dist/server"',
      'printf \'{"name":"web","private":true,"scripts":{"dev":"echo dev","check":"node --test","build":"node scripts/fake-build.mjs"}}\\n\' > "$app/package.json"',
      'printf "import { serve } from \\"srvx\\"; import server from \\"./dist/server/server.js\\"; serve({ fetch: (request) => server.fetch(request) })\\n" > "$app/server.mjs"',
      'printf "export {}\\n" > "$app/src/placeholder.ts"',
      'cat > "$app/scripts/fake-build.mjs" <<\'EOF\'',
      'import { mkdirSync, writeFileSync } from "node:fs";',
      'import { join } from "node:path";',
      'const root = process.cwd();',
      'mkdirSync(join(root, "dist/client"), { recursive: true });',
      'mkdirSync(join(root, "dist/server"), { recursive: true });',
      'writeFileSync(join(root, "dist/server/server.js"), "export default {};\\n");',
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

    const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'))
    assert.equal(catalog.packages[0].contextEntry, 'apps/new-domain/AGENTS.md')

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
    assert.equal(metadata.entry, undefined)
    const packagedText = [
      ...readdirSync(join(outputRoot, 'client'), { recursive: true }),
      ...readdirSync(join(outputRoot, 'server'), { recursive: true }),
    ].join('\n')
    assert.doesNotMatch(packagedText, new RegExp(root.replaceAll('/', '\\/')))
    const clientApp = readFileSync(join(outputRoot, 'client', 'app.js'), 'utf8')
    const serverManifest = readFileSync(join(outputRoot, 'server', 'manifest.js'), 'utf8')
    assert.equal(clientApp, 'appPath=apps/web/src/app.ts\n')
    assert.equal(serverManifest, 'filePath: "apps/web/src/routes/__root.tsx"\n')
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
