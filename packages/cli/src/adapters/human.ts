import * as p from '@clack/prompts'
import { join, isAbsolute, resolve } from 'path'
import { getTemplates, getTemplate } from '../core/registry.js'
import { scaffoldProject } from '../core/scaffold.js'

type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export interface HumanAdapterOptions {
  /** Explicit target directory. Absolute or relative to cwd. Defaults to ./<name>. */
  dir?: string
}

export async function runHumanAdapter(opts: HumanAdapterOptions = {}): Promise<void> {
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

  const pm = await p.select<PackageManager>({
    message: 'Package manager',
    options: [
      { value: 'pnpm', label: 'pnpm', hint: 'recommended' },
      { value: 'npm', label: 'npm' },
      { value: 'yarn', label: 'yarn' },
      { value: 'bun', label: 'bun' },
    ],
  })

  if (p.isCancel(pm)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const confirmed = await p.confirm({
    message: `Create project "${projectName}" using template "${templateId}"?`,
  })

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const template = getTemplate(templateId as string)
  if (!template) {
    p.cancel(`Template "${templateId}" not found.`)
    process.exit(1)
  }

  const targetDir = opts.dir
    ? isAbsolute(opts.dir)
      ? opts.dir
      : resolve(process.cwd(), opts.dir)
    : join(process.cwd(), projectName as string)

  const spinner = p.spinner()
  spinner.start('Scaffolding project...')

  const result = scaffoldProject({
    targetDir,
    name: projectName as string,
    template,
    packageManager: pm as PackageManager,
  })

  if (!result.ok) {
    spinner.stop('Failed.')
    p.cancel(result.message)
    process.exit(1)
  }

  spinner.stop('Done!')

  p.outro(`Project created at ${targetDir}\n\n  cd ${targetDir}\n  ${pm} install\n  ${pm} run dev`)
}
