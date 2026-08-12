import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../config'
import { registerTrigger } from '../debug/harness'
import type { GameState } from '../debug/state-jump'

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
 *
 * This scene is also this template's `window.__gameHarness` reference
 * consumer (`../debug/harness.ts`), in two ways:
 *   - `registerTrigger('score'/'gameover', ...)` in `create()` below wires
 *     up what `fire()` can dispatch. Both handlers only ever spawn a coin or
 *     obstacle at the player's position — the *existing* overlap handlers
 *     (`handleCoinCollected`/`handleObstacleHit`) are what actually change
 *     score or transition scenes, exactly like a real player walking into
 *     one would trigger. See `../debug/harness-types.ts`'s `GameHarness` doc
 *     for why a trigger may never write state directly.
 *   - `applyHarnessState()` is the hook `../debug/harness.ts`'s
 *     `applyState()` calls after this scene has (re)started, to push a
 *     validated `jump()` snapshot's score/position onto the fresh instance.
 *     It is not part of this class's public surface in any special way —
 *     it's just a method `applyState()` looks up by name — but it must only
 *     ever be called with an already-`isValidStart()`-checked snapshot.
 */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private bullets!: Phaser.Physics.Arcade.Group
  private coins!: Phaser.Physics.Arcade.Group
  private obstacles!: Phaser.Physics.Arcade.Group
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
    // No addCapture() for R — unlike Space/arrows, a bare "r" keypress has
    // no competing browser default to fight (see class doc rule 2).
    keyboard.on('keydown-R', () => this.scene.restart())

    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'player')
    this.player.setCollideWorldBounds(true)
    // Named so `../debug/harness.ts`'s `getSnapshot()` can report it as an
    // `EntitySnapshot` — this is the only entity `controllable` needs to see
    // an x/y change on across a `press()`.
    this.player.name = 'player'

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 30,
    })
    this.coins = this.physics.add.group()
    this.obstacles = this.physics.add.group()

    this.physics.add.overlap(this.player, this.coins, (_player, coin) => {
      this.handleCoinCollected(coin as Phaser.Physics.Arcade.Sprite)
    })
    this.physics.add.overlap(this.player, this.obstacles, () => {
      this.handleObstacleHit()
    })

    // What `fire('score')` / `fire('gameover')` dispatch (design D3): each
    // handler only places an object in the world. Re-registered on every
    // `create()` so a scene restart (via R, or `applyState('Game')`) never
    // leaves a trigger bound to a destroyed instance — see the registry doc
    // in `../debug/harness.ts`.
    registerTrigger('score', () => this.spawnCoinAtPlayer())
    registerTrigger('gameover', () => this.spawnObstacleAtPlayer())

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // 🔴 Bug found by ia-assertion-runner's `restart` assertion, not by
    // inspection: `this.score` is a class field, and `scene.restart()` (the
    // real player's R-key path — see `keyboard.on('keydown-R', ...)` below)
    // re-runs `create()` on the SAME instance rather than constructing a new
    // GameScene. Without this reset, a player who scores then restarts kept
    // their old `this.score` forever — the line below's own comment already
    // said the intent was "fresh/restarted scene reports 0", but nothing
    // upstream of it ever made that true. Reset explicitly, here, before
    // anything reads `this.score`.
    this.score = 0
    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      color: '#e5e7eb',
    })
    // Registry is the harness's read path for `score` (`readScore()` in
    // ../debug/harness.ts) — set it here too, not just inside
    // `addScore()`, so a fresh/restarted scene reports 0 immediately
    // instead of whatever the previous life left behind.
    this.registry.set('score', this.score)

    // 🔴 `highScore` deliberately does NOT get the same treatment as
    // `score` above — `has()` guards this so it is set ONCE, on this game
    // instance's very first `create()`, and never again. Every later
    // `create()` (a real restart via R, or `applyState()`) intentionally
    // skips this line, which is exactly what "跨状态不重置" (`value_persists`)
    // means: `score` resets every life, `highScore` must not.
    if (!this.registry.has('highScore')) {
      this.registry.set('highScore', 0)
    }

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'Arrow keys to move · Space to shoot · R to restart', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#9ca3af',
      })
      .setOrigin(0.5)
  }

  /**
   * Applies a validated `jump()` snapshot (design D2) — called by
   * `../debug/harness.ts`'s `applyState()` only, and only after
   * `isValidStart()` has already accepted the snapshot. This scene's
   * `create()` has already run by the time this fires, so this only needs
   * to override whatever `create()` set to whatever the snapshot says.
   */
  applyHarnessState(state: GameState): void {
    this.addScoreAbsolute(state.score)
    this.player.setPosition(state.playerX, state.playerY)
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

    this.addScore(1)
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

  /** Shared by shooting and coin collection — the only two things that change score. */
  private addScore(delta: number): void {
    this.addScoreAbsolute(this.score + delta)
  }

  /**
   * Sets score to an exact value rather than adding a delta — used by
   * `addScore()` above and by `applyHarnessState()`, which needs to land on
   * a snapshot's exact value, not add to whatever the scene already had.
   */
  private addScoreAbsolute(value: number): void {
    this.score = value
    this.registry.set('score', this.score)
    this.scoreText.setText(`Score: ${this.score}`)

    // `highScore` — the one value in this reference implementation that
    // MUST survive both a scene restart and applyState() (unlike `score`,
    // which both of those explicitly reset to 0). See `create()`'s
    // "set only if absent" registry init below for the other half of that
    // contract, and `../debug/harness.ts`'s `readValues()` for where it's
    // exposed to the `value_persists` assertion template. Read via
    // `.get(...) ?? 0` (not `.has()`) here specifically because this method
    // runs from inside `create()` on the very first life, before the
    // "set only if absent" init below has necessarily run yet on some
    // engine startup orderings — `?? 0` is a safe floor either way.
    const currentHighScore = (this.registry.get('highScore') as number | undefined) ?? 0
    if (this.score > currentHighScore) {
      this.registry.set('highScore', this.score)
    }
  }

  /**
   * `registerTrigger('score', ...)` target. Spawns a coin exactly where the
   * player is standing so the very next physics step's overlap check finds
   * it — this is "the player walked over a coin", not "give the player a
   * coin". `handleCoinCollected` (the overlap callback) is what actually
   * touches score; this method never does.
   */
  private spawnCoinAtPlayer(): void {
    const coin = this.coins.create(this.player.x, this.player.y, 'coin') as Phaser.Physics.Arcade.Sprite
    coin.setActive(true).setVisible(true)
  }

  /** `registerTrigger('gameover', ...)` target — same shape as spawnCoinAtPlayer(), for the failure path. */
  private spawnObstacleAtPlayer(): void {
    const obstacle = this.obstacles.create(this.player.x, this.player.y, 'obstacle') as Phaser.Physics.Arcade.Sprite
    obstacle.setActive(true).setVisible(true)
  }

  private handleCoinCollected(coin: Phaser.Physics.Arcade.Sprite): void {
    coin.destroy()
    this.addScore(1)
  }

  private handleObstacleHit(): void {
    // GameScene stops here; GameOverScene (role 'gameover') is what
    // `game_over_trigger` actually judges — see its class doc.
    this.scene.start('GameOver', { score: this.score })
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
