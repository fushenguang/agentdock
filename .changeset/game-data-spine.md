---
"@cogito.ai/cli": minor
---

game-web-phaser template: gameplay-content data layer (`public/game-data.json` + `src/game-data.ts` loader), data-spine restructure of the reference `GameScene` (content out of scene classes, interpreter stays), `getSnapshot().data` three-layer evidence (`declared`/`loaded`/`usedInScene`), and the 8th assertion template `data_from_files` in the runner (manifest-absent is a failure, never an unmet precondition). Template self-hosts 8/8 green on its own sample `assertions.json`. Sister change: cogito-lib `data-layer-gate` (platform-side default sets + dispatch 铁律), whose merge is sequenced on this release reaching the npm registry.
