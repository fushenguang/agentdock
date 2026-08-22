import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../config'

/**
 * Preload — load every asset the game needs before GameScene starts.
 *
 * This template ships with zero binary assets so `pnpm dev` works
 * immediately after `pnpm install` with nothing to fetch or generate. The
 * two textures below are drawn procedurally with Phaser's Graphics API and
 * baked into the texture manager with `generateTexture`.
 *
 * When you add real art/audio, load it the normal Phaser way in
 * `preload()`:
 *
 *   this.load.image('player', 'assets/player.png')
 *   this.load.audio('shoot', 'assets/shoot.mp3')
 *
 * ...and put the files under `public/assets/` (Vite serves `public/` as-is
 * at the site root). The progress bar below already listens for the
 * standard Phaser loader events, so it will animate correctly once real
 * files are queued — no changes needed there.
 */
export class PreloadScene extends Phaser.Scene {
  private progressBox!: Phaser.GameObjects.Graphics
  private progressBar!: Phaser.GameObjects.Graphics

  constructor() {
    super('Preload')
  }

  preload(): void {
    this.drawLoadingUi()

    this.load.on('progress', (value: number) => {
      this.progressBar.clear()
      this.progressBar.fillStyle(0x60a5fa, 1)
      this.progressBar.fillRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 10, 320 * value, 20)
    })

    // In-game documentation panel content (see ../doc-panel.ts,
    // ../game-doc.ts, ../scenes/UiScene.ts's mountDocEntry()). Loaded here,
    // not fetched ad hoc from UiScene, so it's ready synchronously by the
    // time GameScene/UiScene's create() runs — no async flash of the entry
    // button appearing then disappearing.
    //
    // 🔴 A missing `public/game-doc.json` is an EXPECTED, non-fatal case
    // (see game-doc.ts's header doc: default-hidden is the whole point),
    // not an error to guard against here. Phaser's JSONFile loader treats
    // a failed load as a per-file loaderror — it does not throw, and it
    // does not stop 'complete' from firing for the rest of the queue; the
    // failed key is simply absent from `this.cache.json`, which is exactly
    // what `UiScene.mountDocEntry()` checks for. This also does not fail
    // scripts/verify.mjs's BH-1 gate: a 404 response completes the network
    // request (CDP reports `Network.loadingFinished`), it does not fire
    // `Network.loadingFailed` — BH-1 only fails on genuine network-level
    // failures, not HTTP error statuses.
    this.load.json('gameDoc', 'game-doc.json')

    // Nothing else to load yet in this starter — replace with real
    // this.load.* calls once you have assets. Leaving the rest of the
    // loader empty is fine; it fires 'complete' as soon as the queue above
    // settles.
  }

  create(): void {
    this.progressBox.destroy()
    this.progressBar.destroy()
    this.generatePlaceholderTextures()
    this.scene.start('Game')
  }

  private drawLoadingUi(): void {
    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x222639, 1)
    this.progressBox.fillRect(GAME_WIDTH / 2 - 170, GAME_HEIGHT / 2 - 20, 340, 40)

    this.progressBar = this.add.graphics()

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'Loading...', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#e5e7eb',
      })
      .setOrigin(0.5)
  }

  /** Draw simple shapes into the texture manager so GameScene has sprites to use. */
  private generatePlaceholderTextures(): void {
    const player = this.add.graphics()
    player.fillStyle(0x60a5fa, 1)
    player.fillRoundedRect(0, 0, 48, 48, 8)
    player.generateTexture('player', 48, 48)
    player.destroy()

    const bullet = this.add.graphics()
    bullet.fillStyle(0xfacc15, 1)
    bullet.fillCircle(6, 6, 6)
    bullet.generateTexture('bullet', 12, 12)
    bullet.destroy()

    // coin/obstacle: what GameScene's 'score'/'gameover' triggers spawn
    // (see registerTrigger calls in GameScene.create()) — the assertion
    // runner's `fire()` needs *something* in the world to overlap with the
    // player, since triggers may only place objects and let physics react
    // naturally (ia-assertion-runner design D3), never write score/state
    // directly.
    const coin = this.add.graphics()
    coin.fillStyle(0x34d399, 1)
    coin.fillCircle(8, 8, 8)
    coin.generateTexture('coin', 16, 16)
    coin.destroy()

    const obstacle = this.add.graphics()
    obstacle.fillStyle(0xef4444, 1)
    obstacle.fillRect(0, 0, 32, 32)
    obstacle.generateTexture('obstacle', 32, 32)
    obstacle.destroy()
  }
}
