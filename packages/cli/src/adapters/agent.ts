import { join, isAbsolute, resolve } from 'path'
import { getTemplate, PACKAGE_MANAGERS, type PackageManager } from '../core/registry.js'
import { scaffoldProject } from '../core/scaffold.js'

export interface AgentAdapterOptions {
  name: string
  template: string
  pm?: string
  silent?: boolean
  json?: boolean
  /** Explicit target directory. Absolute or relative to cwd. Defaults to ./<name>. */
  dir?: string
  /** Data layer selection. Defaults to the selected template's defaultDataLayer. */
  dataLayer?: string | undefined
  /** Supabase schema name. Defaults to 'public' when dataLayer is 'supabase'. */
  schema?: string
  /**
   * Human-facing title substituted for {{PROJECT_NAME}} in generated source
   * (e.g. <title>, in-game strings). Can be non-ASCII. `name` (the npm
   * package name) is unaffected either way. Omitted => falls back to `name`.
   */
  displayName?: string
}

function emit(obj: unknown, json: boolean): void {
  if (json) {
    process.stdout.write(JSON.stringify(obj) + '\n')
  }
}

function isPackageManager(value: string): value is PackageManager {
  return PACKAGE_MANAGERS.includes(value as PackageManager)
}

function failWith(err: unknown, message: string, output: boolean): void {
  if (output) {
    emit(err, true)
  } else {
    console.error(message)
  }
  process.exitCode = 1
}

export async function runAgentAdapter(opts: AgentAdapterOptions): Promise<void> {
  const {
    name,
    template: templateId,
    pm,
    silent = false,
    json = false,
    dir,
    dataLayer,
    schema,
    displayName,
  } = opts

  const output = json || silent

  if (!name) {
    const err = { ok: false, error: 'MISSING_ARG', field: 'name' }
    failWith(err, 'Error: --name is required in agent mode', output)
    return
  }

  if (!templateId) {
    const err = { ok: false, error: 'MISSING_ARG', field: 'template' }
    failWith(err, 'Error: --template is required in agent mode', output)
    return
  }

  const template = getTemplate(templateId)
  if (!template) {
    const err = { ok: false, error: 'TEMPLATE_NOT_FOUND', template: templateId }
    failWith(err, `Error: template "${templateId}" not found`, output)
    return
  }

  const effectiveDataLayer = dataLayer ?? template.defaultDataLayer
  if (!template.dataLayers.includes(effectiveDataLayer)) {
    const err = {
      ok: false,
      error: 'INVALID_DATA_LAYER',
      template: templateId,
      dataLayer: effectiveDataLayer,
      supportedDataLayers: template.dataLayers,
    }
    failWith(
      err,
      `Error: data layer "${effectiveDataLayer}" is not supported by ${templateId}`,
      output,
    )
    return
  }

  if (pm !== undefined && !isPackageManager(pm)) {
    failWith(
      { ok: false, error: 'INVALID_PACKAGE_MANAGER', packageManager: pm },
      `Error: unsupported package manager "${pm}"`,
      output,
    )
    return
  }

  const effectivePackageManager = pm ?? template.packageManager
  if (template.packageManagerEnforced && effectivePackageManager !== template.packageManager) {
    const err = {
      ok: false,
      error: 'INVALID_PACKAGE_MANAGER',
      template: templateId,
      packageManager: effectivePackageManager,
      requiredPackageManager: template.packageManager,
    }
    failWith(
      err,
      `Error: template "${templateId}" requires package manager "${template.packageManager}"`,
      output,
    )
    return
  }

  const targetDir = dir
    ? isAbsolute(dir)
      ? dir
      : resolve(process.cwd(), dir)
    : join(process.cwd(), name)

  if (!silent && !json) {
    console.log(`Scaffolding project "${name}" using template "${templateId}"...`)
  }

  const result = scaffoldProject({
    targetDir,
    name,
    template,
    packageManager: effectivePackageManager,
    dataLayer: effectiveDataLayer,
    ...(effectiveDataLayer === 'supabase' && template.supportsSchema
      ? { schema: schema ?? 'public' }
      : {}),
    ...(displayName !== undefined ? { displayName } : {}),
  })

  if (output) {
    emit(result, true)
  } else if (result.ok) {
    console.log(`✓ Project created at ${targetDir}`)
  } else {
    console.error(`✗ ${result.message}`)
  }

  if (!result.ok) {
    process.exitCode = 1
  }
}
