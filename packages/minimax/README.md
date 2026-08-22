# @cogito.ai/minimax

A typed, testable wrapper around MiniMax's media-generation capabilities
(image, music, video), built on top of `mmx-cli`'s undocumented SDK export
(`mmx-cli/sdk`).

## Why this exists

`mmx-cli` (`github.com/MiniMax-AI/cli`) is the only MiniMax SDK on npm, but:

- It has no README and no doc comments on its public surface.
- Its capability set is **not stable across patch releases** — `music` was
  removed from the SDK between `1.0.19` and `1.0.21` without a major
  version bump, even though MiniMax's `music_generation` HTTP endpoint is
  still live.
- Its media-generation methods hand back MiniMax's own CDN URLs, which
  expire quickly (image/music: 24h; video: as little as 1h).

This package wraps `mmx-cli/sdk` behind a narrow, hand-declared interface
(`MinimaxClient`) instead of trusting the SDK's own types as a contract, so
that a future capability removal fails loudly at `tsc` time instead of
silently at runtime — see `src/client.ts`'s doc comment and
`src/client.test.ts`'s type-level sentinel test. Every generation function
downloads or decodes bytes itself and returns a `Buffer`; none of them ever
hand a MiniMax URL back to the caller.

`mmx-cli` is pinned to an **exact** version (no `^`) for the reason above.

## API

- `createMinimaxClient(opts)` — wraps `new MiniMaxSDK(...)` for image,
  video, file, and quota calls.
- `generateImage(client, params)` — always requests `response_format:
  "base64"`; returns one `GeneratedAsset` per candidate, with content-type
  sniffed from the bytes' magic numbers (MiniMax's API has no output-format
  parameter).
- `createMinimaxMusicClient(opts)` / `generateMusic(client, params)` — music
  generation bypasses `mmx-cli/sdk` entirely (removed as of `1.0.21`) and
  calls MiniMax's `music_generation` endpoint directly. Always forces
  `is_instrumental: true` — this package has no `lyrics` parameter, and
  MiniMax's API requires one of `lyrics` / `is_instrumental` /
  `lyrics_optimizer`.
- `generateVideoScarce(client, params, options?)` — named for its scarcity:
  MiniMax caps video at **3 requests/day** and excludes it from the Token
  Plan. This function **never retries automatically** on any failure
  (generation, polling, or download). It polls `video.getTask` until the
  task leaves `Queueing`/`Processing`, then downloads the result to a
  `Buffer` immediately after resolving a short-lived `download_url`.
- `classifyError(err)` — duck-types `.exitCode` (mirroring `mmx-cli`'s own
  unexported `ExitCode` enum) into a stable category string. Works for
  errors from both the SDK-backed and the raw-HTTP-backed (`music`) paths.
- `getQuota(client)` / `isQuotaExhausted(quota, modelName)` /
  `msUntilReset(quota, modelName)` — quota helpers for deciding whether to
  wait out a rate limit instead of guessing.

## Configuration

This package never reads environment variables. Every function takes its
configuration (API key, base URL) as an explicit argument, injected by the
caller.
