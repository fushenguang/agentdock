import { readCredentials, resolveProvider } from './auth.js'
import type { AuthEnvironment, AuthProvider, FetchLike } from './auth.js'

/**
 * Indexes a freshly-published manifest entry into the provider's hosted
 * registry — the second (optional) step of `skill publish`, per
 * `cli-publish-to-registry` proposal.md "What Changes":
 *
 *   ① write the git manifest (core/skillPublish.ts — the source of truth,
 *      never rolled back)
 *   ② POST {webUrl}/api/skills/publish + Bearer <token> (this module)
 *
 * This reuses the zero-key transport shape `cli-auth-via-endpoint` built for
 * `consumeDeviceAuth()` (auth.ts design.md §2.2): the CLI never holds an API
 * key, only the access token a logged-in user already has on disk. Kept as
 * its own module rather than folded into auth.ts because it is not part of
 * the login flow — it is the *one* other backend touch point the CLI has,
 * and giving it its own file keeps that boundary visible instead of letting
 * auth.ts grow a second, unrelated responsibility.
 *
 * Hard behavioral rules (proposal.md 反向对照 ①②, and this cut's brief):
 *   - never called when nobody is signed in
 *   - never retried — this is a one-shot best-effort call, not `pollForSession`
 *   - always time-bounded — a slow/hanging endpoint must not hang `publish`
 *   - never throws — every failure mode resolves to `{ indexed: false, ... }`
 *     so the caller (skillPublish.ts) can write the manifest unconditionally
 *     and treat indexing purely as an addendum to the result
 */

/** Manifest fields the endpoint accepts. Deliberately NOT `access_tier` /
 * `is_official` / any scan/security status — those are server-assigned
 * (proposal.md "核心安全问题": a client-supplied "scan passed" is exactly the
 * bypass the server-side design is meant to close). */
export interface RegistryIndexEntry {
  skillId: string
  gitUrl: string
  name: string
  description: string
  version?: string
  license?: string
}

export type RegistryIndexResult =
  | { indexed: true }
  | { indexed: false; reason: 'ANONYMOUS' }
  | { indexed: false; reason: 'REQUEST_FAILED'; message: string }

/** One-shot call, not a poll loop — 15s is generous for a JSON POST but still
 * a hard ceiling, per this cut's brief ("给这次请求设一个明确的超时"). */
export const REGISTRY_INDEX_TIMEOUT_MS = 15_000

export interface IndexToRegistryOptions {
  provider?: AuthProvider
  authEnv?: AuthEnvironment
  fetchImpl?: FetchLike
  /** Test seam only — production callers should rely on the default. */
  timeoutMs?: number
}

export async function indexToRegistry(
  entry: RegistryIndexEntry,
  options: IndexToRegistryOptions = {},
): Promise<RegistryIndexResult> {
  const authEnv = options.authEnv ?? {}
  const status = readCredentials(authEnv)
  if (!status.loggedIn) {
    // No request at all — an anonymous publish must not even attempt to
    // reach the endpoint (this cut's brief, reverse-check ①).
    return { indexed: false, reason: 'ANONYMOUS' }
  }

  const provider = options.provider ?? resolveProvider(authEnv)
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const timeoutMs = options.timeoutMs ?? REGISTRY_INDEX_TIMEOUT_MS
  const url = `${provider.webUrl.replace(/\/+$/, '')}/api/skills/publish`

  const body: Record<string, string> = {
    skill_id: entry.skillId,
    git_url: entry.gitUrl,
    name: entry.name,
    description: entry.description,
  }
  if (entry.version) body.version = entry.version
  if (entry.license) body.license = entry.license

  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${status.credentials.accessToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) {
      return { indexed: false, reason: 'REQUEST_FAILED', message: `HTTP ${response.status}` }
    }
    return { indexed: true }
  } catch (err) {
    // Covers network errors AND the abort-on-timeout case above — both are
    // "the request failed", never a reason to retry or to hang `publish`.
    const message = err instanceof Error ? err.message : String(err)
    return { indexed: false, reason: 'REQUEST_FAILED', message }
  }
}
