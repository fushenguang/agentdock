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

  // Anonymous publishing stays allowed on purpose (cli-auth design.md §5): the
  // content repo is public and forks must keep working. But an unsigned entry
  // carries no provenance, so say so loudly rather than let it pass unnoticed.
  if (result.anonymous) {
    p.log.warn('Published anonymously — this entry has no author.')
    p.log.info('Run `agentdock auth login` first to sign your published skills.')
    // Indexing requires a signed-in identity (cli-publish-to-registry
    // proposal.md 反向对照 ①) — no request was even attempted.
    p.log.warn('Not indexed into the registry hub — sign in first so this entry can be found there.')
  } else {
    if (result.entry.author) {
      p.log.info(`Signed as ${result.entry.author.name ?? result.entry.author.id}`)
    }
    // Indexing is best-effort and never blocks the publish (proposal.md
    // "manifest 永远先写") — a failure here is a warning, not an error.
    if (result.indexed) {
      p.log.info('Indexed into the registry hub.')
    } else {
      p.log.warn(`Could not index into the registry hub: ${result.indexError ?? 'unknown error'}`)
    }
  }

  // No version is allowed (proposal.md 待裁决 #1, resolved (b): optional but
  // loudly warned) so forks that haven't added `metadata.version` yet aren't
  // blocked — but an unversioned entry can't be diffed against future
  // publishes, so make that loud instead of silent.
  if (result.versionMissing) {
    p.log.warn('Published without a version — this entry cannot be diffed against future updates.')
    p.log.info('Add `metadata.version: <semver>` (e.g. "1.0.0") to SKILL.md to fix this.')
  }

  const verb = result.updated ? 'Updated' : 'Added'
  p.outro(`${verb} "${result.entry.id}" → ${result.manifestPath}`)
}
