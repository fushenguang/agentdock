import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../config'

const PLAYER_SPEED = 260
const BULLET_SPEED = 420

/**
 * Game — the actual playable scene.
 *
 * This is the reference pattern for keyboard input in this template. It
 * exists to structurally prevent a real bug hit before this template
 * existed: pressing Space made the whole game go blank and the page lock
 * up, while a sound effect kept playing.
 *
 * The most likely mechanism for that bug: a hand-rolled `window` /
 * `document` keydown listener that (a) was never tied to the scene
 * lifecycle, so it kept firing after a scene restart/resize referenced
 * stale objects and threw inside the browser's animation-frame loop —
 * which silently kills `requestAnimationFrame`-driven rendering (blank
 * screen) — while the independent Web Audio graph (unrelated to the
 * render loop) kept playing whatever had already been scheduled; and (b)
 * never called `preventDefault()`, so the browser's own "Space scrolls the
 * page" default action fired on top of it.
 *
 * Two rules follow directly from that, both applied below:
 *   1. Bind input through Phaser's own Keyboard plugin
 *      (`this.input.keyboard`), never raw `window.addEventListener`. Keys
 *      created this way are owned by the scene and torn down with it.
 *   2. Call `addCapture()` for every key your game uses that the browser
 *      also binds to something (Space = scroll, arrows = scroll). This is
 *      the structural fix — not a per-key `event.preventDefault()` you
 *      have to remember to write for every handler.
 */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private bullets!: Phaser.Physics.Arcade.Group
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private spaceKey!: Phaser.Input.Keyboard.Key
  private scoreText!: Phaser.GameObjects.Text
  private score = 0

  constructor() {
    super('Game')
  }

  create(): void {
    const keyboard = this.input.keyboard
    if (!keyboard) {
      // Keyboard plugin is disabled or unavailable (non-browser context).
      // Fail loudly here instead of leaving the scene half-wired.
      throw new Error('Keyboard input plugin is unavailable in this Scene.')
    }

    // Structural fix for "Space scrolls/locks the page" — see class doc above.
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
    ])

    this.cursors = keyboard.createCursorKeys()
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'player')
    this.player.setCollideWorldBounds(true)

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 30,
    })

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      color: '#e5e7eb',
    })

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'Arrow keys to move · Space to shoot', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#9ca3af',
      })
      .setOrigin(0.5)
  }

  update(): void {
    this.handleMovement()
    this.handleShooting()
    this.cleanUpBullets()
  }

  private handleMovement(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)

    if (this.cursors.left?.isDown) {
      body.setVelocityX(-PLAYER_SPEED)
    } else if (this.cursors.right?.isDown) {
      body.setVelocityX(PLAYER_SPEED)
    }

    if (this.cursors.up?.isDown) {
      body.setVelocityY(-PLAYER_SPEED)
    } else if (this.cursors.down?.isDown) {
      body.setVelocityY(PLAYER_SPEED)
    }
  }

  private handleShooting(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.spaceKey)) return

    const bullet = this.bullets.get(this.player.x, this.player.y - 30) as
      | Phaser.Physics.Arcade.Sprite
      | undefined
    if (!bullet) return // pool exhausted — fine, just skip this shot

    bullet.setActive(true).setVisible(true)
    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.enable = true
    body.setVelocity(0, -BULLET_SPEED)

    this.score += 1
    this.scoreText.setText(`Score: ${this.score}`)
    this.playBeep()
  }

  private cleanUpBullets(): void {
    for (const child of this.bullets.getChildren()) {
      const bullet = child as Phaser.Physics.Arcade.Sprite
      if (bullet.active && bullet.y < -20) {
        this.bullets.killAndHide(bullet)
        const body = bullet.body as Phaser.Physics.Arcade.Body
        body.enable = false
      }
    }
  }

  /**
   * Tiny synthesized beep via the Web Audio graph Phaser already owns.
   * Deliberately defensive: audio must never be able to throw and take
   * down the render loop (see the class-level bug writeup above).
   */
  private playBeep(): void {
    const soundManager = this.sound
    if (!(soundManager instanceof Phaser.Sound.WebAudioSoundManager)) return

    try {
      const ctx = soundManager.context
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.08)
    } catch {
      // Audio is a nice-to-have. Never let it break gameplay.
    }
  }
}
