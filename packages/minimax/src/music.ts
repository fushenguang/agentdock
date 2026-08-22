import { MMX_EXIT_CODE } from './errors.js'
import type { GeneratedAsset } from './types.js'

/**
 * `mmx-cli`'s `music` sub-SDK existed in `1.0.19` and was silently removed
 * by `1.0.21` (confirmed by unpacking both tarballs and grepping
 * `dist/sdk.mjs` for `MusicSDK` — present in the former, absent in the
 * latter; see this package's PR description for the full version table).
 * This package pins `mmx-cli` to `1.0.22`, so `client.ts`'s `MinimaxClient`
 * cannot include `music` at all — there is nothing left to call.
 *
 * The platform's `music_generation` HTTP endpoint is still live (MiniMax
 * removed it from the SDK, not from the API), so this module talks to it
 * directly. The request/response shape below is not guessed: it is copied
 * from `mmx-cli@1.0.19`'s own `MusicSDK` implementation (`dist/sdk.mjs`,
 * `class MusicSDK extends Client`) — endpoint path (`/v1/music_generation`),
 * default `model` (`"music-3.0"`, `musicGenerateModel()`'s fallback), and
 * response shape (`MusicResponse.data.audio`, hex-encoded).
 */

const DEFAULT_BASE_URL = 'https://api.minimax.io'
const MUSIC_ENDPOINT_PATH = '/v1/music_generation'
const DEFAULT_MODEL = 'music-3.0'

/**
 * Narrow shape of a music-generation call — deliberately shaped like
 * `mmx-cli@1.0.19`'s own (now-deleted) `MusicSDK.generate()` request, so a
 * reader can compare this package's request body to that source directly.
 */
export interface MinimaxMusicClient {
  generate(request: {
    prompt: string
    genre?: string
    is_instrumental: true
  }): Promise<{ data: { audio?: string } }>
}

export interface CreateMinimaxMusicClientOptions {
  apiKey: string
  /** e.g. `"https://api.minimax.io"` (global) or `"https://api.minimaxi.com"` (cn). */
  baseUrl?: string
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch
}

interface MusicApiResponseBody {
  base_resp?: { status_code: number; status_msg: string }
  data?: { audio?: string }
}

/**
 * Mirrors `mmx-cli@1.0.19`'s own `mapApiError()` (`src/errors/api.ts`,
 * compiled into `dist/sdk.mjs`) closely enough that `classifyError` treats
 * errors from this raw-HTTP path identically to errors thrown by the real
 * SDK. Only the exit-code mapping is ported — the CLI-specific remediation
 * hints (`mmx auth status`, upgrade URLs, ...) are not this package's
 * concern.
 */
function buildMusicApiError(status: number, body: MusicApiResponseBody): Error {
  const apiMsg = body.base_resp?.status_msg ?? `HTTP ${status}`
  const apiCode = body.base_resp?.status_code
  let exitCode: number = MMX_EXIT_CODE.GENERAL
  if (status === 401 || status === 403) {
    exitCode = MMX_EXIT_CODE.AUTH
  } else if (status === 429) {
    exitCode = MMX_EXIT_CODE.QUOTA
  } else if (status === 408 || status === 504) {
    exitCode = MMX_EXIT_CODE.TIMEOUT
  } else if (apiCode === 1002 || apiCode === 1039) {
    exitCode = MMX_EXIT_CODE.CONTENT_FILTER
  } else if (apiCode === 1028 || apiCode === 1030 || apiCode === 2061) {
    exitCode = MMX_EXIT_CODE.QUOTA
  }
  const error = new Error(`MiniMax music_generation API error: ${apiMsg} (HTTP ${status})`)
  return Object.assign(error, { exitCode })
}

/**
 * Creates a `MinimaxMusicClient` backed by a direct HTTP call to MiniMax's
 * `music_generation` endpoint (see this module's top comment for why this
 * doesn't go through `mmx-cli/sdk`).
 */
export function createMinimaxMusicClient(
  opts: CreateMinimaxMusicClientOptions,
): MinimaxMusicClient {
  const baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL
  const fetchImpl = opts.fetchImpl ?? fetch
  return {
    async generate(request) {
      const res = await fetchImpl(`${baseUrl}${MUSIC_ENDPOINT_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          output_format: 'hex',
          ...request,
        }),
      })
      // 🔴 Never log this response wholesale — an unrecognised field here
      // could carry credentials or other sensitive data (see this
      // package's PR description / repo `CLAUDE.md` incident notes on
      // printing unknown response shapes). Only named fields are read.
      const body = (await res.json()) as MusicApiResponseBody
      if (!res.ok || (body.base_resp && body.base_resp.status_code !== 0)) {
        throw buildMusicApiError(res.status, body)
      }
      return body as { data: { audio?: string } }
    },
  }
}

export interface GenerateMusicParams {
  prompt: string
  /** Mapped onto the wire request's `genre` field — the closest MiniMax
   * exposes for a free-text "style" input. `| undefined` for
   * `exactOptionalPropertyTypes: true` compatibility with callers passing
   * an optional field straight through. */
  style?: string | undefined
}

/**
 * Generates one music track via MiniMax's `music_generation` endpoint and
 * returns its raw bytes.
 *
 * 🔴 `is_instrumental: true` is always forced, unconditionally — this is
 * not a passthrough default. MiniMax's `music_generation` API requires
 * `lyrics` unless `is_instrumental` (or `lyrics_optimizer`) is set, and
 * this package has no `lyrics` parameter to offer — background music has
 * no lyrics. **Do not remove this without adding a `lyrics` parameter
 * first**; the music mutation test in `music.test.ts` exists specifically
 * to catch this being dropped by accident.
 *
 * ⚠️ There is no `duration` parameter to forward — MiniMax's
 * `music_generation` API does not expose one; the model produces a track of
 * its own default length.
 *
 * Requests `output_format: "hex"` explicitly (rather than relying on a
 * server-side default) for the same reason every other function in this
 * package avoids MiniMax's own URLs: `data.audio` comes back as a hex
 * string that decodes straight to bytes, so this module never has to fetch
 * (or hand back) a URL with any expiry at all.
 */
export async function generateMusic(
  client: MinimaxMusicClient,
  params: GenerateMusicParams,
): Promise<GeneratedAsset> {
  const response = await client.generate({
    prompt: params.prompt,
    ...(params.style ? { genre: params.style } : {}),
    is_instrumental: true,
  })
  const hex = response.data.audio
  if (!hex) {
    throw new Error('MiniMax music_generation returned no audio data.')
  }
  return {
    buffer: Buffer.from(hex, 'hex'),
    contentType: 'audio/mpeg',
  }
}
