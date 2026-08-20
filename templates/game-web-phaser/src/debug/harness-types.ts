// 🔴 Zero imports, on purpose — same reason as `../dimensions.ts` and
// `./state-jump.ts`. `tests/harness-types.test.mjs` imports this file with
// bare Node (no DOM, no WebGL, no bundler); `./harness.ts` — which DOES pull
// in Phaser and every scene class — imports these types too. If this file
// ever grows an import, that chain drags Phaser into the Node test process
// and this contract quietly loses the one property (bare-Node importability)
// it exists to guarantee. See `dimensions.ts` for the fuller writeup of the
// "same fact stored twice, drifts later" failure mode this pattern avoids —
// the reasoning here is identical, just for a different contract.
//
// This file also has no runtime exports at all — every export below is a
// type/interface, fully erased by Node's TypeScript type-stripping. That is
// expected, not a bug: `tests/harness-types.test.mjs` only asserts that the
// *import itself* succeeds, because that's the only thing a zero-runtime
// contract module can meaningfully be tested for.

/**
 * The role a state plays, independent of its engine-level scene key.
 *
 * 🔴 This is what assertion templates actually check against. The upstream
 * template copy is written as "回到 PLAYING" / "进入 GAMEOVER" — i.e. roles,
 * not ids. This reference implementation happens to name its gameplay scene
 * `Game`, but a template hardcoded against that literal id would break the
 * moment a generated project renamed the scene. Judge the role, never the
 * engine id.
 */
export type StateRole = 'gameplay' | 'gameover' | 'other'

/** One entry of `GameHarness.listStates()` — an engine state id paired with its role. */
export interface StateDescriptor {
  readonly id: string
  readonly role: StateRole
}

/** A named, positionable thing in the world — what `controllable` diffs across a `press()`. */
export interface EntitySnapshot {
  readonly name: string
  readonly x: number
  readonly y: number
}

/**
 * Where a `WorldBoundsSnapshot` came from (trigger-integrity-and-onscreen-
 * gate design D4). `verify.mjs`'s BH-2 boundary judge is REQUIRED to record
 * this in `.verify-result.json` alongside any out-of-bounds entities — the
 * `canvas` fallback has a real false-positive risk on a horizontally-
 * scrolling game (the world is legitimately wider than the canvas), and
 * that risk must stay visible, never silent.
 */
export type WorldBoundsSource = 'physics.world.bounds' | 'canvas'

/**
 * A read-only world-bounds rectangle (trigger-integrity-and-onscreen-gate
 * design D4). Prefers the live Arcade Physics world's bounds; falls back to
 * the game's canvas/design-resolution size when no physics world is active
 * on the current scene (e.g. Boot/Preload). Read-only — this describes the
 * world, it never changes it (see `GameHarness`'s no-setter rule below).
 */
export interface WorldBoundsSnapshot {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly source: WorldBoundsSource
}

/**
 * A read-only snapshot of the live game at one instant (design D1).
 *
 * 🔴 `score: number | null` — `null` means "this game has no scoring
 * concept", `0` means "it has one and it's currently zero right now".
 * Collapsing those into a single value would make `restart`'s "score resets
 * to zero" judgement trivially true for a game that was never scoring
 * anything in the first place.
 */
export interface HarnessSnapshot {
  readonly stateId: string
  readonly score: number | null
  readonly entities: readonly EntitySnapshot[]
  readonly hudTexts: readonly string[]
  readonly values: Readonly<Record<string, number>>
  /** trigger-integrity-and-onscreen-gate task 2.1 — read-only, no matching setter anywhere in `GameHarness`. */
  readonly worldBounds: WorldBoundsSnapshot
}

/**
 * The game-side introspection and driver contract, installed by
 * `./harness.ts` at `window.__gameHarness` (design D1/D3).
 *
 * 🔴 Every method here is either a pure read (`getSnapshot`/`list*`) or
 * constrained to something a real player could already do: `press()`
 * dispatches an actual keyboard event, `fire()` may only do what a trigger's
 * own implementation is allowed to do (spawn something and let physics
 * react — never write state directly, design D3), and `applyState()` can
 * only land on states `isValidStart()` accepts.
 *
 * 🔴 **`fire()` now enforces the "never write state directly" half of that
 * itself** (trigger-integrity-and-onscreen-gate design D1/D2), not just by
 * review: it reads the coordinates of the entity named `player` synchronously
 * immediately before and after calling the trigger's handler and rejects the
 * returned promise if they differ at all. A handler that teleports the
 * player to its target instead of spawning something for the player to
 * collide with is therefore a thrown error, not a passing check — see
 * `./harness.ts`'s `fire()` doc. This makes `player` a naming *contract* for
 * any project that wants this check to mean anything, not just this
 * reference implementation's habit — see `GameScene.ts`'s `this.player.name
 * = 'player'` and `AGENTS.md` rule 6.
 *
 * **Do not add a setter here** (`setScore`, `setState`, anything that writes
 * a value directly). See design D3's allow/forbid table — the whole reason
 * a public harness in the shipped build is an acceptable trade is that its
 * API shape cannot cheat, not that it's hidden. A new write-shaped method
 * needs a design update and explicit sign-off first, never a quiet addition.
 */
export interface GameHarness {
  readonly version: 1
  getSnapshot(): HarnessSnapshot
  listStates(): readonly StateDescriptor[]
  listTriggers(): readonly string[]
  press(key: string, opts?: { durationMs?: number }): Promise<void>
  fire(trigger: string): Promise<void>
  applyState(id: string, seed?: number): Promise<boolean>
}
