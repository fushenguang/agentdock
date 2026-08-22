import Phaser from 'phaser'
import { GAME_WIDTH, PLAYFIELD_HEIGHT } from '../config'
import { registerTrigger } from '../debug/harness'
import type { GameState } from '../debug/state-jump'
import { backgroundTextureKey, PLAYER_CHARACTER_KEY } from '../game-assets'

const PLAYER_SPEED = 260
const BULLET_SPEED = 420

/**
 * This template ships exactly one gameplay scene ('Game') — level 1 in the
 * `public/assets/bg/level<N>.png` numbering contract (see `../game-assets.ts`).
 * A project that adds more levels/scenes gives each its own number here.
 */
const LEVEL_NUMBER = 1

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
 * HUD content (score, instructions) does NOT live here — it's drawn by
 * `./UiScene.ts`, launched in parallel below and stopped on shutdown. This
 * scene's own geometry (player spawn, world bounds) stays within
 * `PLAYFIELD_HEIGHT`, never the full `GAME_HEIGHT` — see
 * `../dimensions.ts`'s HUD band / playfield contract for why.
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
  private score = 0

  constructor() {
    super('Game')
  }

  create(): void {
    // 🔴 Real bug found by ia-assertion-runner's own gates while adding
    // StartScene, not by inspection: `StartScene`'s "开始游戏" button calls
    // `this.scene.start('Game')` through ITS OWN ScenePlugin instance,
    // which (per Phaser's `ScenePlugin.start()`) queues a stop on the
    // *calling* scene (`Start`) as well as a start on the target — so in
    // real play, Start correctly stops itself. But `../debug/harness.ts`'s
    // `applyState()` jumps straight to a state via the game-level
    // `game.scene.start(id)` (`SceneManager.start()`), which — per its own
    // doc — only manages the *target* scene's lifecycle and never touches
    // any other running scene. Landing on `Game` that way (exactly what
    // `pnpm verify`'s IA gate does to test `controllable`/`restart`/etc.)
    // left `Start` active forever from the initial page load, and
    // `activeGameplayScene()`'s scene-list scan picked `Start` (earlier in
    // `config.ts`'s scene array) over `Game` — `getSnapshot()` reported
    // `stateId: 'Start'` with zero entities while `Game` was genuinely
    // running underneath it. Stopping `Start` here, unconditionally and
    // idempotently (`SceneManager.stop()` is a documented no-op on an
    // already-stopped scene), makes "Game has truly begun" true regardless
    // of which of the two `start()` call sites got you here — the same
    // ownership pattern this scene already applies to `UiScene` below.
    this.scene.stop('Start')

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

    this.drawLevelBackground()

    // `PLAYER_CHARACTER_KEY` ('player') resolves to whichever texture
    // `PreloadScene` actually registered under that key — an AI-generated
    // character from `public/game-assets.json`, if the manifest listed one
    // keyed exactly `"player"` and it loaded successfully, otherwise the
    // procedural placeholder shape (see `PreloadScene.generatePlaceholderTextures()`'s
    // guard). This scene never branches on which one it got — that's the
    // whole point of both landing on the same key.
    this.player = this.physics.add.sprite(GAME_WIDTH / 2, PLAYFIELD_HEIGHT - 80, PLAYER_CHARACTER_KEY)
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

    // Confined to PLAYFIELD_HEIGHT, not GAME_HEIGHT — the bottom
    // HUD_BAND_HEIGHT strip belongs to UiScene, not this world (see class
    // doc / dimensions.ts).
    this.physics.world.setBounds(0, 0, GAME_WIDTH, PLAYFIELD_HEIGHT)

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
    // Registry is the harness's read path for `score` (`readScore()` in
    // ../debug/harness.ts) — set it here too, not just inside
    // `addScore()`, so a fresh/restarted scene reports 0 immediately
    // instead of whatever the previous life left behind. It's also how
    // `./UiScene.ts`'s HUD score text learns the current value (design:
    // read the shared registry, not a direct scene reference).
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

    // HUD (score text + instructions + doc-panel entry) lives in UiScene,
    // launched in parallel with this scene — see the class doc and
    // dimensions.ts's HUD band / playfield contract. `launch()` is a no-op
    // if UI is already running (e.g. mid-life state churn), and always
    // starts it fresh here because the SHUTDOWN listener below stops it
    // first on every restart/scene-change.
    //
    // `levelKey: this.scene.key` — UiScene's doc-panel entry (see its
    // `mountDocEntry()`) needs to know which level/scene it's the HUD for,
    // to look up `game-doc.json`'s per-level content
    // (`../game-doc.ts`'s `resolveLevelDoc()`). Passed explicitly here
    // rather than UiScene guessing from the scene list, so this stays
    // correct if a future generated game has more than one gameplay scene.
    this.scene.launch('UI', { levelKey: this.scene.key })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('UI')
    })
  }

  /**
   * Draws this level's AI-generated background, if `PreloadScene` loaded
   * one for `LEVEL_NUMBER` (`public/assets/bg/level<N>.png` via
   * `game-assets.json` — see `../game-assets.ts`). No manifest re-parsing
   * here, same discipline as the player texture above: this only ever asks
   * the texture manager, never the manifest itself.
   *
   * Sized to `PLAYFIELD_HEIGHT`, not `GAME_HEIGHT` — the bottom
   * `HUD_BAND_HEIGHT` strip belongs to `UiScene`, not this world (see class
   * doc / `../dimensions.ts`'s HUD band / playfield contract). Added first
   * and pinned to `setDepth(-1)` so it always renders behind the
   * player/bullets/coins/obstacles regardless of future add-order changes
   * in this method. Deliberately un-named (`.name` left unset): background
   * art is not an `EntitySnapshot` the harness should ever report or
   * bounds-check (`../debug/harness.ts`'s `collectEntities()` only
   * collects named objects).
   *
   * No manifest / no matching texture ⇒ this is a no-op — the existing
   * plain `gameConfig.backgroundColor` fill and placeholder shapes already
   * are this game's "shape placeholder" for a level background, so there
   * is nothing else to draw as a fallback.
   */
  private drawLevelBackground(): void {
    const key = backgroundTextureKey(LEVEL_NUMBER)
    if (!this.textures.exists(key)) return

    this.add.image(GAME_WIDTH / 2, PLAYFIELD_HEIGHT / 2, key).setDisplaySize(GAME_WIDTH, PLAYFIELD_HEIGHT).setDepth(-1)
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
    // UiScene's HUD score text updates itself via a `changedata-score`
    // registry listener (see UiScene.ts's create()) — this scene never
    // touches that Text object directly, it only ever writes the registry.
    this.registry.set('score', this.score)

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
