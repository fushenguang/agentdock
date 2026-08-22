import { describe, expect, expectTypeOf, it } from 'vitest'
import type { MiniMaxSDK } from 'mmx-cli/sdk'

import { createMinimaxClient } from './client.js'
import type { MinimaxClient } from './client.js'

describe('createMinimaxClient', () => {
  it('constructs a real MiniMaxSDK instance (structural smoke test, no network call)', () => {
    // The constructor itself does no I/O — it only builds a config object.
    const client = createMinimaxClient({ apiKey: 'sk-test' })
    expect(client).toBeInstanceOf(Object)
    expect(typeof client.image.generate).toBe('function')
    expect(typeof client.video.generate).toBe('function')
    expect(typeof client.video.getTask).toBe('function')
    expect(typeof client.file.retrieve).toBe('function')
    expect(typeof client.quota.info).toBe('function')
  })
})

/**
 * 🔴 Type-level sentinel test — see `client.ts`'s `MinimaxClient` doc
 * comment for the full rationale. This proves the mechanism actually
 * works, not just that it exists: an object shaped like the real
 * `MiniMaxSDK` but missing `image` must fail to satisfy `MinimaxClient`.
 *
 * These are compile-time-only assertions. They have no effect under a
 * plain `vitest run` (esbuild strips types before any of this executes) —
 * the thing that actually enforces them is `pnpm check-types`
 * (`tsc --noEmit`), which type-checks `src/**\/*` including this file. See
 * this package's `tsconfig.json` (no test-file exclusion) vs.
 * `tsconfig.build.json` (excludes `*.test.ts` from the published output).
 *
 * ⚠️ Asymmetric coverage, deliberately: `music` has no equivalent
 * "removing it breaks the type" test. `mmx-cli@1.0.22` — the exact version
 * this package depends on — has *already* removed `music` from the SDK,
 * so there is no `music` field left on `MiniMaxSDK` to omit and no
 * `MinimaxClient.music` to sentinel. `music.ts`'s `MinimaxMusicClient` has
 * no upstream SDK counterpart at all; see `music.ts`'s top comment.
 */
describe('MinimaxClient upgrade sentinel (type-level, enforced by tsc --noEmit)', () => {
  it('documents the type-only assertions below (this body only runs at runtime)', () => {
    expect(true).toBe(true)
  })
})

type RealMiniMaxSdkInstance = InstanceType<typeof MiniMaxSDK>

// Positive control: today's real SDK instance satisfies our narrow
// interface. If this line goes red, `MinimaxClient` has drifted from the
// SDK it's supposed to be narrowing — fix the interface, not this test.
expectTypeOf<RealMiniMaxSdkInstance>().toMatchTypeOf<MinimaxClient>()

// Negative control: an SDK instance with `image` removed must NOT satisfy
// `MinimaxClient`. This is the actual sentinel — it proves that dropping a
// capability really does break the type, the way `music` was dropped for
// real between mmx-cli 1.0.19 and 1.0.21.
type SdkWithoutImage = Omit<RealMiniMaxSdkInstance, 'image'>
expectTypeOf<SdkWithoutImage>().not.toMatchTypeOf<MinimaxClient>()
