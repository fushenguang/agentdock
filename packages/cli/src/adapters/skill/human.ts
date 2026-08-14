import * as p from '@clack/prompts'
import { publishSkill } from '../../core/skillPublish.js'
import { validateSkill } from '../../core/skillValidate.js'

export interface SkillValidateHumanOptions {
  dir: string
}

export interface SkillPublishHumanOptions {
  dir: string
  registry: string
}

export async function runSkillValidateHumanAdapter(opts: SkillValidateHumanOptions): Promise<void> {
  p.intro('agentdock skill validate')

  if (!opts.dir) {
    p.cancel('A skill directory is required: agentdock skill validate <dir>')
    process.exit(1)
  }

  const spinner = p.spinner()
  spinner.start(`Validating ${opts.dir}...`)
  const result = await validateSkill(opts.dir)

  if (!result.ok) {
    spinner.stop('Validation failed.')
    for (const error of result.errors) {
      p.log.error(error)
    }
    p.outro('✗ Invalid skill')
    process.exit(1)
  }

  spinner.stop('Validation passed.')
  for (const warning of result.warnings) {
    p.log.warn(warning)
  }
  p.outro('✓ Valid skill')
}

export async function runSkillPublishHumanAdapter(opts: SkillPublishHumanOptions): Promise<void> {
  p.intro('agentdock skill publish')

  if (!opts.dir) {
    p.cancel('A skill directory is required: agentdock skill publish <dir> --registry <path>')
    process.exit(1)
  }

  if (!opts.registry) {
    p.cancel('--registry <path> is required')
    process.exit(1)
  }

  const spinner = p.spinner()
  spinner.start(`Publishing ${opts.dir}...`)
  const result = await publishSkill(opts.dir, opts.registry)

  if (!result.ok) {
    spinner.stop('Publish failed.')
    p.cancel(result.message)
    if (result.errors) {
      for (const error of result.errors) {
        p.log.error(error)
      }
    }
    process.exit(1)
  }

  spinner.stop('Publish complete.')
  const verb = result.updated ? 'Updated' : 'Added'
  p.outro(`${verb} "${result.entry.id}" → ${result.manifestPath}`)
}
