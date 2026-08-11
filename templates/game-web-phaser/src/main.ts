import Phaser from 'phaser'
import { gameConfig } from './config'

void new Phaser.Game(gameConfig)

// The debug panel is a build-target-gated feature, not a runtime switch —
// see src/debug/panel.ts and vite.config.ts's `build.outDir` branch (design
// D6). `import.meta.env.MODE` is a compile-time constant Vite substitutes
// per `--mode` flag (see package.json's build:play/build:learn scripts), so
// in a `build:play` bundle this whole branch — including the dynamic
// import — is dead code a player has no way to turn on from the browser.
if (import.meta.env.MODE === 'learn') {
  void import('./debug/panel').then(({ mountDebugPanel }) => mountDebugPanel())
}
