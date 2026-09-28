import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { getIntegration, getIntegrations, getTemplate } from '../registry.js'
import { normalizeIntegrations } from '../integrations.js'
import { scaffoldProject } from '../scaffold.js'
import {
  getTemplateSchemaTool,
  listTemplatesTool,
  SCAFFOLD_PROJECT_INPUT_SCHEMA,
} from '../../adapters/mcp/tools.js'

function writeWorkspaceRoot(root: string): void {
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify(
      { name: 'workspace-probe', private: true, packageManager: 'pnpm@12.4.1' },
      null,
      2,
    ) + '\n',
  )
  writeFileSync(join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'apps/*'\n")
  writeFileSync(join(root, 'pnpm-lock.yaml'), "lockfileVersion: '9.0'\nimporters: {}\n")
}

describe('integration registry and normalization', () => {
  it('exposes Mastra for both TanStack Start templates', () => {
    expect(getIntegration('mastra')?.compatibleTemplates).toEqual([
      'web-tanstackstart',
      'web-tanstackstart-kids',
    ])
    expect(getIntegrations().map((integration) => integration.id)).toContain('mastra')
  })

  it('normalizes repeated and comma-separated values deterministically', () => {
    expect(normalizeIntegrations(['mastra, future', 'mastra', ' other '])).toEqual([
      'mastra',
      'future',
      'other',
    ])
  })

  it('exposes integration input through the MCP scaffold schema', () => {
    expect(SCAFFOLD_PROJECT_INPUT_SCHEMA.properties.integrations).toMatchObject({
      type: 'array',
      items: { type: 'string', enum: ['mastra'] },
    })
    expect(SCAFFOLD_PROJECT_INPUT_SCHEMA.properties.dataLayer).toBeDefined()
    expect(SCAFFOLD_PROJECT_INPUT_SCHEMA.properties.displayName).toBeDefined()
  })

  it('exposes Mastra compatibility through MCP template metadata', async () => {
    const list = (await listTemplatesTool.handler({})) as {
      templates: Array<{ id: string; integrations: string[] }>
    }
    expect(
      list.templates.find((template) => template.id === 'web-tanstackstart')?.integrations,
    ).toEqual(['mastra'])

    const schema = (await getTemplateSchemaTool.handler({ templateId: 'web-tanstackstart' })) as {
      initParams: {
        properties: {
          integrations: { items: { enum: string[] } }
        }
      }
    }
    expect(schema.initParams.properties.integrations.items.enum).toEqual(['mastra'])
  })
})

describe('scaffoldProject — integrations', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `agentdock-integration-test-${Date.now()}-${Math.random()}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('keeps the default template free of Mastra files and dependencies', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    const targetDir = join(tmpDir, 'default-app')
    const result = scaffoldProject({
      targetDir,
      name: 'default-app',
      template,
      packageManager: 'pnpm',
      dataLayer: 'sqlite',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.integrations).toBeUndefined()
    expect(existsSync(join(targetDir, 'src', 'mastra'))).toBe(false)
    expect(existsSync(join(targetDir, 'vite.config.mastra.ts'))).toBe(false)

    const pkg = JSON.parse(readFileSync(join(targetDir, 'package.json'), 'utf-8')) as {
      dependencies?: Record<string, string>
    }
    expect(pkg.dependencies?.['@mastra/core']).toBeUndefined()
  })

  it('scaffolds Mastra for the enterprise template with a matching standalone lockfile', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    const targetDir = join(tmpDir, 'mastra-app')
    const result = scaffoldProject({
      targetDir,
      name: 'mastra-app',
      template,
      packageManager: 'pnpm',
      dataLayer: 'sqlite',
      integrations: ['mastra'],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.integrations).toEqual(['mastra'])
    expect(existsSync(join(targetDir, 'src', 'mastra', 'index.ts'))).toBe(true)
    expect(existsSync(join(targetDir, 'src', 'routes', 'api', '$.ts'))).toBe(true)
    expect(existsSync(join(targetDir, 'docs', 'mastra.md'))).toBe(true)
    expect(readFileSync(join(targetDir, '.env.example'), 'utf-8')).toContain('OPENAI_API_KEY=')

    const pkg = JSON.parse(readFileSync(join(targetDir, 'package.json'), 'utf-8')) as {
      dependencies?: Record<string, string>
    }
    expect(pkg.dependencies?.['@mastra/core']).toBe('^1.71.0')
    expect(pkg.dependencies?.['@mastra/tanstack-start']).toBe('^0.2.29')
    expect(pkg.dependencies?.['hono']).toBe('^4.13.10')
    expect(pkg.dependencies?.['zod']).toBe('^4.6.4')
    expect(readFileSync(join(targetDir, 'pnpm-lock.yaml'), 'utf-8')).toContain(
      '@mastra/core@1.71.0',
    )
  })

  it('scaffolds the same runtime for kids without a second UI dependency', () => {
    const template = getTemplate('web-tanstackstart-kids')
    if (!template) throw new Error('web-tanstackstart-kids template not found in registry')

    const targetDir = join(tmpDir, 'mastra-kids')
    const result = scaffoldProject({
      targetDir,
      name: 'mastra-kids',
      template,
      packageManager: 'pnpm',
      dataLayer: 'supabase',
      integrations: ['mastra'],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(existsSync(join(targetDir, 'src', 'mastra', 'index.ts'))).toBe(true)

    const pkg = JSON.parse(readFileSync(join(targetDir, 'package.json'), 'utf-8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    expect(pkg.dependencies?.['animal-island-ui']).toBeUndefined()
    expect(pkg.dependencies?.['naive-icons']).toBeUndefined()
    expect(pkg.devDependencies?.['animal-island-ui']).toBeUndefined()
    expect(pkg.devDependencies?.['naive-icons']).toBeUndefined()
  })

  it('does not copy the standalone variant lockfile into a workspace member', () => {
    const template = getTemplate('web-tanstackstart')
    if (!template) throw new Error('web-tanstackstart template not found in registry')

    writeWorkspaceRoot(tmpDir)
    const targetDir = join(tmpDir, 'apps', 'mastra-workspace')
    const result = scaffoldProject({
      targetDir,
      name: 'mastra-workspace',
      template,
      packageManager: 'pnpm',
      mode: 'workspace',
      integrations: ['mastra'],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.mode).toBe('workspace')
    expect(existsSync(join(targetDir, 'src', 'mastra', 'index.ts'))).toBe(true)
    expect(existsSync(join(targetDir, 'pnpm-lock.yaml'))).toBe(false)
    expect(existsSync(join(targetDir, 'pnpm-workspace.yaml'))).toBe(false)
  })

  it('rejects unknown and incompatible integrations before writing files', () => {
    const tanstack = getTemplate('web-tanstackstart')
    const game = getTemplate('game-web-phaser')
    if (!tanstack || !game) throw new Error('required template not found in registry')

    const unknownTarget = join(tmpDir, 'unknown-integration')
    const unknown = scaffoldProject({
      targetDir: unknownTarget,
      name: 'unknown-integration',
      template: tanstack,
      integrations: ['does-not-exist'],
    })
    expect(unknown.ok).toBe(false)
    expect((unknown as { error: string }).error).toBe('INVALID_INTEGRATION')
    expect(existsSync(unknownTarget)).toBe(false)

    const incompatibleTarget = join(tmpDir, 'incompatible-integration')
    const incompatible = scaffoldProject({
      targetDir: incompatibleTarget,
      name: 'incompatible-integration',
      template: game,
      integrations: ['mastra'],
    })
    expect(incompatible.ok).toBe(false)
    expect((incompatible as { error: string }).error).toBe('INTEGRATION_NOT_SUPPORTED')
    expect(existsSync(incompatibleTarget)).toBe(false)
  })
})
