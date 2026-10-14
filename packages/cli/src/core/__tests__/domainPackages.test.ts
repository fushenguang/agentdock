import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runAgentAdapter } from '../../adapters/agent.js'

let targetDir: string
let mockBinDir: string
let originalPath: string | undefined
type StdoutMock = { mock: { calls: Array<[unknown]> }; mockRestore: () => void }
let stdoutWrite: StdoutMock

beforeEach(() => {
  targetDir = join(
    tmpdir(),
    `agentdock-domain-package-init-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  mockBinDir = join(targetDir, '..', 'agentdock-domain-package-init.mock-bin')
  mkdirSync(mockBinDir, { recursive: true })
  originalPath = process.env.PATH
  stdoutWrite = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation(() => true) as unknown as StdoutMock
})

afterEach(() => {
  stdoutWrite.mockRestore()
  if (originalPath !== undefined) process.env.PATH = originalPath
  rmSync(targetDir, { recursive: true, force: true })
  rmSync(mockBinDir, { recursive: true, force: true })
  process.exitCode = 0
})

function installMockNpx(): void {
  const file = join(mockBinDir, 'npx')
  writeFileSync(
    file,
    [
      '#!/bin/sh',
      'if ! printf "%s\\n" "$*" | grep -q -- "@cogito.ai/cli@0.27.1"; then',
      '  echo "expected pinned AgentDock CLI" >&2',
      '  exit 2',
      'fi',
      'app="apps/web"',
      'mkdir -p "$app/src"',
      'printf \'{"name":"web","private":true,"scripts":{"dev":"echo dev","check":"node --test","build":"echo build"}}\\n\' > "$app/package.json"',
      'printf "export {}\\n" > "$app/src/placeholder.ts"',
      '',
    ].join('\n'),
  )
  chmodSync(file, 0o755)
  process.env.PATH = `${mockBinDir}:${process.env.PATH}`
}

function emittedJson(): Record<string, unknown> {
  const lines = stdoutWrite.mock.calls.map((call) => String(call[0])).filter(Boolean)
  const output = lines.at(-1)
  expect(output).toBeDefined()
  return JSON.parse(output ?? '') as Record<string, unknown>
}

describe('domain-packages init onboarding', () => {
  it('creates the first package non-interactively from explicit fields', async () => {
    installMockNpx()

    await runAgentAdapter({
      name: 'domain-workspace',
      template: 'domain-packages',
      pm: 'pnpm',
      dir: targetDir,
      json: true,
      domainPackageId: 'new-domain',
      domainPackageIntent:
        'Help the user complete one concrete domain outcome with a reviewable artifact.',
    })

    expect(process.exitCode ?? 0).toBe(0)
    const result = emittedJson()
    expect(result.ok).toBe(true)
    expect(result.domainPackage).toEqual({
      ok: true,
      id: 'new-domain',
      packagePath: join(targetDir, 'apps', 'new-domain'),
      webPath: join(targetDir, 'apps', 'web'),
    })
    expect(existsSync(join(targetDir, 'apps', 'new-domain', 'contract.json'))).toBe(true)
    expect(existsSync(join(targetDir, 'apps', 'web', 'package.json'))).toBe(true)
    expect(existsSync(join(targetDir, 'apps', 'web', '.gitkeep'))).toBe(false)

    const catalog = JSON.parse(readFileSync(join(targetDir, 'catalog.json'), 'utf8')) as {
      packages: Array<{ contextEntry: string }>
    }
    expect(catalog.packages[0]?.contextEntry).toBe('apps/new-domain/AGENTS.md')
  })

  it('supports a package spec without terminal prompts', async () => {
    installMockNpx()
    const specPath = join(targetDir, '..', 'domain-package-spec.json')
    writeFileSync(
      specPath,
      `${JSON.stringify(
        {
          id: 'spec-domain',
          displayName: 'Spec Domain',
          intent: 'Help the user complete one concrete domain outcome with a reviewable artifact.',
          owner: '@team',
          lifecycle: 'active',
          repositoryClass: 'product',
          hasWeb: true,
        },
        null,
        2,
      )}\n`,
    )

    await runAgentAdapter({
      name: 'domain-workspace',
      template: 'domain-packages',
      pm: 'pnpm',
      dir: targetDir,
      json: true,
      domainPackageSpec: specPath,
    })

    expect(process.exitCode ?? 0).toBe(0)
    expect(emittedJson().ok).toBe(true)
    expect(existsSync(join(targetDir, 'apps', 'spec-domain', 'contract.json'))).toBe(true)
    expect(existsSync(join(targetDir, 'apps', 'web', 'package.json'))).toBe(true)
    rmSync(specPath, { force: true })
  })

  it('preserves empty-workspace agent mode when no package input is supplied', async () => {
    await runAgentAdapter({
      name: 'domain-workspace',
      template: 'domain-packages',
      pm: 'pnpm',
      dir: targetDir,
      json: true,
    })

    expect(process.exitCode ?? 0).toBe(0)
    const result = emittedJson()
    expect(result.ok).toBe(true)
    expect(result.domainPackage).toBeUndefined()
    expect(existsSync(join(targetDir, 'apps', 'web', '.gitkeep'))).toBe(true)
  })

  it('rejects a missing package spec before scaffolding', async () => {
    const missingSpec = join(targetDir, '..', 'missing-package-spec.json')

    await runAgentAdapter({
      name: 'domain-workspace',
      template: 'domain-packages',
      pm: 'pnpm',
      dir: targetDir,
      json: true,
      domainPackageSpec: missingSpec,
    })

    expect(process.exitCode).toBe(1)
    expect(emittedJson()).toMatchObject({
      ok: false,
      error: 'DOMAIN_PACKAGE_SPEC_NOT_FOUND',
    })
    expect(existsSync(targetDir)).toBe(false)
  })
})
