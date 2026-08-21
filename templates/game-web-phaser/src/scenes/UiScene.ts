import Phaser from 'phaser'
import { GAME_WIDTH, PLAYFIELD_HEIGHT } from '../config'

/**
 * UI — the HUD layer, launched in parallel with `GameScene` (`this.scene.launch('UI')`
 * from `GameScene.create()`) and stopped when `GameScene` shuts down.
 *
 * This scene exists to structurally prevent the bug `dimensions.ts`'s HUD
 * band / playfield contract documents: HUD content and world geometry
 * drawn in the same scene, with nothing to keep them apart, ended up
 * visually overlapping. Two rules make that impossible here instead of
 * relying on review to catch it:
 *
 *   1. Everything this scene draws lives inside the reserved HUD band
 *      (`y ∈ [PLAYFIELD_HEIGHT, GAME_HEIGHT]`) — never inside
 *      `[0, PLAYFIELD_HEIGHT]`, which is GameScene's world.
 *   2. Every HUD object calls `setScrollFactor(0)`. This scene has no
 *      camera scroll of its own today (GameScene's world fits entirely in
 *      view), but the moment either scene's camera starts following
 *      anything, an un-pinned HUD object would drift with the world — this
 *      is the same "pin it now, don't wait for the bug" reasoning as the
 *      Scale Manager config in `config.ts`.
 *
 * Score is read from the shared `Phaser.Data.DataManager` (`this.registry`
 * — the same instance every scene sees via `game.registry`) rather than a
 * direct reference to `GameScene`, and kept in sync **event-driven** — a
 * `registry.events.on('changedata-score', ...)` listener set up in
 * `create()` — not by polling the registry every frame in `update()`.
 * This is the pattern Phaser's own bundled `data-manager` skill
 * (`node_modules/phaser/skills/data-manager/SKILL.md`, "Global Registry for
 * Cross-Scene State") documents for exactly this HUD-reads-shared-state
 * shape, and it's cheaper: `setText()` only ever runs when `GameScene`
 * actually calls `registry.set('score', ...)`, not once per rendered frame
 * regardless of whether the score changed.
 *
 * The earlier version of this file polled instead, specifically to dodge a
 * hazard that same skill doc names outright under "Registry Listeners
 * Persist Across Scene Restarts": the registry lives on the `Game` object,
 * not the scene, so a listener attached in `create()` is NOT automatically
 * removed when this scene stops (every restart — R, or `applyState()` —
 * stops and relaunches this scene per `GameScene.ts`'s SHUTDOWN handler).
 * Left unremoved, each restart would add one more listener closing over
 * that life's now-destroyed `scoreText`, and Phaser calls all of them on
 * the next `registry.set('score', ...)`.
 *
 * That hazard has a documented fix, not just a reason to avoid the
 * pattern — the same skill section shows removing the listener on
 * `Phaser.Scenes.Events.SHUTDOWN`. `create()` below does exactly that: one
 * `registry.events.on(...)`, matched by one `registry.events.off(...)` in a
 * `SHUTDOWN` handler, so a listener never outlives the scene instance that
 * owns the Text object it updates.
 *
 * `src/debug/harness.ts`'s `collectHudTexts()` reads Text objects from both
 * the active gameplay scene and this scene (when running) so
 * `hud_text_present`/`score_feedback` keep judging the real, on-screen HUD
 * after it moved here — see that file's doc for the harness-side half of
 * this change.
 */
export class UiScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text

  constructor() {
    super('UI')
  }

  create(): void {
    const initialScore = (this.registry.get('score') as number | undefined) ?? 0

    this.scoreText = this.add
      .text(16, PLAYFIELD_HEIGHT + 8, `Score: ${initialScore}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#e5e7eb',
      })
      .setScrollFactor(0)

    this.add
      .text(GAME_WIDTH / 2, PLAYFIELD_HEIGHT + 40, 'Arrow keys to move · Space to shoot · R to restart', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#9ca3af',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)

    // See class doc: `this.registry.events` is the Game-level emitter, not
    // this scene's own — a listener added here survives this scene
    // instance's death unless explicitly removed, so the SHUTDOWN handler
    // below is not optional cleanup, it's what makes attaching this safe.
    const onScoreChanged = (_registryOwner: Phaser.Game, value: number): void => {
      this.scoreText.setText(`Score: ${value}`)
    }
    this.registry.events.on('changedata-score', onScoreChanged)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off('changedata-score', onScoreChanged)
    })
  }
}
