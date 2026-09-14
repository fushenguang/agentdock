import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { getTemplate } from '../registry.js'
import { scaffoldProject } from '../scaffold.js'
import { isWorkspaceMember, satisfiesVersionRange } from '../workspace.js'

function writeWorkspaceRoot(
  root: string,
  options: {
    packageManager?: string
    allowBuilds?: string
  } = {},
): void {
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify(
      {
        name: 'workspace-probe',
        private: true,
        packageManager: options.packageManager ?? 'pnpm@12.4.1',
      },
      null,
      2,
    ) + '\n',
  )
  writeFileSync(
    join(root, 'pnpm-workspace.yaml'),
    `packages:\n  - 'apps/*'\n  - '!apps/excluded'\n${options.allowBuilds ?? ''}`,
  )
  writeFileSync(join(root, 'pnpm-lock.yaml'), "lockfileVersion: '9.0'\nimporters: {}\n")
}

describe('workspace placement helpers', () => {
  it('matches positive globs and honors negative globs', () => {
    const root = '/repo'
    expect(isWorkspaceMember(root, '/repo/apps/web', ['apps/*'])).toBe(true)
    expect(isWorkspaceMember(root, '/repo/apps/excluded', ['apps/*', '!apps/excluded'])).toBe(false)
    expect(isWorkspaceMember(root, '/repo/foo', ['**/foo'])).toBe(true)
    expect(isWorkspaceMember(root, '/repo/packages/foo', ['packages/**/foo'])).toBe(true)
  })

  it('checks simple semver ranges used by template engines', () => {
    expect(satisfiesVersionRange('10.34.5', '>=10.34.5 <13')).toBe(true)
    expect(satisfiesVersionRange('12.4.1', '>=10.34.5 <13')).toBe(true)
    expect(satisfiesVersionRange('10.0.0', '>=10.34.5 <13')).toBe(false)
    expect(satisfiesVersionRange('10.34.5', '^10.34.5')).toBe(true)
    expect(satisfiesVersionRange('10.40.0', '~10.34.0')).toBe(false)
    expect(satisfiesVersionRange('10.34.5', '10.x')).toBe(true)
    expect(satisfiesVersionRange('22.13.0', '>=22.13.0')).toBe(true)
  })
})

describe('scaffoldProject — workspace placement', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `agentdock-workspace-mode-${Date.now()}-${Math.random()}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('renders web-tanstackstart as a workspace member without nested install ownership', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir, {
      allowBuilds: 'allowBuilds:\n  esbuild: true\n',
    })
    const targetDir = join(tmpDir, 'apps', 'workspace-web')
    const result = scaffoldProject({
      targetDir,
      name: 'workspace-web',
      template,
      packageManager: 'pnpm',
      mode: 'auto',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.mode).toBe('workspace')
    expect(result.workspaceRoot).toBe(tmpDir)
    expect(result.lockfileOwner).toBe(join(tmpDir, 'pnpm-lock.yaml'))
    expect(existsSync(join(targetDir, 'pnpm-workspace.yaml'))).toBe(false)
    expect(existsSync(join(targetDir, 'pnpm-lock.yaml'))).toBe(false)
    expect(existsSync(join(targetDir, '.npmrc'))).toBe(false)

    const pkg = JSON.parse(readFileSync(join(targetDir, 'package.json'), 'utf-8')) as {
      packageManager?: string
      engines?: { node?: string; pnpm?: string }
    }
    expect(pkg.packageManager).toBeUndefined()
    expect(pkg.engines?.pnpm).toBeUndefined()
    expect(pkg.engines?.node).toBe('>=22.13.0')

    expect(result.requiredRootChanges).toEqual([
      {
        file: 'pnpm-workspace.yaml',
        operation: 'mergeAllowBuilds',
        entries: {
          '@astryxdesign/cli': true,
          '@astryxdesign/core': true,
          'better-sqlite3': false,
          lightningcss: true,
        },
      },
    ])
    expect(result.rootConfigConflicts).toEqual([])

    const context = JSON.parse(
      readFileSync(join(targetDir, '.agentdock', 'workspace.json'), 'utf-8'),
    ) as {
      mode: string
      workspaceRoot: string
      lockfileOwner: string
      recommendedCommands: { check: string }
    }
    expect(context.mode).toBe('workspace')
    expect(context.workspaceRoot).toBe('../..')
    expect(context.lockfileOwner).toBe('../../pnpm-lock.yaml')
    expect(context.recommendedCommands.check).toBe("pnpm --filter 'workspace-web' check")

    const agents = readFileSync(join(targetDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('AgentDock workspace member')
    expect(agents).toContain('Do not run `pnpm install` in this directory')
  })

  it('keeps standalone output unchanged outside a workspace', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    const targetDir = join(tmpDir, 'standalone-web')
    const result = scaffoldProject({
      targetDir,
      name: 'standalone-web',
      template,
      packageManager: 'pnpm',
      mode: 'auto',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.mode).toBe('standalone')
    expect(result.lockfileOwner).toBe(join(targetDir, 'pnpm-lock.yaml'))
    expect(existsSync(join(targetDir, 'pnpm-workspace.yaml'))).toBe(true)
    expect(existsSync(join(targetDir, 'pnpm-lock.yaml'))).toBe(true)
    expect(existsSync(join(targetDir, '.npmrc'))).toBe(false)
    expect(existsSync(join(targetDir, '.agentdock', 'workspace.json'))).toBe(false)

    const pkg = JSON.parse(readFileSync(join(targetDir, 'package.json'), 'utf-8')) as {
      packageManager?: string
      engines?: { pnpm?: string }
    }
    expect(pkg.packageManager).toBeUndefined()
    expect(pkg.engines?.pnpm).toBe('>=10.34.5 <13')
  })

  it('allows standalone mode for a target excluded by a negative glob', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir)
    const targetDir = join(tmpDir, 'apps', 'excluded')
    const result = scaffoldProject({
      targetDir,
      name: 'excluded-web',
      template,
      packageManager: 'pnpm',
      mode: 'standalone',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.mode).toBe('standalone')
    expect(existsSync(join(targetDir, 'pnpm-workspace.yaml'))).toBe(true)
    expect(existsSync(join(targetDir, 'pnpm-lock.yaml'))).toBe(true)
  })

  it('rejects standalone mode when the parent workspace matches the target', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir)
    const targetDir = join(tmpDir, 'apps', 'matched-standalone')
    const result = scaffoldProject({
      targetDir,
      name: 'matched-standalone',
      template,
      packageManager: 'pnpm',
      mode: 'standalone',
    })

    expect(result.ok).toBe(false)
    expect((result as { error: string }).error).toBe('WORKSPACE_STANDALONE_CONFLICT')
    expect(existsSync(targetDir)).toBe(false)
  })

  it('rejects workspace mode when no parent glob matches', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir)
    const targetDir = join(tmpDir, 'tools', 'not-a-member')
    const result = scaffoldProject({
      targetDir,
      name: 'not-a-member',
      template,
      packageManager: 'pnpm',
      mode: 'workspace',
    })

    expect(result.ok).toBe(false)
    expect((result as { error: string }).error).toBe('WORKSPACE_NOT_MATCHED')
    expect(existsSync(targetDir)).toBe(false)
  })

  it('fails before writing when the root pnpm version is incompatible', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir, { packageManager: 'pnpm@10.0.0' })
    const targetDir = join(tmpDir, 'apps', 'old-pnpm')
    const result = scaffoldProject({
      targetDir,
      name: 'old-pnpm',
      template,
      packageManager: 'pnpm',
      mode: 'workspace',
    })

    expect(result.ok).toBe(false)
    expect((result as { error: string }).error).toBe('WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE')
    expect((result as { message: string }).message).toContain('pnpm >=10.34.5 <13')
    expect(existsSync(targetDir)).toBe(false)
  })

  it('accepts a supported pnpm 10 workspace root', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir, { packageManager: 'pnpm@10.34.5' })
    const targetDir = join(tmpDir, 'apps', 'pnpm-10-root')
    const result = scaffoldProject({
      targetDir,
      name: 'pnpm-10-root',
      template,
      packageManager: 'pnpm',
      mode: 'workspace',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.mode).toBe('workspace')
  })

  it('reports allowBuilds conflicts without overwriting root policy', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir, {
      allowBuilds: 'allowBuilds:\n  better-sqlite3: set this to true or false\n  esbuild: true\n',
    })
    const rootConfigBefore = readFileSync(join(tmpDir, 'pnpm-workspace.yaml'), 'utf-8')
    const targetDir = join(tmpDir, 'apps', 'conflict-web')
    const result = scaffoldProject({
      targetDir,
      name: 'conflict-web',
      template,
      packageManager: 'pnpm',
      mode: 'workspace',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rootConfigConflicts).toEqual([
      {
        key: 'better-sqlite3',
        expected: false,
        actual: 'set this to true or false',
      },
    ])
    expect(result.requiredRootChanges[0]?.entries).not.toHaveProperty('better-sqlite3')
    expect(readFileSync(join(tmpDir, 'pnpm-workspace.yaml'), 'utf-8')).toBe(rootConfigBefore)
  })

  it('returns a structured error for a malformed workspace root package.json', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir)
    writeFileSync(join(tmpDir, 'package.json'), '{ invalid json')
    const targetDir = join(tmpDir, 'apps', 'malformed-root')

    expect(() =>
      scaffoldProject({
        targetDir,
        name: 'malformed-root',
        template,
        packageManager: 'pnpm',
        mode: 'workspace',
      }),
    ).not.toThrow()

    const result = scaffoldProject({
      targetDir,
      name: 'malformed-root',
      template,
      packageManager: 'pnpm',
      mode: 'workspace',
    })
    expect(result.ok).toBe(false)
    expect((result as { error: string }).error).toBe('WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE')
    expect(existsSync(targetDir)).toBe(false)
  })

  it('quotes project names in workspace commands and agent instructions', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir)
    const name = 'worker; echo pwn'
    const targetDir = join(tmpDir, 'apps', 'quoted-name')
    const result = scaffoldProject({
      targetDir,
      name,
      template,
      packageManager: 'pnpm',
      mode: 'workspace',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const context = JSON.parse(
      readFileSync(join(targetDir, '.agentdock', 'workspace.json'), 'utf-8'),
    ) as { recommendedCommands: { check: string } }
    expect(context.recommendedCommands.check).toBe("pnpm --filter 'worker; echo pwn' check")

    const agents = readFileSync(join(targetDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain("pnpm --filter 'worker; echo pwn' check")
    expect(agents).not.toContain('pnpm --filter worker; echo pwn check')
  })

  it('rejects workspace mode for a template without opt-in metadata', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')
    const { workspaceMember: _ignored, ...standaloneOnlyTemplate } = template

    writeWorkspaceRoot(tmpDir)
    const targetDir = join(tmpDir, 'apps', 'unsupported')
    const result = scaffoldProject({
      targetDir,
      name: 'unsupported',
      template: standaloneOnlyTemplate,
      packageManager: 'pnpm',
      mode: 'workspace',
    })

    expect(result.ok).toBe(false)
    expect((result as { error: string }).error).toBe('WORKSPACE_MODE_UNSUPPORTED')
    expect(existsSync(targetDir)).toBe(false)
  })
})
