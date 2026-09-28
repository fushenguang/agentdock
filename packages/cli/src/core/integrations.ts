import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs'
import { dirname, isAbsolute, join, relative, resolve } from 'path'
import { fileURLToPath } from 'url'
import type { RegistryIntegration, RegistryTemplate } from './registry.js'
import { getIntegration, getIntegrations } from './registry.js'
import type { ResolvedInitMode } from './workspace.js'

export type IntegrationErrorCode =
  | 'INVALID_INTEGRATION'
  | 'INTEGRATION_NOT_SUPPORTED'
  | 'INTEGRATION_CONFLICT'

export interface IntegrationResolutionError {
  error: IntegrationErrorCode
  message: string
  integration?: string
  template?: string
  supportedIntegrations?: string[]
}

export function normalizeIntegrations(value: unknown): string[] {
  let rawValues: unknown[]
  if (Array.isArray(value)) {
    rawValues = value
  } else if (value === undefined) {
    rawValues = []
  } else {
    rawValues = [value]
  }
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const rawValue of rawValues) {
    if (typeof rawValue !== 'string') continue
    for (const part of rawValue.split(',')) {
      const id = part.trim()
      if (!id || seen.has(id)) continue
      seen.add(id)
      normalized.push(id)
    }
  }

  return normalized
}

export function resolveIntegrations(
  integrationIds: string[],
  template: RegistryTemplate,
): RegistryIntegration[] | IntegrationResolutionError {
  const resolved: RegistryIntegration[] = []
  const available = getIntegrations()
    .filter((integration) => integration.compatibleTemplates.includes(template.id))
    .map((integration) => integration.id)

  for (const id of integrationIds) {
    const integration = getIntegration(id)
    if (!integration) {
      return {
        error: 'INVALID_INTEGRATION',
        integration: id,
        template: template.id,
        supportedIntegrations: available,
        message: `Integration "${id}" is not available for template "${template.id}". Supported integrations: ${available.length > 0 ? available.join(', ') : 'none'}.`,
      }
    }

    if (!integration.compatibleTemplates.includes(template.id)) {
      return {
        error: 'INTEGRATION_NOT_SUPPORTED',
        integration: id,
        template: template.id,
        supportedIntegrations: available,
        message: `Integration "${id}" is not supported by template "${template.id}".`,
      }
    }

    resolved.push(integration)
  }

  return resolved
}

function getIntegrationSourceDir(source: string): string {
  const runtimeDir = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    join(runtimeDir, source),
    join(runtimeDir, '../../../..', source),
    join(runtimeDir, '../../..', source),
  ]
  const sourceDir = candidates.find((candidate) => existsSync(candidate))

  if (!sourceDir) {
    throw new Error(`Integration source not found: ${source}. Looked in: ${candidates.join(', ')}`)
  }

  return sourceDir
}

function resolveIntegrationContainedPath(
  baseDir: string,
  relativePath: string,
  label: string,
): string {
  const resolved = resolve(baseDir, relativePath)
  const relativePathFromBase = relative(baseDir, resolved)
  if (
    relativePathFromBase === '' ||
    relativePathFromBase.startsWith('..') ||
    isAbsolute(relativePathFromBase)
  ) {
    throw new Error(`${label} escapes its integration directory: ${relativePath}`)
  }
  return resolved
}

function readPackageJson(targetDir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(targetDir, 'package.json'), 'utf-8')) as Record<
    string,
    unknown
  >
}

function writePackageJson(targetDir: string, pkg: Record<string, unknown>): void {
  writeFileSync(join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
}

function mergeDependencyGroup(
  pkg: Record<string, unknown>,
  group: 'dependencies' | 'devDependencies',
  additions: Record<string, string>,
  integrationId: string,
): IntegrationResolutionError | null {
  const existing = (pkg[group] as Record<string, string> | undefined) ?? {}

  for (const [name, version] of Object.entries(additions)) {
    const current = existing[name]
    if (current !== undefined && current !== version) {
      return {
        error: 'INTEGRATION_CONFLICT',
        integration: integrationId,
        message: `Integration "${integrationId}" would replace ${group}.${name} (${current}) with ${version}.`,
      }
    }
  }

  pkg[group] = Object.fromEntries(
    Object.entries({ ...existing, ...additions }).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  )
  return null
}

function applyPackageChanges(
  targetDir: string,
  integration: RegistryIntegration,
): IntegrationResolutionError | null {
  const pkg = readPackageJson(targetDir)
  const dependencyError = mergeDependencyGroup(
    pkg,
    'dependencies',
    integration.dependencies,
    integration.id,
  )
  if (dependencyError) return dependencyError

  const devDependencyError = mergeDependencyGroup(
    pkg,
    'devDependencies',
    integration.devDependencies,
    integration.id,
  )
  if (devDependencyError) return devDependencyError

  const scripts = (pkg.scripts as Record<string, string> | undefined) ?? {}
  pkg.scripts = { ...scripts, ...integration.scripts }
  writePackageJson(targetDir, pkg)
  return null
}

function applyTextAppends(
  targetDir: string,
  integration: RegistryIntegration,
): IntegrationResolutionError | null {
  for (const append of integration.textAppends) {
    let filePath: string
    try {
      filePath = resolveIntegrationContainedPath(
        targetDir,
        append.path,
        `Integration "${integration.id}" textAppend path`,
      )
    } catch (error) {
      return {
        error: 'INTEGRATION_CONFLICT',
        integration: integration.id,
        message: error instanceof Error ? error.message : String(error),
      }
    }
    if (!existsSync(filePath)) {
      return {
        error: 'INTEGRATION_CONFLICT',
        integration: integration.id,
        message: `Integration "${integration.id}" cannot append to missing file "${append.path}".`,
      }
    }

    const existing = readFileSync(filePath, 'utf-8')
    if (existing.includes(append.marker)) continue
    const separator = existing.endsWith('\n') || existing.length === 0 ? '' : '\n'
    writeFileSync(filePath, `${existing}${separator}${append.content}`, 'utf-8')
  }

  return null
}

function copyStandaloneLockfile(
  targetDir: string,
  integration: RegistryIntegration,
  template: RegistryTemplate,
  mode: ResolvedInitMode,
): IntegrationResolutionError | null {
  if (mode !== 'standalone') return null

  const relativePath = integration.standaloneLockfiles[template.id]
  if (!relativePath) {
    return {
      error: 'INTEGRATION_CONFLICT',
      integration: integration.id,
      template: template.id,
      message: `Integration "${integration.id}" has no standalone lockfile for template "${template.id}".`,
    }
  }

  let sourceDir: string
  try {
    sourceDir = getIntegrationSourceDir(integration.source)
  } catch (error) {
    return {
      error: 'INTEGRATION_CONFLICT',
      integration: integration.id,
      template: template.id,
      message: error instanceof Error ? error.message : String(error),
    }
  }
  let sourcePath: string
  try {
    sourcePath = resolveIntegrationContainedPath(
      sourceDir,
      relativePath,
      `Integration "${integration.id}" lockfile`,
    )
  } catch (error) {
    return {
      error: 'INTEGRATION_CONFLICT',
      integration: integration.id,
      template: template.id,
      message: error instanceof Error ? error.message : String(error),
    }
  }
  if (!existsSync(sourcePath)) {
    return {
      error: 'INTEGRATION_CONFLICT',
      integration: integration.id,
      template: template.id,
      message: `Integration "${integration.id}" lockfile is missing: ${relativePath}.`,
    }
  }

  cpSync(sourcePath, join(targetDir, 'pnpm-lock.yaml'))
  return null
}

function copyOverlayFiles(
  sourceDir: string,
  targetDir: string,
  scaffoldRoot: string,
  integrationId: string,
): IntegrationResolutionError | null {
  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = join(sourceDir, entry)
    const targetPath = join(targetDir, entry)
    const stat = statSync(sourcePath)

    if (stat.isDirectory()) {
      mkdirSync(targetPath, { recursive: true })
      const nestedError = copyOverlayFiles(sourcePath, targetPath, scaffoldRoot, integrationId)
      if (nestedError) return nestedError
      continue
    }

    if (existsSync(targetPath)) {
      return {
        error: 'INTEGRATION_CONFLICT',
        integration: integrationId,
        message: `Integration "${integrationId}" would overwrite existing file "${relative(scaffoldRoot, targetPath)}".`,
      }
    }

    copyFileSync(sourcePath, targetPath)
  }

  return null
}

function walkOverlayFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...walkOverlayFiles(fullPath))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

function validatePackageConflicts(
  templateSourceDir: string,
  integration: RegistryIntegration,
): IntegrationResolutionError | null {
  const packagePath = join(templateSourceDir, 'package.json')
  if (!existsSync(packagePath)) return null
  const pkg = readPackageJson(templateSourceDir)

  for (const group of ['dependencies', 'devDependencies'] as const) {
    const additions = integration[group]
    const existing = (pkg[group] as Record<string, string> | undefined) ?? {}
    for (const [name, version] of Object.entries(additions)) {
      if (existing[name] !== undefined && existing[name] !== version) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          message: `Integration "${integration.id}" would replace ${group}.${name} (${existing[name]}) with ${version}.`,
        }
      }
    }
  }

  return null
}

export function validateIntegrations(options: {
  templateSourceDir: string
  template: RegistryTemplate
  integrations: RegistryIntegration[]
  mode: ResolvedInitMode
}): IntegrationResolutionError | null {
  const { templateSourceDir, template, integrations, mode } = options
  let standaloneLockfileSelected = false
  const overlayPaths = new Set<string>()
  const textAppendPaths = new Set<string>()
  const dependencyVersions = new Map<string, { integration: string; version: string }>()
  const scriptValues = new Map<string, { integration: string; value: string }>()

  for (const integration of integrations) {
    let sourceDir: string
    let filesDir: string
    try {
      sourceDir = getIntegrationSourceDir(integration.source)
      filesDir = resolveIntegrationContainedPath(
        sourceDir,
        integration.filesRoot,
        `Integration "${integration.id}" filesRoot`,
      )
    } catch (error) {
      return {
        error: 'INTEGRATION_CONFLICT',
        integration: integration.id,
        message: error instanceof Error ? error.message : String(error),
      }
    }
    if (!existsSync(filesDir)) {
      return {
        error: 'INTEGRATION_CONFLICT',
        integration: integration.id,
        message: `Integration "${integration.id}" files root is missing: ${integration.filesRoot}.`,
      }
    }

    for (const overlayFile of walkOverlayFiles(filesDir)) {
      const relativePath = relative(filesDir, overlayFile)
      if (overlayPaths.has(relativePath)) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          message: `Multiple integrations provide overlay file "${relativePath}".`,
        }
      }
      overlayPaths.add(relativePath)
      if (existsSync(join(templateSourceDir, relativePath))) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          message: `Integration "${integration.id}" would overwrite existing file "${relativePath}".`,
        }
      }
    }

    const packageError = validatePackageConflicts(templateSourceDir, integration)
    if (packageError) return packageError
    for (const group of ['dependencies', 'devDependencies'] as const) {
      for (const [name, version] of Object.entries(integration[group])) {
        const previous = dependencyVersions.get(`${group}:${name}`)
        if (previous && previous.version !== version) {
          return {
            error: 'INTEGRATION_CONFLICT',
            integration: integration.id,
            message: `Integrations "${previous.integration}" and "${integration.id}" declare conflicting ${group}.${name} versions.`,
          }
        }
        dependencyVersions.set(`${group}:${name}`, { integration: integration.id, version })
      }
    }
    for (const [name, value] of Object.entries(integration.scripts)) {
      const previous = scriptValues.get(name)
      if (previous && previous.value !== value) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          message: `Integrations "${previous.integration}" and "${integration.id}" declare conflicting script "${name}".`,
        }
      }
      scriptValues.set(name, { integration: integration.id, value })
    }

    for (const append of integration.textAppends) {
      if (textAppendPaths.has(append.path)) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          message: `Multiple integrations append to "${append.path}".`,
        }
      }
      textAppendPaths.add(append.path)
      try {
        resolveIntegrationContainedPath(
          templateSourceDir,
          append.path,
          `Integration "${integration.id}" textAppend path`,
        )
      } catch (error) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          message: error instanceof Error ? error.message : String(error),
        }
      }
      if (!existsSync(join(templateSourceDir, append.path))) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          message: `Integration "${integration.id}" cannot append to missing file "${append.path}".`,
        }
      }
    }

    if (mode === 'standalone') {
      const lockfileRelativePath = integration.standaloneLockfiles[template.id]
      if (!lockfileRelativePath) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          template: template.id,
          message: `Integration "${integration.id}" has no standalone lockfile for template "${template.id}".`,
        }
      }
      if (standaloneLockfileSelected) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          template: template.id,
          message: `Multiple integrations provide a standalone lockfile for template "${template.id}".`,
        }
      }
      standaloneLockfileSelected = true
      let lockfilePath: string
      try {
        lockfilePath = resolveIntegrationContainedPath(
          sourceDir,
          lockfileRelativePath,
          `Integration "${integration.id}" lockfile`,
        )
      } catch (error) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          message: error instanceof Error ? error.message : String(error),
        }
      }
      if (!existsSync(lockfilePath)) {
        return {
          error: 'INTEGRATION_CONFLICT',
          integration: integration.id,
          template: template.id,
          message: `Integration "${integration.id}" lockfile is missing: ${lockfileRelativePath}.`,
        }
      }
    }
  }

  return null
}

export function applyIntegrations(options: {
  targetDir: string
  template: RegistryTemplate
  integrations: RegistryIntegration[]
  mode: ResolvedInitMode
}): IntegrationResolutionError | null {
  const { targetDir, template, integrations, mode } = options

  for (const integration of integrations) {
    let sourceDir: string
    try {
      sourceDir = getIntegrationSourceDir(integration.source)
    } catch (error) {
      return {
        error: 'INTEGRATION_CONFLICT',
        integration: integration.id,
        message: error instanceof Error ? error.message : String(error),
      }
    }
    let filesDir: string
    try {
      filesDir = resolveIntegrationContainedPath(
        sourceDir,
        integration.filesRoot,
        `Integration "${integration.id}" filesRoot`,
      )
    } catch (error) {
      return {
        error: 'INTEGRATION_CONFLICT',
        integration: integration.id,
        message: error instanceof Error ? error.message : String(error),
      }
    }
    if (!existsSync(filesDir)) {
      return {
        error: 'INTEGRATION_CONFLICT',
        integration: integration.id,
        message: `Integration "${integration.id}" files root is missing: ${relative(sourceDir, filesDir)}.`,
      }
    }

    const filesError = copyOverlayFiles(filesDir, targetDir, targetDir, integration.id)
    if (filesError) return filesError
    const packageError = applyPackageChanges(targetDir, integration)
    if (packageError) return packageError

    const textError = applyTextAppends(targetDir, integration)
    if (textError) return textError

    const lockfileError = copyStandaloneLockfile(targetDir, integration, template, mode)
    if (lockfileError) return lockfileError
  }

  return null
}
