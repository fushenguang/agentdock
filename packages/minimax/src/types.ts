/**
 * Shared value types for this package's public API. Kept separate from
 * `client.ts` so consumers can import just the shapes they need without
 * pulling in the `mmx-cli` client wiring.
 */

/**
 * The only thing every generation function in this package ever returns.
 *
 * MiniMax's own media URLs (image/music: 24h, video: as little as 1h) are
 * never handed back to a caller — every function in this package downloads
 * or decodes the bytes itself and returns them here. Persisting the bytes
 * anywhere durable (e.g. object storage) is the caller's responsibility.
 */
export interface GeneratedAsset {
  buffer: Buffer;
  contentType: string;
}
