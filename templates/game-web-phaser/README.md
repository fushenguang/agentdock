# {{PROJECT_NAME}}

> Generated from the [AgentDock](https://github.com/CogitoTech/agentdock) `game-web-phaser` template.

A minimal, structurally-correct Phaser 4 + Vite + TypeScript starter for browser games — built for AI coding agents working autonomously in a VM as much as for humans. See `AGENTS.md` for the execution rules that apply while working in this project, and `PROJECT_CONTEXT.md` for cross-session handoff notes.

## Tech Stack

| Layer    | Technology                                                                      |
| -------- | ------------------------------------------------------------------------------- |
| Engine   | [Phaser 4](https://phaser.io)                                                   |
| Bundler  | [Vite](https://vitejs.dev)                                                      |
| Language | [TypeScript](https://www.typescriptlang.org) (strict mode)                      |
| Runtime  | Node.js ≥ 22 (the zero-dep `pnpm verify` needs the built-in `WebSocket` global) |

## Directory Structure

```text
index.html           # entry HTML — includes the CSS reset that keeps the canvas positioned correctly
vite.config.ts        # dev/preview server config — fixed port 8080, see below; build:play/build:learn outDir split
assertions.json        # sample machine-judgable acceptance items — see "Verifying" below
scripts/
├── verify.mjs          # pnpm verify — zero-dep headless-Chromium/CDP checks + assertion judging, see "Verifying" below
├── assert.mjs           # the assertion-judging engine verify.mjs calls (also runnable standalone)
└── lib/                 # shared CDP/browser/static-server/PNG plumbing
tests/                 # unit tests for verify's judgement, the assertion judges, and the state-jump contract (pnpm test)
src/
├── main.ts           # boots the Phaser.Game instance, installs window.__gameHarness
├── config.ts          # Phaser.Types.Core.GameConfig — Scale Manager configured here
├── debug/
│   ├── state-jump.ts   # listStates/jump/isValidStart contract + a minimal reference implementation
│   ├── harness-types.ts # window.__gameHarness contract types (zero imports)
│   ├── harness.ts        # window.__gameHarness reference implementation
│   └── panel.ts          # debug panel — only ever included in the build:learn bundle
└── scenes/
    ├── BootScene.ts    # runs first, engine-level setup only
    ├── PreloadScene.ts # loads assets / generates placeholder textures, shows a loading bar
    ├── GameScene.ts    # the playable scene — also the reference pattern for keyboard input
    └── GameOverScene.ts # the failure state + restart-to-gameplay
```

## Getting Started

### 1. Prerequisites

- Node.js ≥ 22
- pnpm (or npm/yarn — this template has no workspace-only dependencies)

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:8080](http://localhost:8080). The port is fixed at `8080` (see `vite.config.ts`) — the platform hosting this project builds share/preview links against that exact port, so don't change it.

> Running as an autonomous agent? Start this in the **background**, never in the foreground — see rule 1 in `AGENTS.md`.

### 4. Build for production

```bash
pnpm build:play     # public share build → dist-play/, no debug panel
pnpm build:learn    # non-public build → dist-learn/, includes the debug panel
pnpm preview         # serves dist-play/ on port 8080
pnpm preview:learn   # serves dist-learn/ on port 8090
```

`pnpm build` (no target) is an alias for `pnpm build:play`. See [Two build targets](#two-build-targets) below for why there are two.

### 5. Type-check

```bash
pnpm check-types
```

### 6. Verify

```bash
pnpm verify
```

Builds `dist-play/`, loads it in real headless Chromium over CDP, and fails loudly (non-zero exit) if the build fails, the page throws an uncaught exception or has a failed resource request, or the rendered screenshot is provably empty or the canvas has zero size. If this project has an `assertions.json` at its root, `pnpm verify` also judges every item in it — same browser session, right after the render check — and fails loudly if any of them do. See [Verifying](#verifying) below and `scripts/verify.mjs`.

```bash
pnpm test
```

Runs the unit tests behind `verify` (the screenshot-emptiness judgement, the assertion judges, the exit-code rule) and the state-jump contract's traversal assertion (`tests/`), via Node's built-in test runner — no test framework dependency.

## What's already wired up

This template exists to structurally prevent bugs hit by earlier unstructured (vanilla JS + Canvas) agent-built games:

1. **Canvas positioned wrong / content below unreachable.** Fixed by Phaser's Scale Manager (`scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` in `src/config.ts`) combined with a CSS reset in `index.html` that pins the canvas's parent element to the full viewport. Both pieces are required — the Scale Manager only centers the canvas _inside its parent_; the CSS makes sure the parent itself is positioned correctly.

2. **Space key makes the screen go blank and the page lock up, while audio keeps playing.** Fixed by binding all game input through Phaser's own Keyboard plugin (`this.input.keyboard`, scene-scoped, torn down with the scene) instead of raw `window`/`document` listeners, and by calling `keyboard.addCapture([...])` for every key the browser also binds to something (Space/arrows scroll the page by default). See the class-level comment in `src/scenes/GameScene.ts` for the full writeup and the reference pattern to copy for any new input you add.

3. **"I ran the agent and it said done" being the only signal a change actually worked.** Fixed by `pnpm verify` (`scripts/verify.mjs`) — see [Verifying](#verifying) below.

4. **"The health-check gates pass" being conflated with "the acceptance criteria are met."** A build that loads and renders can still be uncontrollable, never show a score, or have no failure state — none of that shows up in a screenshot's pixel variance. `window.__gameHarness` (`src/debug/harness.ts`) plus `scripts/assert.mjs` close that gap for the 7 machine-judgable acceptance templates the outer platform can attach via `assertions.json` — see [Verifying](#verifying) below.

## Two build targets

| Target | Command                            | Output        | Port                        | Debug panel |
| ------ | ---------------------------------- | ------------- | --------------------------- | ----------- |
| Play   | `pnpm build:play` (= `pnpm build`) | `dist-play/`  | 8080 (`pnpm preview`)       | No          |
| Learn  | `pnpm build:learn`                 | `dist-learn/` | 8090 (`pnpm preview:learn`) | Yes         |

`dist-play/` is what a share link points at — the outer platform builds those links against the fixed, `strictPort`-enforced port 8080, and a student opening one should see the game, not a debug overlay. `dist-learn/` is for the person building the game.

Which target you get is decided by `--mode` on the `vite build` CLI (see `vite.config.ts`'s `build.outDir` branch and `src/main.ts`'s `import.meta.env.MODE` check) — **not** by a runtime switch anyone could flip in the browser. If you add more learn-only tooling, gate it the same way: import it from inside an `if (import.meta.env.MODE === 'learn')` branch so it's dead code, not just hidden, in `dist-play/`.

## Verifying

`pnpm verify` (`scripts/verify.mjs`) runs three gates, zero new dependencies — it spawns whatever Chromium already exists on the machine (Playwright's cache, `CHROME_PATH`, or `PATH`) and speaks CDP over Node's built-in `WebSocket` (Node ≥ 22):

- **BH-0 build** — `vite build --mode play` exits 0.
- **BH-1 load** — headless Chromium loads `dist-play/` with no uncaught JS exception and no failed resource request.
- **BH-2 render** — the screenshot is provably non-empty (unique-colour count + pixel variance both clear a floor — a solid-colour PNG does **not** pass) and the game canvas has non-zero size.

Every gate either passes or prints exactly what it expected vs. what it found and exits non-zero — it never prints "skipping" and exits 0. If it can't find a browser or the Node runtime lacks `WebSocket`, that's a failure, not a skip.

### Assertion judging (IA)

If a project-root `assertions.json` exists — a list of machine-judgable acceptance items, each naming one of 7 upstream templates and its parameters — `pnpm verify` judges every one of them right after BH-2, over the **same** browser session (no second page load), by driving the live game through `window.__gameHarness` (`src/debug/harness.ts`):

| templateId          | what it checks                                                                    |
| -------------------- | ----------------------------------------------------------------------------------- |
| `loads_clean`         | reuses BH-1's own evidence — no uncaught exception, no failed resource request      |
| `controllable`        | pressing a key moves a named entity's x/y                                          |
| `restart`             | a trigger returns the game to a `gameplay`-role state with score reset to 0        |
| `hud_text_present`    | a substring appears in `getSnapshot().hudTexts` while in a given state             |
| `value_persists`      | a named value in `getSnapshot().values` is unchanged across a state transition     |
| `score_feedback`      | firing a scoring trigger changes the HUD text (checks the **text**, not the internal score field — an internal-only change is the bug this one exists to catch) |
| `game_over_trigger`   | firing a failure trigger lands on a `gameover`-role state                          |

Results land in `.verify-result.json`'s `assertions` field with one of three statuses, never blurred together: **`judged`** (every item got a real pass/fail — see `results[]`), **`absent`** (no `assertions.json` — this is not a failure), or **`unavailable`** (a clean `assertions.json` exists but nothing could judge it, e.g. `window.__gameHarness` isn't installed). `judged`-with-failures and `unavailable` both make `pnpm verify` exit non-zero and write `passed: false`, same as a BH gate failure — a gate that could not run is not a gate that passed. Only `absent` is benign: a project that never opted into assertions stays green.

`scripts/assert.mjs` can also run standalone (`node scripts/assert.mjs`, after `pnpm build:play`) for iterating on assertion judging without re-running the full BH pipeline — that path opens its own browser session instead of reusing `verify`'s.

If you're building on this template and want `pnpm verify` to actually judge your game's acceptance criteria (not just report `unavailable`), read rule 6 in `AGENTS.md` before changing scenes.

## Adding assets

Drop image/audio files under `public/assets/` (create the directory) and load them the normal Phaser way in `PreloadScene.preload()`:

```ts
this.load.image('player', 'assets/player.png')
this.load.audio('shoot', 'assets/shoot.mp3')
```

The loading bar in `PreloadScene` already listens for the standard Phaser loader `progress` event, so it animates correctly as soon as real files are queued — no changes needed there.

## Deployment

`pnpm build:play` produces a fully static `dist-play/` directory — deploy it to any static host (Vercel, Netlify, GitHub Pages, an nginx container, etc). No server-side runtime is required.

## Contributing

This project follows [Conventional Commits](https://www.conventionalcommits.org):

```
feat(game): add enemy spawner
fix(input): capture arrow keys during pause menu
chore: bump phaser
```

## License

MIT
