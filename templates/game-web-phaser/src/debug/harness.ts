import Phaser from 'phaser'
import type { EntitySnapshot, GameHarness, HarnessSnapshot, StateDescriptor, StateRole } from './harness-types'
import { jump, isValidStart, listStates as listStateIds, type StateId, type GameState } from './state-jump'

/**
 * `window.__gameHarness` reference implementation (design D1/D2/D3).
 *
 * 🔴 Installed **unconditionally** by `src/main.ts` — in both `build:play`
 * and `build:learn`. This is a deliberate, recorded trade (design D3): the
 * IA runner must judge the exact artifact that ships, and letting the two
 * build targets diverge on this would let a real bug hide in whichever one
 * the runner doesn't happen to be looking at. The thing that keeps this
 * acceptable is the **shape** of the API below, not secrecy — see the
 * allow/forbid table on `GameHarness` in `./harness-types.ts`. Do not gate
 * this file's install behind `import.meta.env.MODE`.
 *
 * This module (unlike `harness-types.ts` and `state-jump.ts`) is browser
 * only: it imports Phaser and reaches into live scene instances. Nothing
 * here needs to run under bare Node, and nothing here may be imported by
 * anything that does.
 */

declare global {
  interface Window {
    __gameHarness?: GameHarness
  }
}

/**
 * Roles for this template's four reference states (design D1's `role`
 * field). Kept here, not in `state-jump.ts`, because role is a harness-level
 * judging concept — `state-jump.ts`'s own job is legality/reproducibility,
 * not how an assertion template should read a state.
 */
const STATE_ROLES: Readonly<Record<StateId, StateRole>> = {
  Boot: 'other',
  Preload: 'other',
  Game: 'gameplay',
  GameOver: 'gameover',
}

/**
 * Scenes that want `applyState()` to do more than just switch to them
 * implement this hook. It is intentionally NOT part of the public
 * `GameHarness` interface — `applyState()` is the only public door, and it
 * only ever calls this with a snapshot that has already passed
 * `isValidStart()`. A scene's `applyHarnessState` is therefore never a free
 * setter: it can only be reached via a validated snapshot, which is exactly
 * the constraint design D3 requires.
 */
interface HarnessAwareScene {
  applyHarnessState?(state: GameState): void
}

type TriggerHandler = () => void

/**
 * Registered by scenes (see `scenes/GameScene.ts`'s `create()`) for
 * `fire()` to dispatch by name. Re-registering under an existing name
 * replaces the handler — this is what keeps triggers correct across a scene
 * restart: `applyState('Game')` restarts GameScene, GameScene's `create()`
 * runs again and re-registers 'score'/'gameover' bound to the *new*
 * instance, so a stale handler pointing at destroyed sprites is never left
 * behind as long as callers follow design D6 ("每条断言前强制 applyState").
 */
const triggers = new Map<string, TriggerHandler>()

export function registerTrigger(name: string, handler: TriggerHandler): void {
  triggers.set(name, handler)
}

function isKnownStateId(id: string): id is StateId {
  return (listStateIds() as readonly string[]).includes(id)
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** How long `press()` holds a key down before releasing it, unless the caller overrides it. */
const DEFAULT_PRESS_DURATION_MS = 100

/**
 * How long `fire()` waits after invoking a trigger's handler before
 * resolving. Triggers only *place something in the world* (design D3) — the
 * actual effect (score bumping, HUD text changing, scene transitioning)
 * happens through Arcade Physics' overlap check on a later physics step,
 * not synchronously inside the handler. Without this wait, a caller taking
 * its "after" snapshot immediately on `fire()` resolving would race the
 * physics step and see stale state.
 */
const TRIGGER_SETTLE_MS = 50

interface KeySpec {
  readonly code: string
  readonly key: string
  readonly keyCode: number
}

/**
 * `press(key, ...)` takes DOM `KeyboardEvent.code` values — the same
 * vocabulary a real browser keyboard event uses — not Phaser's own
 * `KeyCodes` names. This table is the (small, explicit) translation between
 * the two, covering every key this reference game's scenes actually bind.
 * Extend it when a scene adds a new key; there is no reflection trick that
 * would keep this in sync automatically without also making `press()`
 * accept keys no scene has ever wired up.
 */
const KEY_TABLE: Readonly<Record<string, KeySpec>> = {
  ArrowLeft: { code: 'ArrowLeft', key: 'ArrowLeft', keyCode: Phaser.Input.Keyboard.KeyCodes.LEFT },
  ArrowRight: { code: 'ArrowRight', key: 'ArrowRight', keyCode: Phaser.Input.Keyboard.KeyCodes.RIGHT },
  ArrowUp: { code: 'ArrowUp', key: 'ArrowUp', keyCode: Phaser.Input.Keyboard.KeyCodes.UP },
  ArrowDown: { code: 'ArrowDown', key: 'ArrowDown', keyCode: Phaser.Input.Keyboard.KeyCodes.DOWN },
  Space: { code: 'Space', key: ' ', keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE },
  KeyR: { code: 'KeyR', key: 'r', keyCode: Phaser.Input.Keyboard.KeyCodes.R },
}

/**
 * Dispatches a real `KeyboardEvent` on `window` — the same target
 * `Phaser.Input.Keyboard.KeyboardManager` listens on by default (see
 * `node_modules/phaser/src/input/keyboard/KeyboardManager.js`, which reads
 * `event.keyCode` to match against registered `Key`s). This is genuinely
 * "a real player could have done this", not a simulation that reaches
 * around Phaser's own input plugin — `press()` never touches a `Key`
 * object or scene state directly.
 */
function dispatchKeyboardEvent(type: 'keydown' | 'keyup', spec: KeySpec): void {
  window.dispatchEvent(
    new KeyboardEvent(type, {
      code: spec.code,
      key: spec.key,
      keyCode: spec.keyCode,
      bubbles: true,
      cancelable: true,
    }),
  )
}

function activeGameplayScene(game: Phaser.Game): Phaser.Scene | undefined {
  // Exactly one of this template's scenes is ever active at a time (Boot ->
  // Preload -> Game -> GameOver, each stopping the last via `scene.start`).
  // `getScenes(true)` returns active scenes in scene-list order; taking the
  // first is correct for this template and would need revisiting only if a
  // future project starts running scenes in parallel (e.g. a paused overlay
  // on top of gameplay).
  return game.scene.getScenes(true)[0]
}

function collectEntities(scene: Phaser.Scene | undefined): EntitySnapshot[] {
  if (!scene) return []
  const entities: EntitySnapshot[] = []
  for (const child of scene.children.list) {
    const named = child as Phaser.GameObjects.GameObject & { name: string; x?: unknown; y?: unknown }
    if (!named.name) continue // unnamed objects (bullets, coins, obstacles) are deliberately not entities
    if (typeof named.x !== 'number' || typeof named.y !== 'number') continue
    entities.push({ name: named.name, x: named.x, y: named.y })
  }
  return entities
}

function collectHudTexts(scene: Phaser.Scene | undefined): string[] {
  if (!scene) return []
  const texts: string[] = []
  for (const child of scene.children.list) {
    // 🔴 This is the only path to Phaser's on-canvas text — see the
    // proposal's fact ②: canvas-rendered text is invisible to any DOM
    // query, so `hud_text_present` has no other way to judge it.
    if (child instanceof Phaser.GameObjects.Text) {
      texts.push(child.text)
    }
  }
  return texts
}

function readScore(game: Phaser.Game): number | null {
  // `null` vs `0` is load-bearing (see harness-types.ts's HarnessSnapshot
  // doc) — `has()` is what lets a game with no scoring concept report
  // `null` instead of a synthetic zero that would make `restart` trivially
  // pass.
  return game.registry.has('score') ? (game.registry.get('score') as number) : null
}

function readValues(game: Phaser.Game): Readonly<Record<string, number>> {
  // `highScore` (GameScene.ts's `addScoreAbsolute`) is this reference
  // implementation's one value that survives both a scene restart and
  // `applyState()` — unlike `score`, which both of those explicitly zero.
  // That's what makes it the thing `value_persists` can actually judge
  // (design D5's row for this template: "两次相等；values 里没有这个键 ->
  // unmet-precondition"). Read via `has()`, not a `?? 0` fallback: before
  // GameScene's `create()` has run even once (e.g. the harness is queried
  // while still on Boot/Preload), there IS no highScore yet, and reporting
  // a synthesized 0 here would be exactly the "collapse missing into a
  // value" mistake `readScore()`'s own `has()` check already avoids for
  // `score`.
  //
  // This is still a pure read — nothing here writes to the registry, that
  // only happens in GameScene.ts. Adding a value here does not add a setter
  // to GameHarness (design D3's allow/forbid table is about the harness's
  // public methods, not about how many keys `values` happens to have).
  return game.registry.has('highScore') ? { highScore: game.registry.get('highScore') as number } : {}
}

function buildSnapshot(game: Phaser.Game): HarnessSnapshot {
  const scene = activeGameplayScene(game)
  return {
    stateId: scene?.scene.key ?? '',
    score: readScore(game),
    entities: collectEntities(scene),
    hudTexts: collectHudTexts(scene),
    values: readValues(game),
  }
}

function listStates(): readonly StateDescriptor[] {
  return listStateIds().map((id) => ({ id, role: STATE_ROLES[id] }))
}

function listTriggers(): readonly string[] {
  return [...triggers.keys()]
}

async function press(key: string, opts?: { durationMs?: number }): Promise<void> {
  const spec = KEY_TABLE[key]
  if (!spec) {
    throw new Error(`harness.press: unknown key "${key}" (not in KEY_TABLE)`)
  }
  const duration = opts?.durationMs ?? DEFAULT_PRESS_DURATION_MS
  dispatchKeyboardEvent('keydown', spec)
  await waitMs(duration)
  dispatchKeyboardEvent('keyup', spec)
}

async function fire(trigger: string): Promise<void> {
  const handler = triggers.get(trigger)
  if (!handler) {
    throw new Error(`harness.fire: unknown trigger "${trigger}" (not in listTriggers())`)
  }
  handler()
  await waitMs(TRIGGER_SETTLE_MS)
}

/**
 * The `jump()` -> `isValidStart()` -> live-instance driver (design D2).
 *
 * 🔴 Self-check comes before the switch, never after. A half-legal snapshot
 * MUST return `false` without touching the running game — see design D2's
 * "假 bug 比没测试更糟" (a false bug is worse than no test): if this applied
 * an illegal state first and validated after, an assertion runner could
 * observe a broken-looking game that was never reachable by real play.
 */
async function applyState(game: Phaser.Game, id: string, seed?: number): Promise<boolean> {
  if (!isKnownStateId(id)) return false

  const snapshot = jump(id, seed)
  if (!isValidStart(id, snapshot)) return false

  const targetScene = game.scene.getScene(id)
  if (!targetScene) return false // scene key not registered in this build — nothing to switch to

  await new Promise<void>((resolve) => {
    // Attach the listener before calling `start()`: `Scenes.Events.CREATE`
    // fires from inside Phaser's own update loop (after the scene's
    // `create()` runs), never synchronously from `start()` itself, so
    // ordering here can't race — but attaching first keeps that invariant
    // from ever mattering.
    targetScene.events.once(Phaser.Scenes.Events.CREATE, () => resolve())
    // `SceneManager.start()`: if `id` is already running/paused/sleeping it
    // is shut down and started fresh, which is exactly "reset to a legal
    // starting point" — the same code path handles "jump to a different
    // state" and "reset the current one".
    game.scene.start(id)
  })

  const harnessAware = targetScene as unknown as HarnessAwareScene
  harnessAware.applyHarnessState?.(snapshot)

  return true
}

export function installHarness(game: Phaser.Game): void {
  if (window.__gameHarness) return // idempotent — never overwrite an existing install

  window.__gameHarness = {
    version: 1,
    getSnapshot: () => buildSnapshot(game),
    listStates,
    listTriggers,
    press,
    fire,
    applyState: (id, seed) => applyState(game, id, seed),
  }
}
