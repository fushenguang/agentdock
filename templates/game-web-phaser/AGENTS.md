# AgentDock Game-Web-Phaser Template — Agent Execution Boundaries

> For AI coding agents running autonomously in a VM, building on this project after it was scaffolded from AgentDock's `game-web-phaser` template.

This is a standalone Phaser 4 + Vite + TypeScript project — not part of a monorepo. There is no `core/features/infra` layering here; it's a single package. The rules below are the ones that matter for an agent working unattended in a VM.

## Hard rules — read before doing anything else

These five exist because each one caused a real incident during earlier unstructured agent runs. They are not style preferences.

### 1. Never run a long-lived server in the foreground

Any command that starts a dev/preview server (`pnpm dev`, `pnpm preview`, `vite`, `vite preview`, ...) **does not exit**. Running it as your foreground tool call blocks you until your tool call times out.

**Real incident:** an agent ran `npm start` directly and the process never returned control; the agent sat blocked for 15 minutes until the tool call itself timed out.

Always background it explicitly and detach it from your shell session, then verify separately:

```bash
setsid pnpm dev > /tmp/vite-dev.log 2>&1 < /dev/null &
disown

# give it a moment, then verify it's actually up
sleep 2
curl -sf http://localhost:8080/ > /dev/null && echo "server is up" || cat /tmp/vite-dev.log
```

`setsid` detaches the process from your shell's session so it survives your shell exiting; `disown` removes it from your shell's job table; redirecting stdin from `/dev/null` and stdout/stderr to a log file stops it from blocking on TTY I/O. Read `/tmp/vite-dev.log` to check on it — don't reattach to the process.

### 2. The server port is fixed at 8080 — do not change it

`vite.config.ts` pins both `server.port` and `preview.port` to `8080` with `strictPort: true`. The outer platform builds this project's share/preview link against that exact port. If you change it (or let something else occupy 8080 so Vite silently falls back to another port), the share link breaks with no visible error on your side.

If port 8080 is already in use when you start the server, that is a bug to fix (find and stop whatever's squatting on it), not a reason to move to a different port.

This project also has a second, non-public build target — `build:learn`, served on port 8090 (`preview:learn`) — that includes a debug panel `build:play` deliberately excludes. Which target you get is decided entirely by which npm script built it (`vite.config.ts`'s `build.outDir` branches on `--mode`), never by anything read at runtime in the browser. Don't add a client-side switch for the panel; see `src/debug/panel.ts`.

### 3. Commit after every completed step

This project's local git history is the only rollback mechanism available. There is no other undo. After each meaningful, working step (a scene added, a bug fixed, an asset wired in) — commit it:

```bash
git add -A
git commit -m "feat: <what you just did>"
```

Small, frequent commits over one giant commit at the end. If an edit breaks something, you want to be able to revert to the last good commit, not to the start of the session.

### 4. Chinese / non-Latin text: use `font-family`, don't ship font files

If the game needs Chinese (or other non-Latin) copy, set a system font stack in CSS — see `index.html` for the pattern already in place (`system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`). Do not download/embed a font file or add a `@font-face` that fetches one. It adds asset weight and a network dependency for something the OS already provides.

### 5. Self-verify against the real rendered page, not just property values — and test every key, not just one

**Real incident, part A:** an agent checked that `canvas.width` / `canvas.height` had sensible non-zero values and called the layout verified — but the canvas's _position on the page_ was wrong (this is exactly the bug the Scale Manager config in `src/config.ts` and the CSS reset in `index.html` now prevent structurally). A property value being "correct" tells you nothing about where the element actually landed visually.

**Real incident, part B:** the same investigation involved multiple keybindings; the agent tested `P` and never tested `Space` — and the Space-key bug was the one that mattered. Testing one path through a small set and calling it done left the real bug untouched.

So, before calling a UI or input change verified:

- Take an actual screenshot / rendered snapshot (headless browser, Playwright, whatever tool you have) and look at where things actually are — not just at attribute values in the DOM or console-logged numbers. **`pnpm verify` now automates the floor of this** (build succeeds, page loads with no uncaught exception/failed request, screenshot is provably non-empty, canvas has real size) — see the acceptance checklist below. It does not replace looking at the game, it replaces "I forgot to look at all."
- If the feature involves more than one key/input/branch, exercise **all** of them, not just the first one that comes to mind. Space and arrow keys specifically — this template captures them (rule in `src/scenes/GameScene.ts`), but if you add more keys, verify each one individually. `pnpm verify` does **not** simulate keyboard input — this part is still yours to do by hand.

### 6. If the game's acceptance criteria include machine-judgable ("machine") items, keep `window.__gameHarness` honest as you change scenes

The outer platform can attach a project-root `assertions.json` (see the sample one already in this project) — a list of the 7 upstream assertion templates (`loads_clean` / `controllable` / `restart` / `hud_text_present` / `value_persists` / `score_feedback` / `game_over_trigger`) with parameters. `pnpm verify` judges every one of them against the **built artifact**, right after the BH gates, using `src/debug/harness.ts`'s `window.__gameHarness` — the same contract `src/debug/state-jump.ts`'s `jump()`/`isValidStart()` already established for state legality. If you add a scene, a new key, a new triggerable event, or a new persisting stat, this harness has to keep describing the *real* game, or the templates that depend on it silently degrade to "can't judge this" (never a false pass — see below):

- **New `StateRole`**: every `id` returned by `listStates()` (`src/debug/state-jump.ts`) needs an entry in `harness.ts`'s `STATE_ROLES` map. `game_over_trigger`/`restart` judge by **role** (`'gameplay'`/`'gameover'`), never by the scene's engine key — that's what lets a template's judgement survive you renaming a scene.
- **New key**: add it to `harness.ts`'s `KEY_TABLE` (DOM `KeyboardEvent.code` → Phaser `KeyCodes`) or `controllable`/`restart` assertions referencing it will report "not recognized by press()" instead of judging your game.
- **New triggerable event** (a scoring condition, a failure condition, …): call `registerTrigger('name', handler)` from the scene's `create()` (see `GameScene.ts`'s two calls for the pattern) so `score_feedback`/`game_over_trigger` can `fire()` it. 🔴 **The handler may only do what a real player's own actions could cause** — spawn something in the world and let the existing overlap/collision logic react (`GameScene.ts`'s `spawnCoinAtPlayer`/`spawnObstacleAtPlayer`) — **never write score/state directly** (`this.score += n` inside a trigger handler is a violation, even though nothing mechanically stops it — see `src/debug/harness-types.ts`'s `GameHarness` doc for the allow/forbid table this is part of). **The platform judges this, not just human review**: `src/debug/harness.ts`'s `fire()` reads the coordinates of the entity named `player` synchronously immediately before and immediately after calling the trigger's handler (no `await` between the two reads — nothing can insert a physics step in between) and throws if they differ at all, however small the change. A handler that teleports the player to its target instead of spawning something for the player to collide with is therefore a build-breaking failure — `pnpm verify` exits non-zero, and the offending assertion is recorded with a hint naming the trigger and the before/after coordinates — not something a reviewer has to notice by reading the diff. **This makes `player` a naming *contract*, not a habit**: the reference player sprite keeps `this.player.name = 'player'` (`GameScene.ts`), and any project that wants this check to mean anything for its own player-controlled entity must name it `player` too. A project with no entity named `player` does not fail this check — but `pnpm verify`'s `.verify-result.json` will visibly record that the check did not run for it (see this rule's `absent`/`unavailable` distinction above: an inapplicable check is recorded, never silent).

  BH-2 also checks, independently of `assertions.json`, that every named entity in `getSnapshot().entities` stays within the game's world bounds (`physics.world.bounds` when set, else the canvas/design-resolution size) with a small margin — a named object that has fallen or drifted off-screen (e.g. `setImmovable(true)` without also `setAllowGravity(false)`, so gravity keeps pulling it down forever) fails BH-2 on its own, independent of whether any trigger touched it.
- **New persisting stat** (a second `highScore`-shaped value, lives, an inventory count, …): expose it from `harness.ts`'s `readValues()` the same way `highScore` already is, so `value_persists` has something to check. A value that only exists in a scene's local field and is never read back here will make that template report "can't judge this," not fail — see the next paragraph.
- **Do not add a setter to `GameHarness`** (`setScore`, `setState`, anything that writes a value directly). Every method on it is either a pure read or something a real player could already trigger (`press()` dispatches a real `KeyboardEvent`, `applyState()` only lands on states `isValidStart()` accepts). If a change genuinely needs a new write-shaped harness method, that is a contract change, not a scene change — stop and ask a human before adding one.

`pnpm verify`'s IA output distinguishes three things and will never blur them together: **judged & passed**, **judged & failed** (a real defect — the failure detail names the assertion and what it saw), and **can't judge** (`absent` — no `assertions.json` — or `unavailable` — the harness above doesn't cover what an assertion needs yet, or isn't installed at all). 🔴 `absent` and `unavailable` are **not** the same thing, and only one of them is benign:

- **`absent`** — nobody asked for IA. Nothing was skipped, nothing turns red, `pnpm verify` still exits 0.
- **`unavailable`** — someone *did* ask (there is an `assertions.json`) and the gate could not run: no harness in the artifact, a `schemaVersion` this runner doesn't understand, the runner threw. That is a gate being skipped, so it counts as a failure: `passed: false`, a red `IA` row in `gates[]`, and a non-zero exit — exactly like a BH gate failure. **If you see `unavailable`, implement rule 6's harness; do not read it as "nothing to do here".**
- **`judged` with at least one failing item** — a real defect. Same treatment: non-zero exit, `passed: false`.

### 7. HUD and world geometry never share space — draw them in different scenes

`src/dimensions.ts` reserves a bottom strip `HUD_BAND_HEIGHT` pixels tall; `PLAYFIELD_HEIGHT = GAME_HEIGHT - HUD_BAND_HEIGHT` is everything left for gameplay. World geometry (ground, platforms, spawn points, `physics.world.setBounds(...)`) must stay within `y ∈ [0, PLAYFIELD_HEIGHT]`. HUD content (score, buttons, status text) must stay within `y ∈ [PLAYFIELD_HEIGHT, GAME_HEIGHT]` and belongs in `src/scenes/UiScene.ts` — a scene launched in parallel with `GameScene` (`this.scene.launch('UI')`), not inside `GameScene` itself. Do not add HUD elements directly to a gameplay scene; add them to `UiScene.ts` and pin them with `setScrollFactor(0)`.

### 8. Platform-delivered assets: consult `game-assets.json`, never request a file it didn't confirm

The outer platform can drop AI-generated art/audio into `public/assets/` (`title.png`, `bg/level<N>.png`, `char/<slug>.png`, `bgm/main.mp3`) alongside a manifest at `public/game-assets.json` describing them (contract: `src/game-assets.ts`). That manifest may not exist yet — most of a project's life, it won't. Two rules:

- **Never hardcode a `this.load.image()`/`this.load.audio()` call for one of these paths without the manifest having confirmed it first.** `src/scenes/PreloadScene.ts`'s `queueManifestAssets()` — driven by the pure, unit-tested `planAssetLoads()` in `src/game-assets.ts` — is the only place that decides what to request, precisely so "missing manifest ⇒ request nothing" stays a checkable fact (`tests/game-assets.test.mjs`), not something a reviewer has to trust by reading Phaser plumbing. A missing manifest or a 404'd individual file must never throw or leave the game half-loaded — see `src/scenes/StartScene.ts`/`GameScene.ts`'s use of `this.textures.exists(...)` for the fallback pattern to copy.
- **Starting background music requires a real user gesture.** `this.sound.play()` called anywhere outside a click/keypress/tap handler is silently refused by the browser's autoplay policy — no exception, it just does nothing. This template's reference fix starts BGM from `StartScene`'s "开始游戏" button `pointerdown` handler and nowhere else; see `skills/game-flow-and-hud/SKILL.md`'s "Platform-Delivered Assets" section for the full reasoning.

## Project layout

```text
index.html            # entry HTML + the CSS reset that keeps the canvas positioned correctly
vite.config.ts         # dev/preview server config — port 8080 pinned (rule 2), build:play/build:learn outDir split
assertions.json        # sample machine-judgable acceptance items (rule 6) — one per upstream template
scripts/
├── verify.mjs          # pnpm verify — BH-0/BH-1/BH-2 gates + IA assertion judging, one CDP session
├── assert.mjs           # the IA judging engine verify.mjs calls; also runnable standalone (`node scripts/assert.mjs`)
└── lib/                 # shared CDP/browser/static-server/PNG/entity-bounds plumbing both scripts above use
tests/
├── state-jump.test.mjs  # traversal assertion for src/debug/state-jump.ts
├── harness-types.test.mjs # bare-Node import guard for src/debug/harness-types.ts
├── assert.test.mjs        # per-template judge tests (positive + negative) and design D6's order-independence test
├── exit-decision.test.mjs # design D8's exit-code rule
└── png.test.mjs           # non-empty-screenshot judgement, incl. the required solid-colour negative case
src/
├── main.ts            # creates the Phaser.Game instance — should rarely need edits
├── config.ts           # Phaser.Types.Core.GameConfig — Scale Manager lives here
├── game-assets.ts       # game-assets.json manifest contract (AI-generated title/bg/char/bgm) — see rule 8
├── debug/
│   ├── state-jump.ts    # listStates/jump/isValidStart contract + reference impl (Boot/Preload/Start/Game/GameOver)
│   ├── harness-types.ts # window.__gameHarness contract types — zero imports, see rule 6
│   ├── harness.ts        # window.__gameHarness reference implementation — see rule 6 before editing scenes
│   └── panel.ts          # learn-build-only debug panel; never gate this with a runtime switch
└── scenes/
    ├── BootScene.ts     # engine-level setup only, runs first
    ├── PreloadScene.ts  # load assets (incl. the game-assets.json manifest), generate placeholder textures, show progress
    ├── StartScene.ts     # title/start screen — the only way into Game; also where BGM playback starts (see rule 8)
    ├── GameScene.ts     # the actual playable scene + the input-capture reference pattern
    ├── UiScene.ts        # HUD layer, launched parallel to GameScene — see rule 7 (HUD band / playfield)
    └── GameOverScene.ts # the failure state (`role: 'gameover'`) + restart-to-gameplay
```

Keep this split. Don't collapse Boot/Preload/Game back into one file — it's what makes the loading screen, the asset pipeline, and gameplay independently replaceable and testable.

## May execute autonomously

- `pnpm install`, `pnpm build`, `pnpm check-types`, `pnpm test`, `pnpm verify`
- Starting/stopping the dev server **in the background** (rule 1)
- Adding scenes under `src/scenes/`, adding assets under `public/`
- Editing any file in `src/`
- `git add` / `git commit` (local only)

## Must pause and confirm with a human

- `git push` (any remote operation)
- Adding new dependencies to `package.json`
- Changing `vite.config.ts` port settings (rule 2)
- Deleting any file not created in the current session

## Prohibited

- Foregrounding a long-lived process (rule 1)
- Writing real secrets/API keys anywhere in the repo
- `rm -rf` on tracked directories
- Bypassing git hooks with `--no-verify`, if hooks are later added to this project

## Acceptance checklist before calling a task done

1. `pnpm check-types` — exits 0.
2. `pnpm verify` — exits 0. This is the executable replacement for "build it and take a screenshot": it builds `dist-play/` (BH-0), loads it in real headless Chromium over CDP and fails loudly if the page throws an uncaught exception or has a failed resource request (BH-1), and fails loudly if the rendered screenshot is provably empty (solid-colour PNG, not just "a PNG exists"), the game canvas has zero size, or any named entity (`getSnapshot().entities`) has drifted outside the game's world bounds (BH-2). Read `scripts/verify.mjs` for the exact judgement, and `pnpm test` for the unit tests behind it (`tests/`). If this project has an `assertions.json`, `pnpm verify` also judges every item in it against `window.__gameHarness` right after the BH gates (same CDP session, no second page load) and exits non-zero if any of them fail — see rule 6 above before touching scenes if this project uses machine-judgable acceptance items.
3. Dev server started **in the background** (rule 1), and reachable at `http://localhost:8080/`.
4. Every interactive key/control your change touches has been pressed and observed, not just one of them (rule 5) — `pnpm verify` does not simulate keyboard input, so this one is still a judgment call for you, not the machine.
5. Working state committed to git (rule 3).
