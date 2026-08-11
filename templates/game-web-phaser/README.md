# {{PROJECT_NAME}}

> Generated from the [AgentDock](https://github.com/CogitoTech/agentdock) `game-web-phaser` template.

A minimal, structurally-correct Phaser 3 + Vite + TypeScript starter for browser games — built for AI coding agents working autonomously in a VM as much as for humans. See `AGENTS.md` for the execution rules that apply while working in this project, and `PROJECT_CONTEXT.md` for cross-session handoff notes.

## Tech Stack

| Layer    | Technology                                                                      |
| -------- | ------------------------------------------------------------------------------- |
| Engine   | [Phaser 3](https://phaser.io)                                                   |
| Bundler  | [Vite](https://vitejs.dev)                                                      |
| Language | [TypeScript](https://www.typescriptlang.org) (strict mode)                      |
| Runtime  | Node.js ≥ 22 (the zero-dep `pnpm verify` needs the built-in `WebSocket` global) |

## Directory Structure

```text
index.html           # entry HTML — includes the CSS reset that keeps the canvas positioned correctly
vite.config.ts        # dev/preview server config — fixed port 8080, see below; build:play/build:learn outDir split
scripts/verify.mjs     # pnpm verify — zero-dep headless-Chromium/CDP checks, see "Verifying" below
tests/                 # unit tests for verify's judgement + the state-jump contract (pnpm test)
src/
├── main.ts           # boots the Phaser.Game instance
├── config.ts          # Phaser.Types.Core.GameConfig — Scale Manager configured here
├── debug/
│   ├── state-jump.ts   # listStates/jump/isValidStart contract + a minimal reference implementation
│   └── panel.ts         # debug panel — only ever included in the build:learn bundle
└── scenes/
    ├── BootScene.ts    # runs first, engine-level setup only
    ├── PreloadScene.ts # loads assets / generates placeholder textures, shows a loading bar
    └── GameScene.ts    # the playable scene — also the reference pattern for keyboard input
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

Builds `dist-play/`, loads it in real headless Chromium over CDP, and fails loudly (non-zero exit) if the build fails, the page throws an uncaught exception or has a failed resource request, or the rendered screenshot is provably empty or the canvas has zero size. See [Verifying](#verifying) below and `scripts/verify.mjs`.

```bash
pnpm test
```

Runs the unit tests behind `verify` (the screenshot-emptiness judgement) and the state-jump contract's traversal assertion (`tests/`), via Node's built-in test runner — no test framework dependency.

## What's already wired up

This template exists to structurally prevent two bugs hit by earlier unstructured (vanilla JS + Canvas) agent-built games:

1. **Canvas positioned wrong / content below unreachable.** Fixed by Phaser's Scale Manager (`scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` in `src/config.ts`) combined with a CSS reset in `index.html` that pins the canvas's parent element to the full viewport. Both pieces are required — the Scale Manager only centers the canvas _inside its parent_; the CSS makes sure the parent itself is positioned correctly.

2. **Space key makes the screen go blank and the page lock up, while audio keeps playing.** Fixed by binding all game input through Phaser's own Keyboard plugin (`this.input.keyboard`, scene-scoped, torn down with the scene) instead of raw `window`/`document` listeners, and by calling `keyboard.addCapture([...])` for every key the browser also binds to something (Space/arrows scroll the page by default). See the class-level comment in `src/scenes/GameScene.ts` for the full writeup and the reference pattern to copy for any new input you add.

3. **"I ran the agent and it said done" being the only signal a change actually worked.** Fixed by `pnpm verify` (`scripts/verify.mjs`) — see [Verifying](#verifying) below.

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
