import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { readProperties } from 'skills-ref'
import { type AuthEnvironment, type AuthProvider, type FetchLike, readCredentials } from './auth.js'
import { normalizeGitRemoteUrl } from './gitRemoteUrl.js'
import { indexToRegistry } from './registryIndex.js'
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
   * Semver string, read from `metadata.version` (falling back to
   * thefoolai's `metadata['thefool.version']`) — see `resolveVersion` below.
   * The Agent Skills spec has no top-level `version` field, so this is never
   * read from frontmatter directly (openspec skill-semver-and-author-name
   * proposal.md "What Changes" #2). Optional: a skill may publish without a
   * version (proposal.md 待裁决 #1, resolved (b)) but never with a
   * malformed one — `publishSkill` rejects that before it reaches here.
   * Present only when non-empty — same "omit when empty" convention as
   * `path` / `license` / `author`.
   */
  version?: string
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
  /**
   * true when the skill published with no version at all — publish is not
   * blocked on this (proposal.md 待裁决 #1, resolved (b): optional but loudly
   * warned), but adapters use this flag to surface the warning since core
   * never writes to stdout/stderr itself.
   */
  versionMissing: boolean
  /**
   * true when the entry was also indexed into the hosted registry
   * (`cli-publish-to-registry` proposal.md — the step after the manifest
   * write). This is always an addendum: false here NEVER means the manifest
   * write failed, and it never rolls the manifest write back — see
   * `manifestPath` above, which is populated either way.
   */
  indexed: boolean
  /**
   * Present only when `indexed` is false because the request itself failed
   * (network error, timeout, non-2xx) — NOT when it's false because nobody
   * was signed in (that case is already covered by `anonymous`, and carries
   * no error to show). Adapters use this to print a status/error summary.
   */
  indexError?: string
}

export interface SkillPublishError {
  ok: false
  error:
    | 'SKILL_INVALID'
    | 'REGISTRY_NOT_FOUND'
    | 'SKILL_SOURCE_UNRESOLVED'
    | 'SKILL_VERSION_INVALID'
    | 'SKILL_PUBLISH_FAILED'
  message: string
  errors?: string[]
}

/** Filename of the manifest written into the `--registry` checkout. */
export const MANIFEST_FILENAME = 'skills.json'

/**
 * Strict semver (https://semver.org, the same grammar as the spec's own
 * regex): `major.minor.patch` with optional `-prerelease` and `+build`
 * segments, no leading `v`. Deliberately not a dependency — see tasks.md
 * 1.2 ("不引入新依赖").
 *
 * ★ Why this matters more than it looks: thefoolai's `compareVersions()`
 * parses each dot-separated segment with `parseInt(segment, 10) || 0`. Fed
 * `v1.2.0`, that silently parses as `[0, 2, 0]` — lower than `0.9.9` — so the
 * update path never triggers again for that skill, with no error anywhere
 * (openspec skill-semver-and-author-name proposal.md "缺口一"). Rejecting
 * non-semver strings here, before they ever reach a manifest, is the actual
 * fix; thefoolai's parser is left as-is (proposal.md Non-goals).
 */
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

/**
 * Reads the skill's version out of `metadata` — never off a top-level
 * frontmatter key, since the Agent Skills spec doesn't define one and adding
 * one there would just re-trigger the non-spec-field downgrade `lesson-prep`
 * already hit (proposal.md "缺口一", tasks.md 1.1).
 *
 * `metadata` is a flat `Record<string, string>` parsed straight off the YAML
 * `metadata:` mapping (skills-ref `parser.ts`), so thefoolai's namespaced key
 * is the literal string `"thefool.version"`, not a nested `thefool.version`
 * path — checked as a plain fallback key, in that order.
 */
export function resolveVersion(metadata: Record<string, string>): string | undefined {
  const raw = metadata.version ?? metadata['thefool.version']
  const trimmed = raw?.trim()
  return trimmed ? trimmed : undefined
}

/** Whether `version` is a well-formed semver string (no `v` prefix, no ranges). */
export function isValidSemver(version: string): boolean {
  return SEMVER_PATTERN.test(version)
}

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
  options: {
    author?: SkillAuthor | undefined
    authEnv?: AuthEnvironment
    /** Test/fork seam for `indexToRegistry` — production callers rely on the default. */
    provider?: AuthProvider
    fetchImpl?: FetchLike
  } = {},
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

  const version = resolveVersion(props.metadata)
  if (version !== undefined && !isValidSemver(version)) {
    return {
      ok: false,
      error: 'SKILL_VERSION_INVALID',
      message: `Invalid version "${version}" in "${dir}": expected semver (major.minor.patch, e.g. "1.2.3", optionally with a "-prerelease" and/or "+build" suffix, e.g. "1.2.3-beta.1" or "1.2.3+build.5") — got "${version}"`,
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
    ...(version ? { version } : {}),
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

    // Indexing is a strict addendum to the manifest write above (proposal.md
    // "manifest 永远先写，且永远不因索引失败而回滚") — it runs only after
    // that write has already succeeded, and its outcome is folded into the
    // result without ever changing `ok`.
    const indexResult = await indexToRegistry(
      {
        skillId: entry.id,
        gitUrl: entry.source,
        name: entry.name,
        description: entry.description,
        ...(entry.version ? { version: entry.version } : {}),
        ...(entry.license ? { license: entry.license } : {}),
      },
      {
        ...(options.provider ? { provider: options.provider } : {}),
        ...(options.authEnv ? { authEnv: options.authEnv } : {}),
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
      },
    )

    return {
      ok: true,
      entry,
      manifestPath,
      updated,
      anonymous: !author,
      versionMissing: !version,
      indexed: indexResult.indexed,
      ...(indexResult.indexed === false && indexResult.reason === 'REQUEST_FAILED'
        ? { indexError: indexResult.message }
        : {}),
    }
  } catch (err) {
    return {
      ok: false,
      error: 'SKILL_PUBLISH_FAILED',
      message: err instanceof Error ? err.message : String(err),
    }
  }
}
