import type { MinimaxClient } from './client.js'
import type { GeneratedAsset } from './types.js'

/**
 * 🔴 Video is unlike every other capability in this package, in two ways
 * that must stay visible at every call site — hence the scary function
 * name (`generateVideoScarce`, not `generateVideo`):
 *
 * 1. **`3 requests / day` is a hard platform cap, and video is *not*
 *    covered by the Token Plan** (Token Plan covers text + image + speech
 *    only — video, voice design, and fast clone are explicitly excluded).
 *    This function must never appear in an automatic retry loop, a batch
 *    job, or any path an agent can call freely without a human in the
 *    loop deciding "yes, spend one of the three."
 * 2. **Video URLs are the shortest-lived of anything MiniMax returns** —
 *    as little as 1 hour for the file-download URL this function uses
 *    internally (vs. 24h for image/music). So, same discipline as
 *    `image.ts`/`music.ts`: this function downloads the bytes itself and
 *    returns a `Buffer`. It never hands a MiniMax URL back to the caller.
 *    Persisting those bytes to durable storage is the caller's job.
 *
 * This function does **not** retry on failure. A failed generation, a
 * failed poll, or a failed download all reject immediately — retrying a
 * `3/day` capability automatically would burn the daily budget on
 * transient errors. See `video.test.ts`'s "no automatic retry" case.
 *
 * The model is pinned to the legacy (`v1`) video API (`MiniMax-Hailuo-2.3`
 * by default), not `MiniMax-H3`/`v2`. `client.ts`'s `getTask` return type
 * is typed loosely (`status: string`) precisely because the real SDK
 * returns different shapes for the two APIs — see the comment there.
 */

const DEFAULT_MODEL = 'MiniMax-Hailuo-2.3'
const DEFAULT_POLL_INTERVAL_MS = 10_000 // MiniMax's own docs recommend a 10s poll interval.
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000

const PENDING_STATUSES = new Set(['Queueing', 'Processing'])

export interface GenerateVideoParams {
  prompt: string
  /** Defaults to `"MiniMax-Hailuo-2.3"` — see this module's top comment for
   * why this package only exercises the legacy video API. */
  model?: string | undefined
}

export interface GenerateVideoOptions {
  /** How often to call `getTask` while the task is still queued/processing. */
  pollIntervalMs?: number
  /** Give up waiting (and reject) after this long. Does not cancel the
   * underlying MiniMax task — it may still complete server-side. */
  timeoutMs?: number
  /** Injectable for tests; defaults to the global `fetch`. Used only for
   * the final byte download, not for the SDK-backed generate/getTask calls. */
  fetchImpl?: typeof fetch
  /** Injectable for tests so polling doesn't require real timers. */
  sleep?: (ms: number) => Promise<void>
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generates one video via MiniMax's (legacy) video-generation API and
 * returns its raw bytes.
 *
 * Flow: `video.generate({ ..., async: true })` → `{ taskId }`, then poll
 * `video.getTask({ taskId, model })` until it leaves `Queueing`/
 * `Processing`, then — on `Success` — `file.retrieve(file_id)` to get a
 * (short-lived) `download_url`, which is fetched immediately and turned
 * into a `Buffer`. See this module's top comment: the URL itself never
 * leaves this function.
 */
export async function generateVideoScarce(
  client: MinimaxClient,
  params: GenerateVideoParams,
  options: GenerateVideoOptions = {},
): Promise<GeneratedAsset> {
  const model = params.model ?? DEFAULT_MODEL
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const fetchImpl = options.fetchImpl ?? fetch
  const sleep = options.sleep ?? defaultSleep

  const { taskId } = await client.video.generate({ model, prompt: params.prompt, async: true })

  const deadline = Date.now() + timeoutMs
  let task = await client.video.getTask({ taskId, model })
  while (PENDING_STATUSES.has(task.status)) {
    if (Date.now() >= deadline) {
      throw new Error(
        `MiniMax video_generation task ${taskId} did not finish within ${timeoutMs}ms (last status: ${task.status}).`,
      )
    }
    await sleep(pollIntervalMs)
    task = await client.video.getTask({ taskId, model })
  }

  if (task.status !== 'Success') {
    throw new Error(`MiniMax video_generation task ${taskId} failed (status: ${task.status}).`)
  }
  if (!task.file_id) {
    throw new Error(`MiniMax video_generation task ${taskId} succeeded but returned no file_id.`)
  }

  const fileInfo = await client.file.retrieve(task.file_id)
  const downloadUrl = fileInfo.file.download_url
  if (!downloadUrl) {
    throw new Error(
      `MiniMax file ${task.file_id} (video_generation task ${taskId}) has no download_url.`,
    )
  }

  // Fetched immediately, never returned to the caller — see top comment.
  const res = await fetchImpl(downloadUrl)
  if (!res.ok) {
    throw new Error(`Failed to download MiniMax video bytes (HTTP ${res.status}).`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return {
    buffer: Buffer.from(arrayBuffer),
    // MiniMax's video-generation outputs are MP4 (undocumented as an API
    // guarantee, same caveat as `image.ts`'s jpeg fallback, but there is no
    // magic-byte sniff for video in this package yet — MP4's signature
    // lives well past the first few bytes at a variable offset).
    contentType: 'video/mp4',
  }
}
