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
 * direct reference to `GameScene`, and re-read every frame in `update()`
 * rather than via a `registry.events` listener: the registry's event
 * emitter is global, not scene-scoped, so a listener added in `create()`
 * would outlive this scene's own stop/relaunch cycle (every restart) and
 * leak a handler pointing at a destroyed Text object. Polling in `update()`
 * has no such lifetime mismatch — it simply stops running when the scene
 * stops.
 *
 * `src/debug/harness.ts`'s `collectHudTexts()` reads Text objects from both
 * the active gameplay scene and this scene (when running) so
 * `hud_text_present`/`score_feedback` keep judging the real, on-screen HUD
 * after it moved here — see that file's doc for the harness-side half of
 * this change.
 */
export class UiScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text
  private lastRenderedScore = -1

  constructor() {
    super('UI')
  }

  create(): void {
    this.lastRenderedScore = (this.registry.get('score') as number | undefined) ?? 0

    this.scoreText = this.add
      .text(16, PLAYFIELD_HEIGHT + 8, `Score: ${this.lastRenderedScore}`, {
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
  }

  update(): void {
    const score = (this.registry.get('score') as number | undefined) ?? 0
    if (score === this.lastRenderedScore) return
    this.lastRenderedScore = score
    this.scoreText.setText(`Score: ${score}`)
  }
}
