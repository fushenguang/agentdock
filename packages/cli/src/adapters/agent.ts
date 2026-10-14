import { existsSync } from 'fs'
import { join, isAbsolute, resolve } from 'path'
import { getTemplate, PACKAGE_MANAGERS, type PackageManager } from '../core/registry.js'
import { scaffoldProject } from '../core/scaffold.js'
import { INIT_MODES, isInitMode } from '../core/workspace.js'
import { normalizeIntegrations } from '../core/integrations.js'
import { createDomainPackage, type DomainPackageOnboardingInput } from '../core/domainPackages.js'

export interface AgentAdapterOptions {
  name: string
  template: string
  pm?: string
  silent?: boolean
  json?: boolean
  /** Explicit target directory. Absolute or relative to cwd. Defaults to ./<name>. */
  dir?: string
  /** Placement mode. Defaults to auto detection. */
  mode?: string
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
  /** Optional integration IDs to compose onto the selected template. */
  integrations?: string | string[]
  /** domain-packages template: explicit first-package id. */
  domainPackageId?: string
  /** domain-packages template: explicit first-package intent. */
  domainPackageIntent?: string
  /** domain-packages template: optional first-package display name. */
  domainPackageDisplayName?: string
  /** domain-packages template: optional first-package owner. */
  domainPackageOwner?: string
  /** domain-packages template: package spec path for non-interactive creation. */
  domainPackageSpec?: string
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
    mode,
    dataLayer,
    schema,
    displayName,
    integrations: requestedIntegrations,
    domainPackageId,
    domainPackageIntent,
    domainPackageDisplayName,
    domainPackageOwner,
    domainPackageSpec,
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

  const hasExplicitDomainFields = Boolean(
    domainPackageId ?? domainPackageIntent ?? domainPackageDisplayName ?? domainPackageOwner,
  )
  const hasDomainPackageInput = Boolean(domainPackageSpec ?? hasExplicitDomainFields)

  if (hasDomainPackageInput && !template.supportsDomainPackageOnboarding) {
    failWith(
      {
        ok: false,
        error: 'DOMAIN_PACKAGE_INPUT_UNSUPPORTED',
        template: templateId,
      },
      `Error: template "${templateId}" does not support domain-package onboarding input`,
      output,
    )
    return
  }

  if (template.supportsDomainPackageOnboarding) {
    if (domainPackageSpec && hasExplicitDomainFields) {
      failWith(
        { ok: false, error: 'INVALID_DOMAIN_PACKAGE_INPUT', template: templateId },
        'Error: use either --domain-package-spec or explicit domain-package fields, not both',
        output,
      )
      return
    }
    if (hasExplicitDomainFields && (!domainPackageId || !domainPackageIntent)) {
      failWith(
        { ok: false, error: 'INVALID_DOMAIN_PACKAGE_INPUT', template: templateId },
        'Error: --domain-package-id and --domain-package-intent are required together',
        output,
      )
      return
    }
  }

  const domainPackageSpecPath = domainPackageSpec
    ? resolve(process.cwd(), domainPackageSpec)
    : undefined
  if (domainPackageSpecPath && !existsSync(domainPackageSpecPath)) {
    failWith(
      {
        ok: false,
        error: 'DOMAIN_PACKAGE_SPEC_NOT_FOUND',
        path: domainPackageSpecPath,
      },
      `Error: domain package spec not found: ${domainPackageSpecPath}`,
      output,
    )
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

  if (mode !== undefined && !isInitMode(mode)) {
    failWith(
      { ok: false, error: 'INVALID_MODE', mode, supportedModes: INIT_MODES },
      `Error: unsupported mode "${mode}"`,
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

  const integrations = normalizeIntegrations(requestedIntegrations)

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
    mode: mode ?? 'auto',
    dataLayer: effectiveDataLayer,
    ...(effectiveDataLayer === 'supabase' && template.supportsSchema
      ? { schema: schema ?? 'public' }
      : {}),
    ...(displayName !== undefined ? { displayName } : {}),
    ...(integrations.length > 0 ? { integrations } : {}),
  })

  if (!result.ok) {
    if (output) emit(result, true)
    else console.error(`✗ ${result.message}`)
    process.exitCode = 1
    return
  }

  if (hasDomainPackageInput) {
    const domainInput: DomainPackageOnboardingInput = {
      ...(domainPackageSpecPath ? { spec: domainPackageSpecPath } : {}),
      ...(domainPackageId ? { id: domainPackageId } : {}),
      ...(domainPackageIntent ? { intent: domainPackageIntent } : {}),
      ...(domainPackageDisplayName ? { displayName: domainPackageDisplayName } : {}),
      ...(domainPackageOwner ? { owner: domainPackageOwner } : {}),
    }
    const domainResult = createDomainPackage({
      targetDir,
      input: domainInput,
      quiet: output,
    })

    if (!domainResult.ok) {
      failWith(
        { ...domainResult, scaffoldResult: result },
        `✗ ${domainResult.message}${domainResult.stderr ? `\n${domainResult.stderr}` : ''}`,
        output,
      )
      return
    }

    if (output) {
      emit({ ...result, domainPackage: domainResult }, true)
    } else {
      console.log(`✓ Project created at ${targetDir}`)
      console.log(`✓ Domain package created at ${domainResult.packagePath}`)
    }
    return
  }

  if (output) {
    emit(result, true)
  } else {
    console.log(`✓ Project created at ${targetDir}`)
  }
}
