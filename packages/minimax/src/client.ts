import { MiniMaxSDK } from 'mmx-cli/sdk'

/**
 * `mmx-cli`'s subpath export (`mmx-cli/sdk`) is undocumented — no README, no
 * doc comments on the public surface beyond what `dist/index.d.ts` states.
 * Version-to-version diffing (see this package's PR description for the
 * table) proved the SDK's own capability set is **not stable across patch
 * releases**: `music` existed in `1.0.19` and was silently removed by
 * `1.0.21`. `mmx-cli` is therefore pinned to an exact version in
 * `package.json` (no `^`), and this package never trusts the SDK's own
 * TypeScript types as a contract — see `MinimaxClient` below.
 */

/**
 * Narrow shape of the client this package actually calls, declared here
 * instead of imported from `mmx-cli/sdk`'s own types.
 *
 * 🔴 This is deliberate, not laziness, and it must not be "simplified" back
 * to `MiniMaxSDK` directly:
 *
 * 1. **Testability** — callers (and this package's own tests) can inject a
 *    plain object satisfying this interface without touching the network or
 *    the real SDK at all.
 * 2. **Upgrade sentinel** — `MiniMaxSDK` structurally satisfies this
 *    interface today, but `mmx-cli` has already deleted a whole capability
 *    (`music`) in a patch release without a major version bump. If a future
 *    `mmx-cli` upgrade drops (or renames) `image`, `video`, `file`, or
 *    `quota`, assigning the new `MiniMaxSDK` instance to this interface
 *    stops compiling — a loud `tsc` failure at the `createMinimaxClient`
 *    call site — instead of a silent `undefined` blowing up at runtime deep
 *    inside a request handler. `client.test.ts`'s type-level sentinel
 *    asserts this mechanism actually works for `image`.
 */
export interface MinimaxClient {
  image: {
    generate(request: {
      prompt: string
      width?: number
      height?: number
      response_format: 'base64'
      /** Candidate count — see `GenerateImageParams.n` in `image.ts`. */
      n?: number
    }): Promise<{ data: { image_base64?: string[] } }>
  }
  video: {
    /**
     * Only the `async: true` overload is declared — this package never uses
     * the SDK's own blocking/polling `generate()` overload (it does its own
     * polling via `getTask`, on its own clock, so it can enforce "no
     * automatic retry on failure" itself). See `video.ts`.
     */
    generate(request: {
      model: string
      prompt: string
      async: true
    }): Promise<{ taskId: string }>
    /**
     * `status` is deliberately typed as `string`, not the real SDK's literal
     * union. The real `getTask()` returns `VideoTaskResponse | VideoV2Task`
     * — one shape for legacy models (status `"Success"` etc., `file_id`),
     * one for `MiniMax-H3` (status `"succeeded"` etc., `content.url`). This
     * package only ever requests legacy models (see `video.ts`'s doc
     * comment on why), but the SDK's return type doesn't narrow based on
     * the model you passed in, so a literal union here would reject the
     * real `VideoV2Task` half of that union and make `MiniMaxSDK` fail to
     * satisfy this interface. Narrowing happens at the call site instead.
     */
    getTask(request: { taskId: string; model?: string }): Promise<{
      status: string
      file_id?: string
    }>
  }
  file: {
    retrieve(fileId: string): Promise<{ file: { download_url?: string } }>
  }
  quota: {
    info(): Promise<MinimaxQuotaResponse>
  }
}

export interface CreateMinimaxClientOptions {
  apiKey: string
  /** e.g. `"https://api.minimax.io"` (global) or `"https://api.minimaxi.com"` (cn). */
  baseUrl?: string
  region?: 'global' | 'cn'
}

export function createMinimaxClient(opts: CreateMinimaxClientOptions): MinimaxClient {
  // Conditional spread (not `baseUrl: opts.baseUrl`) because
  // `MiniMaxSDKOptions.baseUrl`/`.region` are optional properties without a
  // `| undefined` arm — under this package's `exactOptionalPropertyTypes:
  // true`, explicitly assigning `undefined` to them is a type error.
  return new MiniMaxSDK({
    apiKey: opts.apiKey,
    ...(opts.baseUrl ? { baseUrl: opts.baseUrl } : {}),
    ...(opts.region ? { region: opts.region } : {}),
  })
}

/**
 * One entry from `QuotaResponse.model_remains` — narrowed to the fields
 * `isQuotaExhausted`/`msUntilReset` (see `quota.ts`) actually read. The real
 * `mmx-cli` response carries more fields (`start_time`, `weekly_start_time`,
 * `current_interval_status`, ...); this package ignores them.
 */
export interface MinimaxQuotaModelRemain {
  model_name: string
  /** Seconds until the current interval's quota resets. */
  remains_time: number
  current_interval_total_count: number
  current_interval_usage_count: number
  current_interval_remaining_percent?: number
  weekly_remains_time?: number
  current_weekly_remaining_percent?: number
}

export interface MinimaxQuotaResponse {
  model_remains: MinimaxQuotaModelRemain[]
}
