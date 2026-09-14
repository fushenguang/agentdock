import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'fs'
import { basename, join, dirname, extname, relative } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import type { PackageManager, RegistryTemplate } from './registry.js'
import { checkVersion } from './version.js'
import {
  resolveWorkspacePlacement,
  type InitMode,
  type RequiredRootChange,
  type ResolvedInitMode,
  type RootConfigConflict,
} from './workspace.js'
import { VERSION as CLI_VERSION } from '../version.js'

/** Single source of truth for the placeholder templates use for the project name. */
export const PROJECT_NAME_PLACEHOLDER = '{{PROJECT_NAME}}'

/** Single source of truth for the placeholder templates use for the data layer. */
export const DATA_LAYER_PLACEHOLDER = '{{DATA_LAYER}}'

// Extensions eligible for {{PROJECT_NAME}} substitution — a whitelist, not a
// blacklist. Templates ship binary assets (audio, images, fonts) that a
// byte-level string replace would corrupt, and the set of binary extensions
// a future template might add is unbounded, so only known-text extensions
// are opted in.
const TEXT_FILE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.html',
  '.md',
  '.mdx',
  '.css',
  '.example',
  '.yml',
  '.yaml',
  '.txt',
])

// Directories never walked into during placeholder substitution: VCS
// metadata and build/dependency output. These can be large, may contain
// third-party files that coincidentally match, and are regenerated or
// reinstalled by the user anyway.
const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  '.next',
  '.turbo',
  '.output',
  '.tanstack',
  '.nitro',
  'coverage',
])

const SKIP_FILE_NAMES = new Set(['.env', '.env.local', '.DS_Store'])

const WORKSPACE_OWNED_ROOT_FILES = new Set([
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
  '.npmrc',
  '_npmrc',
])

export function shouldCopyTemplatePath(source: string): boolean {
  if (source.replaceAll('\\', '/').endsWith('/src/routeTree.gen.ts')) return false
  const name = basename(source)
  if (SKIP_DIR_NAMES.has(name) || SKIP_FILE_NAMES.has(name)) return false
  if (name.startsWith('.env.') && name !== '.env.example') return false
  if (name.endsWith('.db') || name.includes('.db-')) return false
  return true
}

function shouldCopyTemplatePathForMode(
  source: string,
  sourceDir: string,
  mode: ResolvedInitMode,
): boolean {
  if (!shouldCopyTemplatePath(source)) return false
  if (mode !== 'workspace') return true

  const sourceRelativePath = relative(sourceDir, source).replaceAll('\\', '/')
  return !WORKSPACE_OWNED_ROOT_FILES.has(sourceRelativePath)
}

// `name` is written verbatim into generated HTML (<title> text content) and
// TS/JS string literals (StartScene.ts) via a plain string replace, not a
// template engine that understands where it lands syntactically. Rather than
// writing per-context escaping (HTML-entity-encode here, JS-string-escape
// there) -- which has to be re-derived for every new file/context a template
// adds and silently breaks if one is missed -- we validate the character set
// up front and reject names that could break out of any of those contexts.
// This is the simpler and safer of the two options the fix must document.
//
// Blocks: HTML/XML-significant chars (< > &), quote/backtick chars that
// close out of a string literal (" ' `), a literal backslash (which would
// alter escaping in the file it lands in), and C0 control characters
// (0x00-0x1F, e.g. a raw newline breaking a single-line JSON/TS string).
export function validateProjectName(name: string): string | null {
  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i)
    const char = name[i]
    const isControlChar = code <= 0x1f
    const isSyntaxChar =
      char === '<' ||
      char === '>' ||
      char === '&' ||
      char === '"' ||
      char === "'" ||
      char === '`' ||
      char === '\\'
    if (isControlChar || isSyntaxChar) {
      return `Project name contains characters that are unsafe to embed in generated source files (< > & " ' \` \\ or control characters): "${name}"`
    }
  }
  return null
}

export interface ScaffoldOptions {
  /** Target directory path (absolute or relative to cwd) */
  targetDir: string
  /** Project name written into generated package.json. Must be a valid npm
   *  package name / filesystem-safe slug — this is NOT substituted for
   *  {@link PROJECT_NAME_PLACEHOLDER}, see `displayName`. */
  name: string
  /** Template entry from the registry */
  template: RegistryTemplate
  /** Package manager hint written into generated README / lock hint */
  packageManager?: PackageManager
  /** Schema name to substitute for __SCHEMA__ in .sql files. Undefined = skip substitution. */
  schema?: string | undefined
  /**
   * Human-facing title substituted for {@link PROJECT_NAME_PLACEHOLDER}
   * (e.g. the generated `<title>`, in-game strings). Unlike `name`, this can
   * be any display string, including non-ASCII text — it never becomes an
   * npm package name. When omitted, `name` is used for substitution instead
   * (unchanged, pre-existing behavior).
   */
  displayName?: string | undefined
  /** Template-declared data layer selected by the caller. */
  dataLayer?: string | undefined
  /** Placement mode. `auto` detects whether the target is an existing pnpm workspace member. */
  mode?: InitMode | undefined
}

export interface ScaffoldResult {
  ok: true
  targetDir: string
  name: string
  template: string
  mode: ResolvedInitMode
  workspaceRoot?: string
  lockfileOwner: string
  requiredRootChanges: RequiredRootChange[]
  rootConfigConflicts: RootConfigConflict[]
}

export interface ScaffoldError {
  ok: false
  error:
    | 'TARGET_DIR_EXISTS'
    | 'CLI_VERSION_OUTDATED'
    | 'SCAFFOLD_FAILED'
    | 'INVALID_NAME'
    | 'INVALID_DATA_LAYER'
    | 'INVALID_PACKAGE_MANAGER'
    | 'INVALID_MODE'
    | 'WORKSPACE_MODE_UNSUPPORTED'
    | 'WORKSPACE_NOT_MATCHED'
    | 'WORKSPACE_STANDALONE_CONFLICT'
    | 'WORKSPACE_CONFIG_INVALID'
    | 'WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE'
    | 'WORKSPACE_NODE_INCOMPATIBLE'
  message: string
}

function getTemplateSourceDir(templateSource: string): string {
  const runtimeDir = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    // Built package layout: dist/templates/<id>
    join(runtimeDir, templateSource),
    // Monorepo source layout when running from src/core
    join(runtimeDir, '../../../..', templateSource),
    // Monorepo source layout fallback: <repo>/templates/<id>
    join(runtimeDir, '../../..', templateSource),
  ]

  const sourceDir = candidates.find((p) => existsSync(p))
  if (!sourceDir) {
    throw new Error(
      `Template source not found: ${templateSource}. Looked in: ${candidates.join(', ')}`,
    )
  }

  return sourceDir
}

function rewritePackageJson(
  pkgJsonPath: string,
  name: string,
  resolvedDependencies: Record<string, string>,
  workspaceMember: boolean,
): void {
  const raw = readFileSync(pkgJsonPath, 'utf-8')
  const pkg = JSON.parse(raw) as Record<string, unknown>

  pkg['name'] = name
  pkg['version'] = '0.1.0'
  delete pkg['private']
  // Remove the agentdock meta field from generated projects
  delete pkg['agentdock']

  if (workspaceMember) {
    delete pkg['packageManager']
    const engines = pkg['engines'] as Record<string, unknown> | undefined
    if (engines) {
      delete engines['pnpm']
      if (Object.keys(engines).length === 0) delete pkg['engines']
    }
  }

  // Rewrite workspace:* deps with resolved versions
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
    const deps = pkg[key] as Record<string, string> | undefined
    if (!deps) continue
    for (const [dep, ver] of Object.entries(deps)) {
      if (ver === 'workspace:*' && resolvedDependencies[dep]) {
        deps[dep] = resolvedDependencies[dep]
      }
    }
  }

  writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
}

function writeWorkspaceAgentContext(options: {
  targetDir: string
  name: string
  workspaceRoot: string
  lockfileOwner: string
  packageManager: string
}): void {
  const shellName = `'${options.name.replaceAll("'", "'\\''")}'`
  const workspaceRootRelative =
    relative(options.targetDir, options.workspaceRoot).replaceAll('\\', '/') || '.'
  const lockfileOwnerRelative = relative(options.targetDir, options.lockfileOwner).replaceAll(
    '\\',
    '/',
  )
  const contextDir = join(options.targetDir, '.agentdock')
  mkdirSync(contextDir, { recursive: true })
  writeFileSync(
    join(contextDir, 'workspace.json'),
    JSON.stringify(
      {
        mode: 'workspace',
        workspaceRoot: workspaceRootRelative,
        lockfileOwner: lockfileOwnerRelative,
        packageManager: options.packageManager,
        recommendedCommands: {
          installFromWorkspaceRoot: 'pnpm install',
          check: `pnpm --filter ${shellName} check`,
        },
      },
      null,
      2,
    ) + '\n',
    'utf-8',
  )

  const agentsFile = join(options.targetDir, 'AGENTS.md')
  if (!existsSync(agentsFile)) return
  const notice = `> **AgentDock workspace member**\n>\n> This notice overrides standalone installation instructions elsewhere in this file. This package belongs to a pnpm workspace whose root is ${JSON.stringify(workspaceRootRelative)} relative to this directory. The workspace root owns \`packageManager\`, \`pnpm-lock.yaml\`, and \`allowBuilds\`. Do not run \`pnpm install\` in this directory; from the workspace root run \`pnpm install\` and \`pnpm --filter ${shellName} check\`.\n\n`
  const existing = readFileSync(agentsFile, 'utf-8')
  writeFileSync(agentsFile, notice + existing, 'utf-8')
}

/**
 * Detects the user's installed pnpm version and writes it as the
 * `packageManager` field in the project's root package.json.
 *
 * This allows Turborepo to validate the package manager without requiring
 * `dangerouslyDisablePackageManagerCheck: true` in turbo.json.
 * If pnpm is not in PATH, the field is left unchanged (template keeps its own value).
 */
/**
 * npm hardcodes exclusion of .gitignore and .npmrc from published tarballs.
 * During build we rename them to _gitignore / _npmrc so they survive publish.
 * This function renames them back after the template is copied to the target.
 */
function restoreDotfiles(dir: string): void {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      restoreDotfiles(fullPath)
    } else if (entry.name === '_gitignore') {
      renameSync(fullPath, join(dir, '.gitignore'))
    } else if (entry.name === '_npmrc') {
      renameSync(fullPath, join(dir, '.npmrc'))
    }
  }
}

function replaceSchemaPlaceholder(dir: string, schema: string): void {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      replaceSchemaPlaceholder(fullPath, schema)
    } else if (entry.name.endsWith('.sql')) {
      const content = readFileSync(fullPath, 'utf-8')
      writeFileSync(fullPath, content.replace(/__SCHEMA__/g, schema), 'utf-8')
    }
  }
}

/**
 * Replaces every occurrence of {@link PROJECT_NAME_PLACEHOLDER} with `name`
 * across text files in `dir`. Walks the whole tree except SKIP_DIR_NAMES,
 * and only opens files whose extension is in TEXT_FILE_EXTENSIONS so binary
 * assets are never read/written.
 */
function replacePlaceholderInTextFiles(dir: string, placeholder: string, value: string): void {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue
      replacePlaceholderInTextFiles(fullPath, placeholder, value)
      continue
    }
    if (!TEXT_FILE_EXTENSIONS.has(extname(entry.name))) continue

    const content = readFileSync(fullPath, 'utf-8')
    if (!content.includes(placeholder)) continue
    writeFileSync(fullPath, content.split(placeholder).join(value), 'utf-8')
  }
}

export function replaceProjectNamePlaceholder(dir: string, name: string): void {
  replacePlaceholderInTextFiles(dir, PROJECT_NAME_PLACEHOLDER, name)
}

/** Replaces {{DATA_LAYER}} in generated text files. */
export function replaceDataLayerPlaceholder(dir: string, dataLayer: string): void {
  replacePlaceholderInTextFiles(dir, DATA_LAYER_PLACEHOLDER, dataLayer)
}

function injectPackageManager(pkgJsonPath: string): void {
  if (!existsSync(pkgJsonPath)) return
  try {
    const raw = readFileSync(pkgJsonPath, 'utf-8')
    const pkg = JSON.parse(raw) as Record<string, unknown>
    if (typeof pkg['packageManager'] === 'string' && pkg['packageManager'].length > 0) return

    const pnpmVersion = execSync('pnpm --version', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (!pnpmVersion) return
    pkg['packageManager'] = `pnpm@${pnpmVersion}`
    writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
  } catch {
    // pnpm not found in PATH — skip silently, template's own value remains
  }
}

export function scaffoldProject(options: ScaffoldOptions): ScaffoldResult | ScaffoldError {
  const {
    targetDir,
    name,
    template,
    packageManager: pm,
    schema,
    displayName,
    dataLayer,
    mode = 'auto',
  } = options

  // Reject names that would break out of the HTML/JS/JSON contexts the name
  // gets substituted into below, before touching the filesystem at all.
  const nameError = validateProjectName(name)
  if (nameError) {
    return {
      ok: false,
      error: 'INVALID_NAME',
      message: nameError,
    }
  }

  // displayName lands in the exact same HTML/JS/JSON contexts as `name`
  // (see replaceProjectNamePlaceholder below), so it is subject to the same
  // character-set gate.
  if (displayName !== undefined) {
    const displayNameError = validateProjectName(displayName)
    if (displayNameError) {
      return {
        ok: false,
        error: 'INVALID_NAME',
        message: displayNameError,
      }
    }
  }

  if (dataLayer !== undefined && !template.dataLayers.includes(dataLayer)) {
    return {
      ok: false,
      error: 'INVALID_DATA_LAYER',
      message: `Data layer "${dataLayer}" is not supported by template "${template.id}".`,
    }
  }

  if (template.packageManagerEnforced && pm !== undefined && pm !== template.packageManager) {
    return {
      ok: false,
      error: 'INVALID_PACKAGE_MANAGER',
      message: `Template "${template.id}" requires ${template.packageManager}, received ${pm}.`,
    }
  }

  // Version compatibility check
  try {
    checkVersion(CLI_VERSION, template.minCliVersion, template.id)
  } catch (err) {
    return {
      ok: false,
      error: 'CLI_VERSION_OUTDATED',
      message: JSON.stringify(err),
    }
  }

  // Guard: don't overwrite existing directory
  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    return {
      ok: false,
      error: 'TARGET_DIR_EXISTS',
      message: `Target directory "${targetDir}" already exists and is not empty.`,
    }
  }

  let placementResult: ReturnType<typeof resolveWorkspacePlacement>
  try {
    placementResult = resolveWorkspacePlacement({ targetDir, mode, template })
  } catch (err) {
    return {
      ok: false,
      error: 'WORKSPACE_CONFIG_INVALID',
      message: err instanceof Error ? err.message : String(err),
    }
  }
  if (!placementResult.ok) {
    return {
      ok: false,
      error: placementResult.error,
      message: placementResult.message,
    }
  }
  const placement = placementResult.placement

  try {
    const sourceDir = getTemplateSourceDir(template.source)
    mkdirSync(targetDir, { recursive: true })
    cpSync(sourceDir, targetDir, {
      recursive: true,
      filter: (source) => shouldCopyTemplatePathForMode(source, sourceDir, placement.mode),
    })

    // Restore dotfiles that were renamed to survive npm publish
    restoreDotfiles(targetDir)

    // Rewrite root package.json (name, version, remove internal fields)
    const pkgJsonPath = join(targetDir, 'package.json')
    if (existsSync(pkgJsonPath)) {
      rewritePackageJson(
        pkgJsonPath,
        name,
        template.resolvedDependencies,
        placement.mode === 'workspace',
      )
    }

    // Legacy templates without explicit package-manager enforcement receive the
    // host pnpm version. Range-based templates intentionally keep no exact pin.
    if (placement.mode === 'standalone' && !template.packageManagerEnforced) {
      injectPackageManager(pkgJsonPath)
    }

    // Substitute {{PROJECT_NAME}} placeholder across generated text files
    // (e.g. index.html <title>, StartScene.ts, README.md). displayName, when
    // provided, is the human-facing title (can be non-ASCII); `name` must
    // stay a valid npm package name and is never used for this substitution
    // when displayName is present. Omitted => falls back to `name`, byte-for
    // -byte the pre-existing behavior.
    replaceProjectNamePlaceholder(targetDir, displayName ?? name)

    replaceDataLayerPlaceholder(targetDir, dataLayer ?? template.defaultDataLayer)

    // Substitute __SCHEMA__ placeholder in .sql files
    if (schema) {
      replaceSchemaPlaceholder(targetDir, schema)
    }

    if (placement.mode === 'workspace' && placement.workspaceRoot && placement.packageManager) {
      writeWorkspaceAgentContext({
        targetDir,
        name,
        workspaceRoot: placement.workspaceRoot,
        lockfileOwner: placement.lockfileOwner,
        packageManager: placement.packageManager,
      })
    }

    return {
      ok: true,
      targetDir,
      name,
      template: template.id,
      mode: placement.mode,
      ...(placement.workspaceRoot ? { workspaceRoot: placement.workspaceRoot } : {}),
      lockfileOwner: placement.lockfileOwner,
      requiredRootChanges: placement.requiredRootChanges,
      rootConfigConflicts: placement.rootConfigConflicts,
    }
  } catch (err) {
    return {
      ok: false,
      error: 'SCAFFOLD_FAILED',
      message: err instanceof Error ? err.message : String(err),
    }
  }
}
