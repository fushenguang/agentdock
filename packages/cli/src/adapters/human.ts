import * as p from '@clack/prompts'
import { existsSync } from 'fs'
import { join, isAbsolute, resolve } from 'path'
import {
  getTemplates,
  getTemplate,
  PACKAGE_MANAGERS,
  type PackageManager,
} from '../core/registry.js'
import { scaffoldProject } from '../core/scaffold.js'
import { INIT_MODES, isInitMode, type InitMode } from '../core/workspace.js'
import { normalizeIntegrations } from '../core/integrations.js'
import { createDomainPackage, type DomainPackageOnboardingInput } from '../core/domainPackages.js'

export interface HumanAdapterOptions {
  /** Explicit target directory. Absolute or relative to cwd. Defaults to ./<name>. */
  dir?: string
  /** Placement mode. Defaults to auto detection. */
  mode?: string
  integrations?: string | string[]
  /** domain-packages template: explicit first-package id. */
  domainPackageId?: string
  /** domain-packages template: explicit first-package intent. */
  domainPackageIntent?: string
  /** domain-packages template: optional first-package display name. */
  domainPackageDisplayName?: string
  /** domain-packages template: optional first-package owner. */
  domainPackageOwner?: string
  /** domain-packages template: optional package spec path. */
  domainPackageSpec?: string
}

function defaultDomainDisplayName(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export async function runHumanAdapter(opts: HumanAdapterOptions = {}): Promise<void> {
  const mode = opts.mode ?? 'auto'
  if (!isInitMode(mode)) {
    p.cancel(`Unsupported mode "${mode}". Use ${INIT_MODES.join(', ')}.`)
    process.exit(1)
  }

  p.intro('AgentDock CLI')

  const templates = getTemplates()
  if (templates.length === 0) {
    p.cancel('No templates found in registry.')
    process.exit(1)
  }

  const projectName = await p.text({
    message: 'Project name',
    placeholder: 'my-agentdock-app',
    validate(value) {
      if (!value.trim()) return 'Project name is required'
      if (!/^[a-z0-9@._/-]+$/.test(value.trim()))
        return 'Use lowercase letters, numbers, hyphens, or underscores'
      return undefined
    },
  })

  if (p.isCancel(projectName)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const templateId = await p.select({
    message: 'Select a template',
    options: templates.map((t) => ({
      value: t.id,
      label: t.id,
      ...(t.description ? { hint: t.description } : {}),
    })),
  })

  if (p.isCancel(templateId)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const template = getTemplate(templateId as string)
  if (!template) {
    p.cancel(`Template "${templateId}" not found.`)
    process.exit(1)
  }

  const dataLayer = await p.select({
    message: 'Select a data layer',
    initialValue: template.defaultDataLayer,
    options: template.dataLayers.map((layer) => ({
      value: layer,
      label: layer,
      ...(layer === template.defaultDataLayer ? { hint: 'recommended' } : {}),
    })),
  })

  if (p.isCancel(dataLayer)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const hasDomainPackageInput = Boolean(
    opts.domainPackageSpec ??
    opts.domainPackageId ??
    opts.domainPackageIntent ??
    opts.domainPackageDisplayName ??
    opts.domainPackageOwner,
  )
  if (hasDomainPackageInput && !template.supportsDomainPackageOnboarding) {
    p.cancel(`Template "${templateId}" does not support domain-package onboarding input.`)
    process.exit(1)
  }

  const hasExplicitDomainFields = Boolean(
    opts.domainPackageId ??
    opts.domainPackageIntent ??
    opts.domainPackageDisplayName ??
    opts.domainPackageOwner,
  )
  let domainPackageInput: DomainPackageOnboardingInput | undefined
  if (template.supportsDomainPackageOnboarding) {
    if (opts.domainPackageSpec && hasExplicitDomainFields) {
      p.cancel('Use either a domain package spec or explicit domain package values, not both.')
      process.exit(1)
    }
    if (hasExplicitDomainFields && (!opts.domainPackageId || !opts.domainPackageIntent)) {
      p.cancel('Domain package id and intent must be provided together.')
      process.exit(1)
    }

    if (opts.domainPackageSpec) {
      const specPath = resolve(process.cwd(), opts.domainPackageSpec)
      if (!existsSync(specPath)) {
        p.cancel(`Domain package spec not found: ${specPath}`)
        process.exit(1)
      }
      domainPackageInput = { spec: specPath }
    } else if (opts.domainPackageId && opts.domainPackageIntent) {
      domainPackageInput = {
        id: opts.domainPackageId,
        intent: opts.domainPackageIntent,
        ...(opts.domainPackageDisplayName ? { displayName: opts.domainPackageDisplayName } : {}),
        ...(opts.domainPackageOwner ? { owner: opts.domainPackageOwner } : {}),
      }
    } else {
      const packageId = await p.text({
        message: 'Domain package id',
        placeholder: 'example-domain',
        defaultValue: '',
        validate(value) {
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim()))
            return 'Use lowercase kebab-case (for example: example-domain)'
          return undefined
        },
      })
      if (p.isCancel(packageId)) {
        p.cancel('Cancelled.')
        process.exit(0)
      }

      const packageIntent = await p.text({
        message: 'One-sentence domain intent',
        defaultValue: '',
        validate(value) {
          if (value.trim().length < 20) return 'Describe the outcome in at least 20 characters'
          return undefined
        },
      })
      if (p.isCancel(packageIntent)) {
        p.cancel('Cancelled.')
        process.exit(0)
      }

      const displayNameDefault = defaultDomainDisplayName(packageId as string)
      const packageDisplayName = await p.text({
        message: 'Display name',
        defaultValue: displayNameDefault,
      })
      if (p.isCancel(packageDisplayName)) {
        p.cancel('Cancelled.')
        process.exit(0)
      }

      const packageOwner = await p.text({
        message: 'Owner',
        defaultValue: '@product-team',
      })
      if (p.isCancel(packageOwner)) {
        p.cancel('Cancelled.')
        process.exit(0)
      }

      domainPackageInput = {
        id: packageId as string,
        intent: packageIntent as string,
        displayName: (packageDisplayName as string).trim() || displayNameDefault,
        owner: (packageOwner as string).trim() || '@product-team',
      }
    }
  }

  let schemaName: string | undefined = undefined
  if (dataLayer === 'supabase' && template.supportsSchema) {
    const schemaInput = await p.text({
      message: 'Supabase schema name',
      placeholder: 'public',
      defaultValue: 'public',
      validate(value) {
        const v = value.trim() || 'public'
        if (!/^[a-z_][a-z0-9_]*$/.test(v))
          return 'Schema name must be lowercase letters, numbers, or underscores, starting with a letter or underscore'
        return undefined
      },
    })

    if (p.isCancel(schemaInput)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }

    schemaName = (schemaInput as string).trim() || 'public'
  }

  let pm: PackageManager = template.packageManager
  if (!template.packageManagerEnforced) {
    const selectedPackageManager = await p.select<PackageManager>({
      message: 'Package manager',
      initialValue: template.packageManager,
      options: PACKAGE_MANAGERS.map((packageManager) => ({
        value: packageManager,
        label: packageManager,
        ...(packageManager === template.packageManager ? { hint: 'recommended' } : {}),
      })),
    })

    if (p.isCancel(selectedPackageManager)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }

    pm = selectedPackageManager
  }

  const packageSummary = domainPackageInput?.id
    ? ` and domain package "${domainPackageInput.id}"`
    : ''
  const confirmed = await p.confirm({
    message: `Create project "${projectName}" using template "${templateId}"${packageSummary}?`,
  })

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const targetDir = opts.dir
    ? isAbsolute(opts.dir)
      ? opts.dir
      : resolve(process.cwd(), opts.dir)
    : join(process.cwd(), projectName as string)

  const spinner = p.spinner()
  spinner.start('Scaffolding project...')

  const integrations = normalizeIntegrations(opts.integrations)
  const result = scaffoldProject({
    targetDir,
    name: projectName as string,
    template,
    packageManager: pm,
    mode: mode as InitMode,
    dataLayer: dataLayer as string,
    ...(schemaName !== undefined ? { schema: schemaName } : {}),
    ...(integrations.length > 0 ? { integrations } : {}),
  })

  if (!result.ok) {
    spinner.stop('Failed.')
    p.cancel(result.message)
    process.exit(1)
  }

  spinner.stop('Workspace scaffolded.')

  if (domainPackageInput) {
    const domainResult = createDomainPackage({
      targetDir,
      input: domainPackageInput,
    })
    if (!domainResult.ok) {
      p.cancel(`${domainResult.message}${domainResult.stderr ? `\n${domainResult.stderr}` : ''}`)
      process.exit(1)
    }
    p.log.success(`Created domain package at ${domainResult.packagePath}`)
    p.outro(`Workspace created at ${targetDir}\n\n  cd ${targetDir}\n  pnpm install\n  pnpm check`)
    return
  }

  p.log.success('Done!')

  if (result.mode === 'workspace') {
    const shellName = `'${result.name.replaceAll("'", "'\\''")}'`
    if (result.requiredRootChanges.length > 0) {
      const entries = result.requiredRootChanges.flatMap((change) =>
        Object.entries(change.entries).map(([key, value]) => `  ${key}: ${String(value)}`),
      )
      p.log.warn(
        `Add these allowBuilds entries to the workspace root pnpm-workspace.yaml before installation:\n${entries.join('\n')}`,
      )
    }
    if (result.rootConfigConflicts.length > 0) {
      const conflicts = result.rootConfigConflicts.map(
        (conflict) =>
          `  ${conflict.key}: expected ${String(conflict.expected)}, found ${JSON.stringify(conflict.actual)}`,
      )
      p.log.warn(
        `The workspace root has allowBuilds conflicts; the CLI did not overwrite them:\n${conflicts.join('\n')}`,
      )
    }
    p.outro(
      `Project created at ${targetDir}\n\nWorkspace root: ${result.workspaceRoot}\nLockfile owner: ${result.lockfileOwner}\n\nFrom the workspace root:\n  pnpm install\n  pnpm --filter ${shellName} check`,
    )
    return
  }

  p.outro(`Project created at ${targetDir}\n\n  cd ${targetDir}\n  ${pm} install\n  ${pm} run dev`)
}
