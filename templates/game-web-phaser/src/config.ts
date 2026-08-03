import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { GameScene } from './scenes/GameScene'

/**
 * Design-resolution size. Phaser's Scale Manager (below) fits and centers
 * this virtual resolution into whatever space the browser gives it — write
 * all gameplay/layout code against these constants, never against
 * `window.innerWidth/innerHeight`.
 */
export const GAME_WIDTH = 960
export const GAME_HEIGHT = 540

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1d1f2b',

  // ─────────────────────────────────────────────────────────────────────
  // Scale Manager — DO NOT remove or change `mode`/`autoCenter` casually.
  //
  // This is the structural fix for a real bug hit before this template
  // existed: a hand-rolled vanilla-JS canvas had no scale manager, so the
  // canvas was positioned by ordinary document flow. On any viewport that
  // didn't exactly match the canvas's pixel size, the canvas — and
  // everything meant to sit below it — ended up offset or clipped out of
  // view.
  //
  // `Phaser.Scale.FIT`         — scale the canvas to fit the parent element
  //                               while preserving aspect ratio (never
  //                               distorts, never overflows).
  // `Phaser.Scale.CENTER_BOTH` — center the canvas both horizontally and
  //                               vertically inside its parent.
  //
  // The parent element (`#app` in index.html) must itself fill the
  // viewport for this to behave correctly — see the CSS reset in
  // index.html for the other half of this fix.
  // ─────────────────────────────────────────────────────────────────────
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'app',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },

  // Boot -> Preload -> Game. Keep scenes single-purpose and split like this
  // instead of doing loading + gameplay in one file — it's what makes the
  // loading screen and the actual game independently testable/replaceable.
  scene: [BootScene, PreloadScene, GameScene],
}
