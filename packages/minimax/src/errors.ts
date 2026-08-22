/**
 * Mirrors `mmx-cli`'s own internal, **unexported** `ExitCode` enum
 * (`dist/sdk.mjs`, `mmx-cli@1.0.22`: `var ExitCode = { GENERAL: 1, USAGE: 2,
 * AUTH: 3, QUOTA: 4, TIMEOUT: 5, NETWORK: 6, CONTENT_FILTER: 10, ... }`).
 * Not imported — `mmx-cli/sdk`'s public export surface is `{ MiniMaxSDK }`
 * only (see `client.ts`), so there is nothing to import. Its internal
 * `CLIError`/`SDKError` classes both set `this.exitCode = <one of these>`
 * at construction, so duck-typing on that property (see `classifyError`
 * below) is the only way to read it without reaching into an unexported
 * symbol. `music.ts`'s hand-rolled HTTP client also stamps `.exitCode` with
 * these same numbers on the errors it throws, so `classifyError` handles
 * both the SDK-backed and the raw-HTTP-backed generation paths uniformly.
 */
export const MMX_EXIT_CODE = {
  GENERAL: 1,
  USAGE: 2,
  AUTH: 3,
  QUOTA: 4,
  TIMEOUT: 5,
  NETWORK: 6,
  CONTENT_FILTER: 10,
} as const

export type MinimaxErrorCategory =
  | 'timeout'
  | 'minimax_auth'
  | 'minimax_quota'
  | 'minimax_timeout'
  | 'minimax_network'
  | 'minimax_content_filter'
  | 'invalid_params'
  | 'minimax_error'
  | 'unknown'

/**
 * Classifies a thrown error from any generation function in this package,
 * without importing any unexported `mmx-cli` symbol.
 *
 * - `fetch`'s own `AbortSignal.timeout()` rejection surfaces as a
 *   `DOMException` named `"TimeoutError"` (Node's fetch implementation) —
 *   neither `mmx-cli`'s `requestJson()` nor this package's own `music.ts`
 *   catches or rewraps it.
 * - Everything else `mmx-cli` itself throws (auth rejected, quota
 *   exhausted, rate-limited, content filtered, bad params) is a
 *   `CLIError`/`SDKError` instance carrying `.exitCode` — duck-typed here
 *   since the classes themselves aren't exported. `music.ts` throws
 *   plain `Error` instances with the same `.exitCode` convention so this
 *   one function covers both.
 */
export function classifyError(error: unknown): MinimaxErrorCategory {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return 'timeout'
    }
    const exitCode = (error as { exitCode?: unknown }).exitCode
    if (typeof exitCode === 'number') {
      switch (exitCode) {
        case MMX_EXIT_CODE.AUTH:
          return 'minimax_auth'
        case MMX_EXIT_CODE.QUOTA:
          return 'minimax_quota'
        case MMX_EXIT_CODE.TIMEOUT:
          return 'minimax_timeout'
        case MMX_EXIT_CODE.NETWORK:
          return 'minimax_network'
        case MMX_EXIT_CODE.CONTENT_FILTER:
          return 'minimax_content_filter'
        case MMX_EXIT_CODE.USAGE:
          return 'invalid_params'
        default:
          return 'minimax_error'
      }
    }
  }
  return 'unknown'
}
