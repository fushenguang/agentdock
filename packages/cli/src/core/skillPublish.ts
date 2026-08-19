import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { readProperties } from 'skills-ref'
import { type AuthEnvironment, readCredentials } from './auth.js'
import { normalizeGitRemoteUrl } from './gitRemoteUrl.js'
import { extractNonSpecFields, validateSkill } from './skillValidate.js'

/**
 * git manifest schema for the skill registry.
 *
 * Shape borrowed from `src/registry.json` (id/name/description/source —
 * design.md §2), but NOT its loading code: that code hardcodes "content is
 * bundled inside the CLI package", which doesn't fit "source points at an
 * external git repo" (design.md §2 / tasks.md 2.2).
 *
 * There is deliberately no `minCliVersion` / `resolvedDependencies` here —
 * those are template-registry concepts (CLI compat gate, npm deps), and the
 * Agent Skills spec has no version field to borrow instead.
 */
/**
 * Who published this entry (cli-auth design.md §4).
 *
 * `id` is the stable key attribution hangs off; `name` is a redundant, possibly
 * stale human label. Storing only the readable one would break provenance the
 * first time somebody changes their display name.
 */
export interface SkillAuthor {
  id: string
  name?: string
}

export interface SkillManifestEntry {
  /** Skill name from frontmatter — also the idempotency key (design.md §2, tasks.md 2.4). */
  id: string
  name: string
  description: string
  /** git remote URL of the repo that contains this skill. */
  source: string
  /** Path of the skill directory relative to the repo root, when not the repo root itself. */
  path?: string
  license?: string
  /**
   * Non-spec top-level frontmatter keys that skills-ref downgraded to
   * warnings (design.md §3.1 附带要求). Present only when non-empty — never
   * silently dropped.
   */
  nonSpecFields?: string[]
  /**
   * Publisher identity, present only when the CLI was logged in at publish time.
   * Absent (not `null`) when anonymous — same "omit when empty" convention as
   * `path` / `license` / `nonSpecFields` above.
   */
  author?: SkillAuthor
  /** ISO 8601 timestamp of the most recent publish of this entry. */
  publishedAt: string
}

export interface SkillManifest {
  version: '1'
  skills: SkillManifestEntry[]
}

export interface SkillPublishResult {
  ok: true
  entry: SkillManifestEntry
  manifestPath: string
  /** true when an existing entry with the same id was replaced (idempotent update). */
  updated: boolean
  /** true when nobody was signed in, so the entry carries no author. */
  anonymous: boolean
}

export interface SkillPublishError {
  ok: false
  error: 'SKILL_INVALID' | 'REGISTRY_NOT_FOUND' | 'SKILL_SOURCE_UNRESOLVED' | 'SKILL_PUBLISH_FAILED'
  message: string
  errors?: string[]
}

/** Filename of the manifest written into the `--registry` checkout. */
export const MANIFEST_FILENAME = 'skills.json'

/**
 * Resolves the git remote URL + in-repo relative path for a skill directory.
 * `publish` needs this because a manifest entry that lacks a real, clonable
 * source is not "a real usable manifest entry" (design.md §6-1).
 */
function resolveGitSource(dir: string): { source: string; path?: string } | { error: string } {
  const absDir = resolve(dir)

  // `git rev-parse --show-toplevel` is only used to confirm we're inside a
  // repo (and for the error message) — the actual relative path comes from
  // `--show-prefix` below, computed by git itself, so it can't disagree with
  // git about where the repo root is (e.g. os.tmpdir() vs its realpath on
  // macOS, where /var/folders is a symlink to /private/var/folders and a
  // manual `path.relative(root, absDir)` would silently produce a bogus
  // `../../..` climb instead of the intended in-repo path).
  try {
    execSync('git rev-parse --show-toplevel', {
      cwd: absDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return { error: `"${absDir}" is not inside a git repository` }
  }

  let remote: string
  try {
    remote = execSync('git remote get-url origin', {
      cwd: absDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return { error: `no git remote "origin" configured for the repository containing "${absDir}"` }
  }

  if (!remote) {
    return { error: `no git remote "origin" configured for the repository containing "${absDir}"` }
  }

  const normalized = normalizeGitRemoteUrl(remote)
  if ('error' in normalized) {
    return { error: normalized.error }
  }

  const prefix = execSync('git rev-parse --show-prefix', {
    cwd: absDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .trim()
    .replace(/\/+$/, '')

  return prefix ? { source: normalized.url, path: prefix } : { source: normalized.url }
}

function loadManifest(manifestPath: string): SkillManifest {
  if (!existsSync(manifestPath)) {
    return { version: '1', skills: [] }
  }
  const raw = readFileSync(manifestPath, 'utf-8')
  return JSON.parse(raw) as SkillManifest
}

/**
 * Validates then publishes a skill into a local registry checkout.
 *
 * Pure: does not write stdout, does not call `process.exit`. The only side
 * effect is writing the manifest file inside `registryDir` — the actual
 * product of this command (design.md §1). Never commits, pushes, or opens a
 * PR (design.md §4 — hard boundary).
 */
/**
 * Resolve the signed-in identity into an author stamp, or `undefined` when
 * nobody is signed in. Kept separate from `publishSkill` so tests can inject a
 * fake home directory instead of touching the real `~/.agentdock`.
 */
export function currentAuthor(env: AuthEnvironment = {}): SkillAuthor | undefined {
  const status = readCredentials(env)
  if (!status.loggedIn) return undefined
  return {
    id: status.credentials.userId,
    ...(status.credentials.displayName ? { name: status.credentials.displayName } : {}),
  }
}

export async function publishSkill(
  dir: string,
  registryDir: string,
  options: { author?: SkillAuthor | undefined; authEnv?: AuthEnvironment } = {},
): Promise<SkillPublishResult | SkillPublishError> {
  const validation = await validateSkill(dir)
  if (!validation.ok) {
    return {
      ok: false,
      error: 'SKILL_INVALID',
      message: `"${dir}" failed skill validation`,
      errors: validation.errors,
    }
  }

  if (!existsSync(registryDir)) {
    return {
      ok: false,
      error: 'REGISTRY_NOT_FOUND',
      message: `Registry checkout not found: "${registryDir}"`,
    }
  }

  const gitSource = resolveGitSource(dir)
  if ('error' in gitSource) {
    return { ok: false, error: 'SKILL_SOURCE_UNRESOLVED', message: gitSource.error }
  }

  let props
  try {
    props = await readProperties(dir)
  } catch (err) {
    return {
      ok: false,
      error: 'SKILL_PUBLISH_FAILED',
      message: err instanceof Error ? err.message : String(err),
    }
  }

  const nonSpecFields = extractNonSpecFields(validation.warnings)
  const author = 'author' in options ? options.author : currentAuthor(options.authEnv ?? {})

  const entry: SkillManifestEntry = {
    id: props.name,
    name: props.name,
    description: props.description,
    source: gitSource.source,
    ...(gitSource.path ? { path: gitSource.path } : {}),
    ...(props.license ? { license: props.license } : {}),
    ...(nonSpecFields.length > 0 ? { nonSpecFields } : {}),
    ...(author ? { author } : {}),
    publishedAt: new Date().toISOString(),
  }

  try {
    const manifestPath = join(registryDir, MANIFEST_FILENAME)
    const manifest = loadManifest(manifestPath)

    const existingIndex = manifest.skills.findIndex((s) => s.id === entry.id)
    const updated = existingIndex !== -1
    if (updated) {
      manifest.skills[existingIndex] = entry
    } else {
      manifest.skills.push(entry)
    }

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')

    return { ok: true, entry, manifestPath, updated, anonymous: !author }
  } catch (err) {
    return {
      ok: false,
      error: 'SKILL_PUBLISH_FAILED',
      message: err instanceof Error ? err.message : String(err),
    }
  }
}
