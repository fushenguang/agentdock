import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { homedir, hostname, platform } from 'os'
import { join } from 'path'
import { VERSION } from '../version.js'

/**
 * Browser-delegated login for the CLI (`agentdock auth`).
 *
 * The flow is deliberately identical to the one TheFoolAI's desktop app already
 * runs, because that path is proven in production (design.md §1):
 *
 *   1. generate a `device_code` (uuid)
 *   2. open the system browser at `{webUrl}/device-auth?code=…`
 *   3. poll `consume_device_auth(p_device_code)` until approved
 *
 * ★ The client does NOT create the pending row — the *web page* does, in its own
 * server function. So the only backend interaction this module needs is a single
 * RPC call. That is why `consumeDeviceAuth()` below is the one and only network
 * touch point: design.md §2.2 wants to move it behind a provider HTTP endpoint
 * later (zero secrets in the package), and keeping it a single function is what
 * makes that a one-function change instead of a refactor.
 *
 * `consume_device_auth` is a SECURITY DEFINER *one-shot* RPC: it returns the
 * session and clears `session_data` in the same statement, so a token can be read
 * at most once, by whoever calls first.
 */

/** A login target. One provider = one hub. */
export interface AuthProvider {
  name: string
  /** Web app origin — the browser is sent to `{webUrl}/device-auth`. */
  webUrl: string
  /** PostgREST origin that exposes `consume_device_auth`. */
  supabaseUrl: string
  /**
   * Public anon key for the PostgREST call. Empty by default on purpose: see
   * `DEFAULT_PROVIDER`. Never a secret — but also never invented here.
   */
  anonKey: string
}

export interface StoredCredentials {
  provider: string
  /** Stable id. This — not the display name — is what attribution keys on. */
  userId: string
  /** Redundant human-readable label; may change over time (design.md §4). */
  displayName?: string
  accessToken: string
  refreshToken?: string
  savedAt: string
}

export type AuthStatus =
  | { loggedIn: true; credentials: StoredCredentials }
  | { loggedIn: false; reason: 'NO_CREDENTIALS' | 'CORRUPT_CREDENTIALS' }

/**
 * Built-in default provider.
 *
 * `anonKey` is intentionally EMPTY. The key itself is public by design (it ships
 * inside every desktop app build and every web page load), but baking a specific
 * deployment's key into a published npm package is a decision for the repo owner,
 * not something this module should make silently — and a stale baked-in key would
 * break `login` on rotation with no way to fix it short of a CLI release.
 *
 * Supply it via `AGENTDOCK_AUTH_ANON_KEY` or `~/.agentdock/config.json`.
 */
export const DEFAULT_PROVIDER: AuthProvider = {
  name: 'thefoolai',
  webUrl: 'https://www.fujia.site',
  supabaseUrl: 'https://db.fujia.site',
  anonKey: '',
}

export const CONFIG_DIR_NAME = '.agentdock'
export const CREDENTIALS_FILENAME = 'credentials.json'
export const CONFIG_FILENAME = 'config.json'

/** Poll cadence and hard ceiling — mirrors the desktop app, and is never unbounded. */
export const POLL_INTERVAL_MS = 2000
export const LOGIN_TIMEOUT_MS = 5 * 60 * 1000

export interface AuthEnvironment {
  /** Injected so tests never touch the real `~/.agentdock`. */
  homeDir?: string
  env?: NodeJS.ProcessEnv
}

const configDir = (env: AuthEnvironment = {}): string =>
  join(env.homeDir ?? homedir(), CONFIG_DIR_NAME)

export const credentialsPath = (env: AuthEnvironment = {}): string =>
  join(configDir(env), CREDENTIALS_FILENAME)

export const configPath = (env: AuthEnvironment = {}): string =>
  join(configDir(env), CONFIG_FILENAME)

const readJsonFile = <T>(path: string): T | null => {
  if (!existsSync(path)) return null
  try {
    const raw = readFileSync(path, 'utf-8')
    if (!raw.trim()) return null
    return JSON.parse(raw) as T
  } catch {
    // Callers treat null as "absent". A corrupt file must never throw a stack at
    // the user — `status` reports "not logged in" and `login` just overwrites it.
    return null
  }
}

/**
 * Resolve the provider to use. Precedence (high → low), design.md §2:
 * explicit name → env vars → `~/.agentdock/config.json` → built-in default.
 *
 * Note the merge is per-field, not all-or-nothing: setting only
 * `AGENTDOCK_AUTH_ANON_KEY` keeps the default URLs, which is the common case.
 */
export function resolveProvider(
  options: { providerName?: string } & AuthEnvironment = {},
): AuthProvider {
  const env = options.env ?? process.env
  const config = readJsonFile<{
    auth?: { providers?: Record<string, Partial<AuthProvider>>; defaultProvider?: string }
  }>(configPath(options))

  const name = options.providerName ?? config?.auth?.defaultProvider ?? DEFAULT_PROVIDER.name
  const fromConfig = config?.auth?.providers?.[name] ?? {}

  return {
    name,
    webUrl: env.AGENTDOCK_AUTH_WEB_URL || fromConfig.webUrl || DEFAULT_PROVIDER.webUrl,
    supabaseUrl:
      env.AGENTDOCK_AUTH_SUPABASE_URL || fromConfig.supabaseUrl || DEFAULT_PROVIDER.supabaseUrl,
    anonKey: env.AGENTDOCK_AUTH_ANON_KEY || fromConfig.anonKey || DEFAULT_PROVIDER.anonKey,
  }
}

export function readCredentials(env: AuthEnvironment = {}): AuthStatus {
  const path = credentialsPath(env)
  if (!existsSync(path)) return { loggedIn: false, reason: 'NO_CREDENTIALS' }

  const parsed = readJsonFile<StoredCredentials>(path)
  if (!parsed || !parsed.userId || !parsed.accessToken) {
    return { loggedIn: false, reason: 'CORRUPT_CREDENTIALS' }
  }
  return { loggedIn: true, credentials: parsed }
}

export function writeCredentials(
  credentials: StoredCredentials,
  env: AuthEnvironment = {},
): string {
  const dir = configDir(env)
  // 0700/0600: the CLI's threat model assumes anyone who can read your home dir
  // has already won (~/.npmrc, ~/.gitconfig, ssh keys all live there), but there
  // is no reason to be looser than the neighbours.
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  const path = credentialsPath(env)
  writeFileSync(path, JSON.stringify(credentials, null, 2) + '\n', {
    encoding: 'utf-8',
    mode: 0o600,
  })
  return path
}

export function clearCredentials(env: AuthEnvironment = {}): boolean {
  const path = credentialsPath(env)
  if (!existsSync(path)) return false
  writeFileSync(path, '', { encoding: 'utf-8', mode: 0o600 })
  try {
    // Best-effort unlink after truncation, so a failure to remove still leaves
    // nothing readable behind.
    unlinkSync(path)
  } catch {
    /* truncated already — nothing sensitive remains */
  }
  return true
}

export function buildDeviceAuthUrl(provider: AuthProvider, deviceCode: string): string {
  const params = new URLSearchParams({
    code: deviceCode,
    device_name: `${hostname()} (agentdock CLI)`,
    os: platform(),
    version: VERSION,
  })
  return `${provider.webUrl.replace(/\/+$/, '')}/device-auth?${params.toString()}`
}

export interface ConsumeResult {
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'consumed' | 'not_found' | string
  session?: { access_token?: string; refresh_token?: string; user?: { email?: string } } | string
  user_id?: string
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/**
 * The ONE backend touch point (design.md §1). Swapping this to a provider HTTP
 * endpoint is what §2.2 means by "zero secrets in the package".
 */
export async function consumeDeviceAuth(
  provider: AuthProvider,
  deviceCode: string,
  fetchImpl: FetchLike = globalThis.fetch,
): Promise<ConsumeResult | { error: string }> {
  const url = `${provider.supabaseUrl.replace(/\/+$/, '')}/rest/v1/rpc/consume_device_auth`
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: provider.anonKey,
        Authorization: `Bearer ${provider.anonKey}`,
        'Accept-Profile': 'cogito',
        'Content-Profile': 'cogito',
      },
      body: JSON.stringify({ p_device_code: deviceCode }),
    })
    if (!response.ok) {
      return { error: `HTTP ${response.status}` }
    }
    return (await response.json()) as ConsumeResult
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export type LoginOutcome =
  | { ok: true; credentials: StoredCredentials }
  | {
      ok: false
      error:
        | 'DENIED'
        | 'EXPIRED'
        | 'ALREADY_CONSUMED'
        | 'TIMEOUT'
        | 'CANCELLED'
        | 'PROVIDER_NOT_CONFIGURED'
      message: string
    }

export interface PollOptions {
  provider: AuthProvider
  deviceCode: string
  fetchImpl?: FetchLike
  sleep?: (ms: number) => Promise<void>
  now?: () => number
  signal?: { aborted: boolean }
  onAttempt?: (attempt: number) => void
}

const realSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Poll until approved, refused, or the 5-minute ceiling.
 *
 * The ceiling is not decoration: an unbounded wait is exactly how a stalled
 * network turns into a CLI that looks hung with no way to tell "slow" from
 * "broken".
 */
export async function pollForSession(options: PollOptions): Promise<LoginOutcome> {
  const {
    provider,
    deviceCode,
    fetchImpl = globalThis.fetch,
    sleep = realSleep,
    now = Date.now,
    signal,
    onAttempt,
  } = options

  const startedAt = now()
  let attempt = 0

  while (now() - startedAt < LOGIN_TIMEOUT_MS) {
    if (signal?.aborted) return { ok: false, error: 'CANCELLED', message: 'Login cancelled' }
    await sleep(POLL_INTERVAL_MS)
    if (signal?.aborted) return { ok: false, error: 'CANCELLED', message: 'Login cancelled' }

    attempt += 1
    onAttempt?.(attempt)

    const result = await consumeDeviceAuth(provider, deviceCode, fetchImpl)
    if ('error' in result) continue // transient — keep polling until the ceiling

    if (result.status === 'approved' && result.session) {
      const session =
        typeof result.session === 'string' ? safeParse(result.session) : result.session
      if (!session?.access_token || !result.user_id) {
        return {
          ok: false,
          error: 'EXPIRED',
          message: 'Authorization returned an unusable session',
        }
      }
      return {
        ok: true,
        credentials: {
          provider: provider.name,
          userId: result.user_id,
          accessToken: session.access_token,
          ...(session.user?.email ? { displayName: session.user.email } : {}),
          ...(session.refresh_token ? { refreshToken: session.refresh_token } : {}),
          savedAt: new Date(now()).toISOString(),
        },
      }
    }

    if (result.status === 'denied') {
      return { ok: false, error: 'DENIED', message: 'Authorization was denied in the browser' }
    }
    if (result.status === 'expired') {
      return { ok: false, error: 'EXPIRED', message: 'Authorization request expired' }
    }
    if (result.status === 'consumed') {
      // One-shot RPC: someone already took this token. Polling on would wait out
      // the full five minutes for a guaranteed failure.
      return {
        ok: false,
        error: 'ALREADY_CONSUMED',
        message: 'This authorization was already used — start the login again',
      }
    }
  }

  return { ok: false, error: 'TIMEOUT', message: 'Timed out waiting for browser authorization' }
}

const safeParse = (
  raw: string,
): { access_token?: string; refresh_token?: string; user?: { email?: string } } | null => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function newDeviceCode(): string {
  return randomUUID()
}

/** Opens a URL in the system browser. Failure is non-fatal — we print the URL too. */
export function openBrowser(url: string): void {
  const command = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open'
  try {
    spawn(command, [url], {
      detached: true,
      stdio: 'ignore',
      shell: platform() === 'win32',
    }).unref()
  } catch {
    /* caller prints the URL as a fallback */
  }
}
