import { existsSync, readFileSync, statSync } from 'fs'
import { dirname, join, relative, resolve, sep } from 'path'
import { satisfies as semverSatisfies } from 'semver'
import type { RegistryTemplate } from './registry.js'

export const INIT_MODES = ['auto', 'workspace', 'standalone'] as const

export type InitMode = (typeof INIT_MODES)[number]
export type ResolvedInitMode = Exclude<InitMode, 'auto'>

export function isInitMode(value: string): value is InitMode {
  return INIT_MODES.includes(value as InitMode)
}

export interface RootConfigConflict {
  key: string
  expected: boolean
  actual: unknown
}

export interface RequiredRootChange {
  file: 'pnpm-workspace.yaml'
  operation: 'mergeAllowBuilds'
  entries: Record<string, boolean>
}

export interface WorkspacePlacement {
  mode: ResolvedInitMode
  workspaceRoot?: string
  lockfileOwner: string
  requiredRootChanges: RequiredRootChange[]
  rootConfigConflicts: RootConfigConflict[]
  packageManager?: string
}

export type WorkspacePlacementErrorCode =
  | 'INVALID_MODE'
  | 'WORKSPACE_MODE_UNSUPPORTED'
  | 'WORKSPACE_NOT_MATCHED'
  | 'WORKSPACE_STANDALONE_CONFLICT'
  | 'WORKSPACE_CONFIG_INVALID'
  | 'WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE'
  | 'WORKSPACE_NODE_INCOMPATIBLE'

export interface WorkspacePlacementError {
  ok: false
  error: WorkspacePlacementErrorCode
  message: string
}

export interface WorkspacePlacementSuccess {
  ok: true
  placement: WorkspacePlacement
}

export type WorkspacePlacementResult = WorkspacePlacementSuccess | WorkspacePlacementError

interface WorkspaceConfig {
  packages: string[]
  allowBuilds: Record<string, unknown>
}

interface NearestWorkspace {
  root: string
  config: WorkspaceConfig
}

function toPosix(value: string): string {
  return value.split(sep).join('/')
}

function stripYamlComment(line: string): string {
  let singleQuoted = false
  let doubleQuoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const previous = i > 0 ? line[i - 1] : ''
    if (char === "'" && !doubleQuoted && previous !== '\\') singleQuoted = !singleQuoted
    if (char === '"' && !singleQuoted && previous !== '\\') doubleQuoted = !doubleQuoted
    if (char === '#' && !singleQuoted && !doubleQuoted) return line.slice(0, i)
  }
  return line
}

function unquoteYamlScalar(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
      return trimmed.slice(1, -1)
    }
  }
  return trimmed
}

function splitInlineList(value: string): string[] {
  const inner = value.trim().slice(1, -1).trim()
  if (!inner) return []

  const values: string[] = []
  let current = ''
  let singleQuoted = false
  let doubleQuoted = false
  for (let i = 0; i < inner.length; i++) {
    const char = inner[i]
    const previous = i > 0 ? inner[i - 1] : ''
    if (char === "'" && !doubleQuoted && previous !== '\\') singleQuoted = !singleQuoted
    if (char === '"' && !singleQuoted && previous !== '\\') doubleQuoted = !doubleQuoted
    if (char === ',' && !singleQuoted && !doubleQuoted) {
      values.push(unquoteYamlScalar(current))
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) values.push(unquoteYamlScalar(current))
  return values
}

function findTopLevelKey(lines: string[], key: string): { index: number; value: string } | null {
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? ''
    if (/^\s/.test(raw)) continue
    const withoutComment = stripYamlComment(raw)
    const match = withoutComment.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!match || match[1] !== key) continue
    return { index: i, value: match[2] ?? '' }
  }
  return null
}

function parseTopLevelList(lines: string[], key: string): string[] | null {
  const found = findTopLevelKey(lines, key)
  if (!found) return null
  const value = found.value.trim()

  if (value.startsWith('[') && value.endsWith(']')) return splitInlineList(value)
  if (value) throw new Error(`Unsupported inline value for ${key}: ${value}`)

  const values: string[] = []
  for (let i = found.index + 1; i < lines.length; i++) {
    const raw = lines[i] ?? ''
    if (!raw.trim()) continue
    if (!/^\s/.test(raw)) break
    const withoutComment = stripYamlComment(raw).trim()
    if (!withoutComment) continue
    const match = withoutComment.match(/^-\s*(.+)$/)
    if (!match) throw new Error(`Unsupported ${key} list item: ${raw}`)
    values.push(unquoteYamlScalar(match[1] ?? ''))
  }
  return values
}

function parseTopLevelMap(lines: string[], key: string): Record<string, unknown> {
  const found = findTopLevelKey(lines, key)
  if (!found) return {}
  const value = found.value.trim()
  if (value === '{}') return {}
  if (value) throw new Error(`Unsupported inline value for ${key}: ${value}`)

  const values: Record<string, unknown> = {}
  for (let i = found.index + 1; i < lines.length; i++) {
    const raw = lines[i] ?? ''
    if (!raw.trim()) continue
    if (!/^\s/.test(raw)) break
    const withoutComment = stripYamlComment(raw).trim()
    if (!withoutComment) continue

    let separator = -1
    let singleQuoted = false
    let doubleQuoted = false
    for (let j = 0; j < withoutComment.length; j++) {
      const char = withoutComment[j]
      const previous = j > 0 ? withoutComment[j - 1] : ''
      if (char === "'" && !doubleQuoted && previous !== '\\') singleQuoted = !singleQuoted
      if (char === '"' && !singleQuoted && previous !== '\\') doubleQuoted = !doubleQuoted
      if (char === ':' && !singleQuoted && !doubleQuoted) {
        separator = j
        break
      }
    }
    if (separator === -1) throw new Error(`Unsupported ${key} map item: ${raw}`)

    const entryKey = unquoteYamlScalar(withoutComment.slice(0, separator))
    const entryValue = unquoteYamlScalar(withoutComment.slice(separator + 1))
    if (!entryKey) throw new Error(`Empty ${key} key: ${raw}`)
    if (entryValue === 'true') values[entryKey] = true
    else if (entryValue === 'false') values[entryKey] = false
    else values[entryKey] = entryValue
  }
  return values
}

function readWorkspaceConfig(workspaceFile: string): WorkspaceConfig {
  const lines = readFileSync(workspaceFile, 'utf-8').split(/\r?\n/)
  const packages = parseTopLevelList(lines, 'packages')
  if (packages === null) {
    throw new Error('pnpm-workspace.yaml is missing a top-level packages list')
  }
  const unsupportedPattern = packages.find((pattern) => /[\[\]{}()]/.test(pattern))
  if (unsupportedPattern) {
    throw new Error(
      `Unsupported pnpm workspace glob "${unsupportedPattern}". Only "*", "**", and leading "!" are supported by this CLI version.`,
    )
  }
  return {
    packages,
    allowBuilds: parseTopLevelMap(lines, 'allowBuilds'),
  }
}

function findNearestWorkspace(targetDir: string): NearestWorkspace | null {
  let current = existsSync(targetDir) ? resolve(targetDir) : dirname(resolve(targetDir))

  while (true) {
    const workspaceFile = join(current, 'pnpm-workspace.yaml')
    if (existsSync(workspaceFile) && statSync(workspaceFile).isFile()) {
      return { root: current, config: readWorkspaceConfig(workspaceFile) }
    }
    const parent = dirname(current)
    if (parent === current) return null
    current = parent
  }
}

function globToRegExp(pattern: string): RegExp {
  let normalized = pattern.trim().replaceAll('\\', '/')
  if (normalized.startsWith('./')) normalized = normalized.slice(2)
  normalized = normalized.replace(/\/+$/, '')

  let source = ''
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]
    if (char === '*') {
      if (normalized[i + 1] === '*') {
        if (normalized[i + 2] === '/') {
          source += '(?:.*/)?'
          i += 2
        } else {
          source += '.*'
          i += 1
        }
      } else {
        source += '[^/]*'
      }
    } else if (char === '?') {
      source += '[^/]'
    } else {
      source += (char ?? '').replace(/[|\\{}()[\]^$+?.-]/g, '\\$&')
    }
  }
  return new RegExp(`^${source}$`)
}

export function isWorkspaceMember(
  workspaceRoot: string,
  targetDir: string,
  patterns: string[],
): boolean {
  const relativePath = toPosix(relative(workspaceRoot, resolve(targetDir)))
  if (relativePath === '' || relativePath === '..' || relativePath.startsWith('../')) return false

  const positive = patterns.filter((pattern) => !pattern.startsWith('!'))
  const negative = patterns
    .filter((pattern) => pattern.startsWith('!'))
    .map((pattern) => pattern.slice(1))

  const matchesPositive = positive.some((pattern) => globToRegExp(pattern).test(relativePath))
  const matchesNegative = negative.some((pattern) => globToRegExp(pattern).test(relativePath))
  return matchesPositive && !matchesNegative
}

export function satisfiesVersionRange(version: string, range: string): boolean {
  return semverSatisfies(version, range)
}

function readRootPackageManager(workspaceRoot: string): string | undefined {
  const packageFile = join(workspaceRoot, 'package.json')
  if (!existsSync(packageFile)) return undefined
  let pkg: { packageManager?: unknown }
  try {
    pkg = JSON.parse(readFileSync(packageFile, 'utf-8')) as {
      packageManager?: unknown
    }
  } catch {
    return undefined
  }
  return typeof pkg.packageManager === 'string' ? pkg.packageManager : undefined
}

function requiredPnpmRange(template: RegistryTemplate): string | null {
  if (template.engines?.pnpm) return template.engines.pnpm
  if (template.packageManagerVersion) return `=${template.packageManagerVersion}`
  return null
}

function validateWorkspaceCompatibility(
  template: RegistryTemplate,
  workspaceRoot: string,
): WorkspacePlacementError | null {
  const packageManager = readRootPackageManager(workspaceRoot)
  if (!packageManager?.startsWith('pnpm@')) {
    return {
      ok: false,
      error: 'WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE',
      message:
        'The workspace root must declare packageManager "pnpm@<version>" before a workspace member can be generated.',
    }
  }

  const pnpmVersion = packageManager.slice('pnpm@'.length)
  const pnpmRange = requiredPnpmRange(template)
  if (pnpmRange && !satisfiesVersionRange(pnpmVersion, pnpmRange)) {
    return {
      ok: false,
      error: 'WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE',
      message: `Workspace root uses ${packageManager}, but template "${template.id}" requires pnpm ${pnpmRange}. Upgrade the workspace root or generate the project outside this workspace.`,
    }
  }

  const nodeRange = template.engines?.node
  if (nodeRange && !satisfiesVersionRange(process.versions.node, nodeRange)) {
    return {
      ok: false,
      error: 'WORKSPACE_NODE_INCOMPATIBLE',
      message: `Current Node ${process.versions.node} does not satisfy template "${template.id}" requirement ${nodeRange}. Use a compatible Node version before initializing a workspace member.`,
    }
  }

  return null
}

function computeRootChanges(
  template: RegistryTemplate,
  config: WorkspaceConfig,
): { requiredRootChanges: RequiredRootChange[]; rootConfigConflicts: RootConfigConflict[] } {
  const required = template.workspaceMember?.rootAllowBuilds ?? {}
  const entries: Record<string, boolean> = {}
  const conflicts: RootConfigConflict[] = []

  for (const [key, expected] of Object.entries(required)) {
    if (!Object.hasOwn(config.allowBuilds, key)) {
      entries[key] = expected
      continue
    }
    const actual = config.allowBuilds[key]
    if (actual !== expected) conflicts.push({ key, expected, actual })
  }

  return {
    requiredRootChanges:
      Object.keys(entries).length > 0
        ? [{ file: 'pnpm-workspace.yaml', operation: 'mergeAllowBuilds', entries }]
        : [],
    rootConfigConflicts: conflicts,
  }
}

export function resolveWorkspacePlacement(options: {
  targetDir: string
  mode: InitMode
  template: RegistryTemplate
}): WorkspacePlacementResult {
  const targetDir = resolve(options.targetDir)

  if (!INIT_MODES.includes(options.mode)) {
    return {
      ok: false,
      error: 'INVALID_MODE',
      message: `Unsupported placement mode "${String(options.mode)}". Use auto, workspace, or standalone.`,
    }
  }

  if (options.mode === 'workspace' && !options.template.workspaceMember) {
    return {
      ok: false,
      error: 'WORKSPACE_MODE_UNSUPPORTED',
      message: `Template "${options.template.id}" does not support workspace-member generation.`,
    }
  }

  let nearest: NearestWorkspace | null
  try {
    nearest = findNearestWorkspace(targetDir)
  } catch (err) {
    return {
      ok: false,
      error: 'WORKSPACE_CONFIG_INVALID',
      message: err instanceof Error ? err.message : String(err),
    }
  }

  const matched = nearest
    ? isWorkspaceMember(nearest.root, targetDir, nearest.config.packages)
    : false

  if (options.mode === 'workspace' && !matched) {
    return {
      ok: false,
      error: 'WORKSPACE_NOT_MATCHED',
      message: `Target "${targetDir}" is not matched by a pnpm workspace packages glob.`,
    }
  }

  if (options.mode === 'standalone' && matched) {
    return {
      ok: false,
      error: 'WORKSPACE_STANDALONE_CONFLICT',
      message: `Target "${targetDir}" is a member of workspace "${nearest?.root}". Move it outside the workspace or add a negative packages glob before using --mode standalone.`,
    }
  }

  if (matched && nearest) {
    if (!options.template.workspaceMember) {
      return {
        ok: false,
        error: 'WORKSPACE_MODE_UNSUPPORTED',
        message: `Template "${options.template.id}" does not support workspace-member generation.`,
      }
    }

    const compatibilityError = validateWorkspaceCompatibility(options.template, nearest.root)
    if (compatibilityError) return compatibilityError
    const packageManager = readRootPackageManager(nearest.root)

    return {
      ok: true,
      placement: {
        mode: 'workspace',
        workspaceRoot: nearest.root,
        lockfileOwner: join(nearest.root, 'pnpm-lock.yaml'),
        ...(packageManager ? { packageManager } : {}),
        ...computeRootChanges(options.template, nearest.config),
      },
    }
  }

  return {
    ok: true,
    placement: {
      mode: 'standalone',
      lockfileOwner: join(targetDir, 'pnpm-lock.yaml'),
      requiredRootChanges: [],
      rootConfigConflicts: [],
    },
  }
}
