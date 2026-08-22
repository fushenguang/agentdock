// asset-usage.mjs — asset-usage-gate design. Turns the `assets` field of one
// or more `HarnessSnapshot`s (see `src/debug/harness-types.ts`'s
// `AssetUsageSnapshot` doc) into the tri-state verdict `scripts/verify.mjs`'s
// AU gate records, mirroring the absent/unavailable/judged discipline
// `scripts/assert.mjs`'s IA layer and `scripts/lib/exit-decision.mjs` already
// established for this template.
//
// 🔴 Real incident this exists to close: a generated project's `game-assets.json`
// declared backgrounds/characters, the manifest parsed fine, `PreloadScene`
// queued the files, BH-0/BH-1/BH-2 and IA all passed — but the level scenes
// never actually drew any of it (`add.image` hit-count 0 across every
// level, `sound` hit-count 0). Nothing in the existing gate set is sensitive
// to "declared but never consumed" — this file is what makes it a machine
// judgment instead of something only a human playtester notices.
//
// Kept as a pure, zero-I/O function — same reason as exit-decision.mjs — so
// `tests/asset-usage.test.mjs` can exercise every branch without a browser.
//
// 🔴 Three states, never collapsed into one another (this template's own
// first rule: a check that can be silently skipped is not a check):
//
//   - absent      — no manifest declared anything usable, for the entire
//                    run (every sampled snapshot's `assets` was `null`).
//                    NOT a failure: most generated projects never opt into
//                    game-assets.json, and must not turn red for a
//                    capability they never used.
//   - unavailable — the caller could not produce ANY assets evidence to
//                    judge at all (every sampled snapshot came from a
//                    harness build that doesn't even have an `assets`
//                    field). Someone changed the manifest/harness contract
//                    and this runner can't tell absent from broken — per
//                    this template's own doctrine ("读不懂就判 unavailable，
//                    绝不默认通过") that counts as a failure, the same as
//                    IA's `unavailable`.
//   - judged      — a real declared/loaded/used comparison ran. `passed` is
//                    the only field that means anything here, and it is
//                    `false` in exactly two situations, kept distinguishable
//                    via `reason` (never collapsed into one generic message):
//                      1. declared > 0, loaded === 0 — nothing the manifest
//                         named ever reached the texture/audio cache.
//                      2. loaded > 0, usedInScene === 0 — the files loaded
//                         fine, but nothing on screen (or in the sound
//                         manager) is currently referencing any of them.

/**
 * @param {readonly (import('../../src/debug/harness-types.ts').AssetUsageSnapshot | null | undefined)[]} assetSnapshots
 *   Every `HarnessSnapshot.assets` this run sampled, in whatever order they
 *   were taken (`scripts/verify.mjs` passes one per `applyState()` probe it
 *   already takes for the entity-bounds gate — see that file's AU section).
 *   `null` means "this particular snapshot's harness reported no manifest"
 *   (expected to be the same for every snapshot in a run, since the
 *   manifest doesn't change mid-run — never mixed on purpose, but this
 *   function does not assume that). `undefined` means "this snapshot did
 *   not even have an `assets` field" — a harness build that predates this
 *   gate, or a caller that failed to read it.
 * @returns {
 *   | { status: 'absent', reason: string }
 *   | { status: 'unavailable', reason: string }
 *   | { status: 'judged', passed: boolean, reason: string, declared: string[], loaded: string[], usedInScene: string[] }
 * }
 */
export function judgeAssetUsage(assetSnapshots) {
  const entries = assetSnapshots ?? []

  const withField = entries.filter((s) => s !== undefined)
  if (withField.length === 0) {
    return {
      status: 'unavailable',
      reason:
        'no getSnapshot() call in this run included an "assets" field at all — this build\'s harness predates the asset-usage gate, or every snapshot attempt was skipped before reaching it',
    }
  }

  const withManifest = withField.filter((s) => s !== null)
  if (withManifest.length === 0) {
    return { status: 'absent', reason: 'no game-assets.json manifest declared any usable asset for this run' }
  }

  // The manifest is static for the whole run — every non-null snapshot
  // should report the same declared/loaded sets. Unioning across every
  // sample (rather than just reading the first) is what lets `usedInScene`
  // combine evidence taken at genuinely different moments (e.g. the title
  // screen right after load, then the gameplay scene after applyState()) —
  // see AssetUsageSnapshot's own doc for why a single snapshot cannot see
  // everything a project draws across its whole state machine.
  const declaredKinds = new Map()
  const loaded = new Set()
  const usedInScene = new Set()
  for (const snap of withManifest) {
    for (const d of snap.declared) declaredKinds.set(d.key, d.kind)
    for (const key of snap.loaded) loaded.add(key)
    for (const key of snap.usedInScene) usedInScene.add(key)
  }
  const declared = [...declaredKinds.keys()]

  if (loaded.size === 0) {
    return {
      status: 'judged',
      passed: false,
      reason: `manifest declared ${declared.length} asset(s) (${declared.join(', ')}) but none of them made it into the texture/audio cache — check the manifest's "path" values against what actually exists under public/assets/`,
      declared,
      loaded: [],
      usedInScene: [],
    }
  }

  if (usedInScene.size === 0) {
    return {
      status: 'judged',
      passed: false,
      reason: `${loaded.size}/${declared.length} declared asset(s) loaded (${[...loaded].join(', ')}) but none of them are referenced by any GameObject in an active scene or the sound manager right now — the files load, but nothing draws or plays them`,
      declared,
      loaded: [...loaded],
      usedInScene: [],
    }
  }

  return {
    status: 'judged',
    passed: true,
    reason: `${loaded.size}/${declared.length} declared asset(s) loaded, ${usedInScene.size} in active use (${[...usedInScene].join(', ')})`,
    declared,
    loaded: [...loaded],
    usedInScene: [...usedInScene],
  }
}
