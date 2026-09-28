// generate-registry
//
// Scans templates/[name]/package.json, resolves workspace:* deps to actual versions
// from packages/[name]/package.json, and writes packages/cli/src/registry.json.

import { existsSync, readFileSync, realpathSync, writeFileSync, mkdirSync } from 'fs'
import { isAbsolute, join, dirname, relative, resolve } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, statSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '../..')

interface PackageJson {
  name?: string
  version?: string
  description?: string
  private?: boolean
  packageManager?: string
  engines?: {
    node?: string
    pnpm?: string
  }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  agentdock?: {
    minCliVersion?: string
    packageManagerEnforced?: boolean
    dataLayers?: string[]
    defaultDataLayer?: string
    supportsSchema?: boolean
    workspaceMember?: {
      rootAllowBuilds?: Record<string, boolean>
    }
  }
}

interface RegistryTemplate {
  id: string
  name: string
  description: string
  minCliVersion: string
  source: string
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun'
  packageManagerVersion: string | null
  packageManagerEnforced: boolean
  engines?: {
    node?: string
    pnpm?: string
  }
  workspaceMember?: {
    rootAllowBuilds: Record<string, boolean>
  }
  dataLayers: string[]
  defaultDataLayer: string
  supportsSchema: boolean
  resolvedDependencies: Record<string, string>
}

interface IntegrationManifest {
  id?: string
  name?: string
  description?: string
  compatibleTemplates?: string[]
  filesRoot?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
  textAppends?: Array<{
    path?: string
    marker?: string
    content?: string
  }>
  standaloneLockfiles?: Record<string, string>
}

interface RegistryIntegration {
  id: string
  name: string
  description: string
  source: string
  compatibleTemplates: string[]
  filesRoot: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
  textAppends: Array<{
    path: string
    marker: string
    content: string
  }>
  standaloneLockfiles: Record<string, string>
}

interface Registry {
  version: '1'
  templates: RegistryTemplate[]
  integrations: RegistryIntegration[]
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T
}

/** Build a map of @cogito.ai/* package name -> version from packages/ dir */
function buildPackageVersionMap(): Record<string, string> {
  const packagesDir = join(repoRoot, 'packages')
  const entries = readdirSync(packagesDir)
  const map: Record<string, string> = {}

  for (const entry of entries) {
    const pkgJsonPath = join(packagesDir, entry, 'package.json')
    try {
      if (!statSync(pkgJsonPath).isFile()) continue
      const pkg = readJson<PackageJson>(pkgJsonPath)
      if (pkg.name && pkg.version) {
        map[pkg.name] = pkg.version
      }
    } catch {
      // skip entries without package.json
    }
  }

  return map
}

/** Resolve workspace:* entries using the version map */
function resolveWorkspaceDeps(
  deps: Record<string, string> | undefined,
  versionMap: Record<string, string>,
): Record<string, string> {
  if (!deps) return {}
  const resolved: Record<string, string> = {}
  for (const [name, version] of Object.entries(deps)) {
    if (version === 'workspace:*') {
      const resolvedVersion = versionMap[name]
      if (!resolvedVersion) {
        throw new Error(`Cannot resolve workspace:* for "${name}": package not found in packages/`)
      }
      resolved[name] = `^${resolvedVersion}`
    } else {
      resolved[name] = version
    }
  }
  return resolved
}

const DEFAULT_DATA_LAYERS: [string, ...string[]] = ['supabase', 'drizzle']

function parsePackageManager(value: string | undefined): 'pnpm' | 'npm' | 'yarn' | 'bun' {
  if (value === undefined || value === '') return 'pnpm'
  const manager = value.split('@')[0]
  if (manager === 'npm' || manager === 'yarn' || manager === 'bun' || manager === 'pnpm') {
    return manager
  }
  throw new Error(`Unsupported packageManager "${value}" in template package.json`)
}

function parsePackageManagerVersion(value: string | undefined): string | null {
  if (!value) return null
  const separator = value.indexOf('@')
  if (separator === -1) return null
  const version = value
    .slice(separator + 1)
    .split('+')[0]
    ?.trim()
  return version && /^\d+\.\d+\.\d+/.test(version) ? version : null
}

function resolveWorkspaceMember(
  pkg: PackageJson,
  packageManager: RegistryTemplate['packageManager'],
) {
  const configured = pkg.agentdock?.workspaceMember
  if (!configured) return undefined
  if (packageManager !== 'pnpm') {
    throw new Error(
      `workspaceMember in template "${pkg.name ?? 'unknown'}" is currently supported only for pnpm templates (found "${packageManager}")`,
    )
  }
  const rootAllowBuilds = configured.rootAllowBuilds ?? {}
  return {
    rootAllowBuilds,
  }
}

function resolveDataLayers(pkg: PackageJson): string[] {
  const configured = pkg.agentdock?.dataLayers
  return configured && configured.length > 0 ? configured : DEFAULT_DATA_LAYERS
}

function resolveDefaultDataLayer(pkg: PackageJson, dataLayers: string[]): string {
  const configured = pkg.agentdock?.defaultDataLayer
  if (configured && dataLayers.includes(configured)) return configured
  if (configured) {
    throw new Error(
      `defaultDataLayer "${configured}" is not present in dataLayers: ${dataLayers.join(', ')}`,
    )
  }
  return dataLayers[0] ?? DEFAULT_DATA_LAYERS[0]
}

function resolveContainedPath(baseDir: string, relativePath: string, label: string): string {
  const resolved = resolve(baseDir, relativePath)
  const lexicalRelativePath = relative(baseDir, resolved)
  if (
    lexicalRelativePath === '' ||
    lexicalRelativePath.startsWith('..') ||
    isAbsolute(lexicalRelativePath)
  ) {
    throw new Error(`${label} escapes its integration directory: ${relativePath}`)
  }
  if (!existsSync(resolved)) {
    return resolved
  }

  const realBaseDir = realpathSync(baseDir)
  const realResolved = realpathSync(resolved)
  const relativePathFromBase = relative(realBaseDir, realResolved)
  if (
    relativePathFromBase === '' ||
    relativePathFromBase.startsWith('..') ||
    isAbsolute(relativePathFromBase)
  ) {
    throw new Error(`${label} escapes its integration directory: ${relativePath}`)
  }
  return resolved
}

function readIntegrationManifests(templates: RegistryTemplate[]): RegistryIntegration[] {
  const integrationsDir = join(repoRoot, 'templates', '_integrations')
  if (!existsSync(integrationsDir)) return []

  const templateIds = new Set(templates.map((template) => template.id))
  const integrations: RegistryIntegration[] = []

  for (const dir of readdirSync(integrationsDir).sort()) {
    const integrationDirPath = join(integrationsDir, dir)
    const manifestPath = join(integrationsDir, dir, 'integration.json')
    if (!existsSync(manifestPath)) {
      continue
    }
    let isDirectory = false
    try {
      isDirectory = statSync(integrationDirPath).isDirectory()
    } catch {
      continue
    }
    if (!isDirectory) {
      continue
    }

    const manifest = readJson<IntegrationManifest>(manifestPath)
    const id = manifest.id?.trim()
    if (!id || id !== dir) {
      throw new Error(`Integration "${dir}" must declare matching id "${dir}" in integration.json`)
    }
    if (!manifest.name?.trim() || !manifest.description?.trim()) {
      throw new Error(`Integration "${id}" must declare name and description`)
    }

    const compatibleTemplates = manifest.compatibleTemplates ?? []
    if (compatibleTemplates.length === 0) {
      throw new Error(`Integration "${id}" must declare at least one compatible template`)
    }
    for (const templateId of compatibleTemplates) {
      if (!templateIds.has(templateId)) {
        throw new Error(
          `Integration "${id}" references unknown compatible template "${templateId}"`,
        )
      }
    }

    const filesRoot = manifest.filesRoot?.trim() || 'files'
    const filesPath = resolveContainedPath(
      integrationDirPath,
      filesRoot,
      `Integration "${id}" filesRoot`,
    )
    if (!existsSync(filesPath) || !statSync(filesPath).isDirectory()) {
      throw new Error(`Integration "${id}" filesRoot is missing: ${filesRoot}`)
    }

    const textAppends = (manifest.textAppends ?? []).map((append, index) => {
      const path = append.path?.trim()
      const marker = append.marker?.trim()
      const content = append.content
      if (!path || !marker || !content) {
        throw new Error(`Integration "${id}" textAppends[${index}] is incomplete`)
      }
      const resolvedAppendPath = resolve('/template-root', path)
      const appendRelativePath = relative('/template-root', resolvedAppendPath)
      if (
        isAbsolute(path) ||
        appendRelativePath === '' ||
        appendRelativePath.startsWith('..') ||
        isAbsolute(appendRelativePath)
      ) {
        throw new Error(`Integration "${id}" textAppends[${index}] escapes the template root`)
      }
      return { path, marker, content }
    })

    const standaloneLockfiles = manifest.standaloneLockfiles ?? {}
    for (const templateId of compatibleTemplates) {
      const relativePath = standaloneLockfiles[templateId]
      if (!relativePath) {
        throw new Error(`Integration "${id}" is missing standaloneLockfiles.${templateId}`)
      }
      const lockfilePath = resolveContainedPath(
        integrationDirPath,
        relativePath,
        `Integration "${id}" lockfile`,
      )
      if (!existsSync(lockfilePath) || !statSync(lockfilePath).isFile()) {
        throw new Error(`Integration "${id}" lockfile is missing: ${relativePath}`)
      }
    }

    integrations.push({
      id,
      name: manifest.name.trim(),
      description: manifest.description.trim(),
      source: `templates/_integrations/${dir}`,
      compatibleTemplates,
      filesRoot,
      dependencies: manifest.dependencies ?? {},
      devDependencies: manifest.devDependencies ?? {},
      scripts: manifest.scripts ?? {},
      textAppends,
      standaloneLockfiles,
    })
  }

  return integrations
}

function main(): void {
  const versionMap = buildPackageVersionMap()
  const templatesDir = join(repoRoot, 'templates')
  const templateDirs = readdirSync(templatesDir).filter((d) => {
    if (d.startsWith('_')) return false
    try {
      return statSync(join(templatesDir, d)).isDirectory()
    } catch {
      return false
    }
  })

  const templates: RegistryTemplate[] = []

  for (const dir of templateDirs) {
    const pkgJsonPath = join(templatesDir, dir, 'package.json')
    let pkg: PackageJson
    try {
      pkg = readJson<PackageJson>(pkgJsonPath)
    } catch {
      console.warn(`Skipping ${dir}: no package.json found`)
      continue
    }

    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    const resolvedDependencies = resolveWorkspaceDeps(allDeps, versionMap)
    const dataLayers = resolveDataLayers(pkg)

    const packageManager = parsePackageManager(pkg.packageManager)
    const workspaceMember = resolveWorkspaceMember(pkg, packageManager)
    const engines =
      pkg.engines?.node || pkg.engines?.pnpm
        ? {
            ...(pkg.engines?.node ? { node: pkg.engines.node } : {}),
            ...(pkg.engines?.pnpm ? { pnpm: pkg.engines.pnpm } : {}),
          }
        : undefined

    templates.push({
      id: dir,
      name: pkg.name ?? dir,
      description: pkg.description ?? '',
      minCliVersion: pkg.agentdock?.minCliVersion ?? '0.1.0',
      source: `templates/${dir}`,
      packageManager,
      packageManagerVersion: parsePackageManagerVersion(pkg.packageManager),
      packageManagerEnforced: pkg.agentdock?.packageManagerEnforced ?? Boolean(pkg.packageManager),
      ...(engines ? { engines } : {}),
      ...(workspaceMember ? { workspaceMember } : {}),
      dataLayers,
      defaultDataLayer: resolveDefaultDataLayer(pkg, dataLayers),
      supportsSchema: pkg.agentdock?.supportsSchema ?? true,
      resolvedDependencies,
    })
  }

  const registry: Registry = {
    version: '1',
    templates,
    integrations: readIntegrationManifests(templates),
  }

  const outputDir = join(repoRoot, 'packages/cli/src')
  mkdirSync(outputDir, { recursive: true })

  const outputPath = join(outputDir, 'registry.json')
  writeFileSync(outputPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8')

  console.log(`[generate-registry] Written ${templates.length} template(s) to ${outputPath}`)
}

main()
