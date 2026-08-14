import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { describe, it, expect, afterEach } from 'vitest'
import { publishSkill, MANIFEST_FILENAME } from '../skillPublish.js'
import type { SkillManifest } from '../skillPublish.js'

const FAKE_REMOTE = 'git@example.com:acme/skills-repo.git'

function makeWorkDir(label: string): string {
  const dir = join(
    tmpdir(),
    `agentdock-skill-publish-test-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  mkdirSync(dir, { recursive: true })
  return dir
}

/** A git repo (with an `origin` remote) containing a skill directory at `skills/<name>`. */
function makeSkillRepo(name: string, frontmatter: string): { repoRoot: string; skillDir: string } {
  const repoRoot = makeWorkDir(`repo-${name}`)
  execSync('git init -q', { cwd: repoRoot, stdio: 'ignore' })
  execSync(`git remote add origin ${FAKE_REMOTE}`, { cwd: repoRoot, stdio: 'ignore' })

  const skillDir = join(repoRoot, 'skills', name)
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(
    join(skillDir, 'SKILL.md'),
    `---\n${frontmatter}\n---\n\n# ${name}\n\nBody.\n`,
    'utf-8',
  )

  return { repoRoot, skillDir }
}

function readManifest(registryDir: string): SkillManifest {
  return JSON.parse(readFileSync(join(registryDir, MANIFEST_FILENAME), 'utf-8')) as SkillManifest
}

describe('publishSkill', () => {
  let cleanupDirs: string[] = []

  afterEach(() => {
    for (const dir of cleanupDirs) {
      try {
        rmSync(dir, { recursive: true, force: true })
      } catch {
        // ignore cleanup errors
      }
    }
    cleanupDirs = []
  })

  it('writes a manifest entry with the resolved git source for a valid skill', async () => {
    const { repoRoot, skillDir } = makeSkillRepo(
      'good-skill',
      'name: good-skill\ndescription: A valid publishable skill.',
    )
    const registryDir = makeWorkDir('registry')
    cleanupDirs.push(repoRoot, registryDir)

    const result = await publishSkill(skillDir, registryDir)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.updated).toBe(false)
    expect(result.entry.id).toBe('good-skill')
    expect(result.entry.name).toBe('good-skill')
    expect(result.entry.description).toBe('A valid publishable skill.')
    expect(result.entry.source).toBe(FAKE_REMOTE)
    expect(result.entry.path).toBe(join('skills', 'good-skill'))
    expect(result.entry.nonSpecFields).toBeUndefined()
    expect(typeof result.entry.publishedAt).toBe('string')

    expect(existsSync(result.manifestPath)).toBe(true)
    const manifest = readManifest(registryDir)
    expect(manifest.version).toBe('1')
    expect(manifest.skills).toHaveLength(1)
    expect(manifest.skills[0]?.id).toBe('good-skill')
  })

  it('records downgraded non-spec top-level fields explicitly on the manifest entry (never silently dropped)', async () => {
    const { repoRoot, skillDir } = makeSkillRepo(
      'pipeline-skill',
      [
        'name: pipeline-skill',
        'description: A skill with a non-spec top-level key.',
        'pipeline:',
        '  post_processor: md2pptx',
      ].join('\n'),
    )
    const registryDir = makeWorkDir('registry')
    cleanupDirs.push(repoRoot, registryDir)

    const result = await publishSkill(skillDir, registryDir)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.entry.nonSpecFields).toEqual(['pipeline'])
  })

  it('is idempotent: republishing the same skill updates the entry instead of duplicating it', async () => {
    const { repoRoot, skillDir } = makeSkillRepo(
      'repeat-skill',
      'name: repeat-skill\ndescription: First description.',
    )
    const registryDir = makeWorkDir('registry')
    cleanupDirs.push(repoRoot, registryDir)

    const first = await publishSkill(skillDir, registryDir)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.updated).toBe(false)

    // Change the description and republish the same skill (same name/id).
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      '---\nname: repeat-skill\ndescription: Updated description.\n---\n\n# repeat-skill\n\nBody.\n',
      'utf-8',
    )

    const second = await publishSkill(skillDir, registryDir)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.updated).toBe(true)

    const manifest = readManifest(registryDir)
    expect(manifest.skills).toHaveLength(1)
    expect(manifest.skills[0]?.description).toBe('Updated description.')
  })

  it('does not write a manifest when validation fails', async () => {
    const { repoRoot, skillDir } = makeSkillRepo(
      'broken-skill',
      'description: Missing the name field.',
    )
    const registryDir = makeWorkDir('registry')
    cleanupDirs.push(repoRoot, registryDir)

    const result = await publishSkill(skillDir, registryDir)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('SKILL_INVALID')
    expect(result.errors?.length).toBeGreaterThan(0)
    expect(existsSync(join(registryDir, MANIFEST_FILENAME))).toBe(false)
  })

  it('returns REGISTRY_NOT_FOUND when the registry checkout does not exist', async () => {
    const { repoRoot, skillDir } = makeSkillRepo(
      'good-skill-2',
      'name: good-skill-2\ndescription: Valid.',
    )
    cleanupDirs.push(repoRoot)
    const missingRegistryDir = join(tmpdir(), `agentdock-does-not-exist-${Date.now()}`)

    const result = await publishSkill(skillDir, missingRegistryDir)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('REGISTRY_NOT_FOUND')
  })

  it('returns SKILL_SOURCE_UNRESOLVED when the skill directory is not inside a git repository', async () => {
    const parentDir = makeWorkDir('no-git')
    const skillDir = join(parentDir, 'lonely-skill')
    mkdirSync(skillDir, { recursive: true })
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      '---\nname: lonely-skill\ndescription: Not in a git repo.\n---\n\nBody.\n',
      'utf-8',
    )
    const registryDir = makeWorkDir('registry')
    cleanupDirs.push(parentDir, registryDir)

    // Guard against the (unlikely) case tmpdir() itself sits inside a git
    // repo on some machine — this test's premise requires it not to.
    let insideGitRepo = true
    try {
      execSync('git rev-parse --show-toplevel', { cwd: skillDir, stdio: 'ignore' })
    } catch {
      insideGitRepo = false
    }
    if (insideGitRepo) return

    const result = await publishSkill(skillDir, registryDir)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('SKILL_SOURCE_UNRESOLVED')
  })
})
