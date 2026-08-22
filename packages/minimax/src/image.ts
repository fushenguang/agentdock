import type { MinimaxClient } from './client.js'
import type { GeneratedAsset } from './types.js'

export interface GenerateImageParams {
  prompt: string
  /** `"<width>x<height>"`, e.g. `"1024x1024"`. MiniMax itself enforces the
   * 512-2048 / multiple-of-8 range constraints inside `ImageSDK.generate()`
   * — a violation surfaces as a thrown error, which callers treat like any
   * other generation failure. Validate the wire-facing shape (e.g. with a
   * regex) before calling this function if you need a friendlier error. */
  size?: string | undefined
  /** Candidate count. Omitted (or `1`) returns a one-element array. */
  n?: number | undefined
}

function parseSize(size: string | undefined): { width?: number; height?: number } {
  if (!size) return {}
  const match = /^(\d+)x(\d+)$/.exec(size)
  if (!match) {
    throw new Error(`Invalid size "${size}"; expected "<width>x<height>", e.g. "1024x1024".`)
  }
  return { width: Number(match[1]), height: Number(match[2]) }
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * Derives an image's content type from its magic bytes.
 *
 * MiniMax's `ImageRequest` has no output-format parameter — there is no way
 * to ask for "PNG" vs "JPEG" — so the only trustworthy source for "what did
 * we actually get" is the bytes themselves. Falls back to `image/jpeg` for
 * unrecognised signatures (observed MiniMax behavior, not a documented
 * guarantee) and logs when that fallback is hit so an unexpected format
 * shows up instead of silently mislabeling the bytes.
 */
export function sniffImageContentType(buffer: Buffer): string {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return 'image/png'
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  console.error(
    `[minimax] unrecognised image signature (first 8 bytes: ${buffer
      .subarray(0, 8)
      .toString('hex')}), falling back to image/jpeg`,
  )
  return 'image/jpeg'
}

/**
 * Generates one or more images via `ImageSDK.generate()` and returns their
 * raw bytes — one entry per candidate MiniMax generated (governed by
 * `params.n`; omitting it still returns a one-element array).
 *
 * Always requests `response_format: "base64"`, deliberately: this package
 * never fetches (or hands back) MiniMax's own CDN URL for images. The
 * base64 payload decodes straight to the bytes callers should persist
 * themselves before MiniMax's 24h URL — which is never even requested —
 * would have expired anyway.
 */
export async function generateImage(
  client: MinimaxClient,
  params: GenerateImageParams,
): Promise<GeneratedAsset[]> {
  const dimensions = parseSize(params.size)
  const response = await client.image.generate({
    prompt: params.prompt,
    ...dimensions,
    ...(params.n !== undefined ? { n: params.n } : {}),
    response_format: 'base64',
  })
  const base64List = response.data.image_base64
  if (!base64List || base64List.length === 0) {
    throw new Error('MiniMax image_generation returned no image_base64 data.')
  }
  return base64List.map((base64) => {
    const buffer = Buffer.from(base64, 'base64')
    return { buffer, contentType: sniffImageContentType(buffer) }
  })
}
