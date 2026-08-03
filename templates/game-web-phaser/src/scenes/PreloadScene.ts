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

    // Nothing to load yet in this starter — replace with real this.load.*
    // calls once you have assets. Leaving the loader empty is fine; it
    // fires 'complete' immediately.
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
  }
}
