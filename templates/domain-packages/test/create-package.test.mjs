#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
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
      'if ! printf "%s\\n" "$*" | grep -q "@cogito.ai/cli@0.27.0"; then',
      '  echo "expected pinned AgentDock CLI" >&2',
      '  exit 2',
      'fi',
      'app="apps/new-domain-web"',
      'mkdir -p "$app/src" "$app/scripts"',
      'printf \'{"name":"new-domain-web","private":true,"scripts":{"dev":"echo dev","check":"node --test","build":"echo build"}}\\n\' > "$app/package.json"',
      'printf "export {}\\n" > "$app/src/placeholder.ts"',
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
    assert.equal(existsSync(join(root, 'new-domain')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('generator creates a formal Web package with pinned AgentDock CLI', () => {
  const root = workspace()
  try {
    const result = createPackage(root, packageSpec(), mockNpx(root))
    assert.equal(result.status, 0, result.stderr)
    assert.equal(existsSync(join(root, 'new-domain', 'contract.json')), true)
    assert.equal(existsSync(join(root, 'new-domain', 'agent', 'web-surface.json')), true)
    assert.equal(existsSync(join(root, 'apps', 'new-domain-web', 'package.json')), true)
    assert.equal(existsSync(join(root, 'new-domain', 'web')), false)

    const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    assert.equal(rootPackage.scripts['dev:new-domain'], 'pnpm --filter new-domain-web dev')
    assert.equal(
      rootPackage.scripts['build:new-domain-package'],
      'node tools/build-package.mjs new-domain',
    )

    const check = spawnSync(process.execPath, [checker, '--repo-root', root], {
      encoding: 'utf8',
    })
    assert.equal(check.status, 0, check.stderr)
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
    assert.equal(existsSync(join(root, 'new-domain')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('duplicate package creation fails without overwriting', () => {
  const root = workspace()
  try {
    const env = mockNpx(root)
    assert.equal(createPackage(root, packageSpec(), env).status, 0)
    const before = readFileSync(join(root, 'new-domain', 'contract.json'), 'utf8')
    const second = createPackage(root, packageSpec(), env)
    assert.equal(second.status, 1)
    assert.match(second.stderr, /already exists/)
    assert.equal(readFileSync(join(root, 'new-domain', 'contract.json'), 'utf8'), before)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
