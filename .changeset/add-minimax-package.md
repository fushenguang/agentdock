---
"@cogito.ai/minimax": minor
---

Add `@cogito.ai/minimax`, a typed and testable MiniMax media-generation client (image, music, video) with byte-only outputs (never a MiniMax URL), a duck-typed `classifyError`, and quota helpers (`isQuotaExhausted`, `msUntilReset`).

`mmx-cli` is pinned to an exact version (`1.0.22`, no `^`) — its `music` sub-SDK was silently removed between `1.0.19` and `1.0.21` in a patch release, so `music` generation goes through a direct HTTP call to MiniMax's still-live `music_generation` endpoint instead of the SDK. Video generation (`generateVideoScarce`) is explicitly named for its scarcity: MiniMax caps it at 3 requests/day and excludes it from the Token Plan, so this function never retries automatically.
