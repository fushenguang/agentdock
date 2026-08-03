# {{PROJECT_NAME}}

> Generated from the [AgentDock](https://github.com/CogitoTech/agentdock) `game-web-phaser` template.

A minimal, structurally-correct Phaser 3 + Vite + TypeScript starter for browser games — built for AI coding agents working autonomously in a VM as much as for humans. See `AGENTS.md` for the execution rules that apply while working in this project, and `PROJECT_CONTEXT.md` for cross-session handoff notes.

## Tech Stack

| Layer    | Technology                                                 |
| -------- | ---------------------------------------------------------- |
| Engine   | [Phaser 3](https://phaser.io)                              |
| Bundler  | [Vite](https://vitejs.dev)                                 |
| Language | [TypeScript](https://www.typescriptlang.org) (strict mode) |
| Runtime  | Node.js ≥ 18                                               |

## Directory Structure

```text
index.html           # entry HTML — includes the CSS reset that keeps the canvas positioned correctly
vite.config.ts        # dev/preview server config — fixed port 8080, see below
src/
├── main.ts           # boots the Phaser.Game instance
├── config.ts          # Phaser.Types.Core.GameConfig — Scale Manager configured here
└── scenes/
    ├── BootScene.ts    # runs first, engine-level setup only
    ├── PreloadScene.ts # loads assets / generates placeholder textures, shows a loading bar
    └── GameScene.ts    # the playable scene — also the reference pattern for keyboard input
```

## Getting Started

### 1. Prerequisites

- Node.js ≥ 18
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
pnpm build     # outputs static assets to dist/
pnpm preview   # serves the dist/ build on port 8080
```

### 5. Type-check

```bash
pnpm check-types
```

## What's already wired up

This template exists to structurally prevent two bugs hit by earlier unstructured (vanilla JS + Canvas) agent-built games:

1. **Canvas positioned wrong / content below unreachable.** Fixed by Phaser's Scale Manager (`scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` in `src/config.ts`) combined with a CSS reset in `index.html` that pins the canvas's parent element to the full viewport. Both pieces are required — the Scale Manager only centers the canvas _inside its parent_; the CSS makes sure the parent itself is positioned correctly.

2. **Space key makes the screen go blank and the page lock up, while audio keeps playing.** Fixed by binding all game input through Phaser's own Keyboard plugin (`this.input.keyboard`, scene-scoped, torn down with the scene) instead of raw `window`/`document` listeners, and by calling `keyboard.addCapture([...])` for every key the browser also binds to something (Space/arrows scroll the page by default). See the class-level comment in `src/scenes/GameScene.ts` for the full writeup and the reference pattern to copy for any new input you add.

## Adding assets

Drop image/audio files under `public/assets/` (create the directory) and load them the normal Phaser way in `PreloadScene.preload()`:

```ts
this.load.image('player', 'assets/player.png')
this.load.audio('shoot', 'assets/shoot.mp3')
```

The loading bar in `PreloadScene` already listens for the standard Phaser loader `progress` event, so it animates correctly as soon as real files are queued — no changes needed there.

## Deployment

`pnpm build` produces a fully static `dist/` directory — deploy it to any static host (Vercel, Netlify, GitHub Pages, an nginx container, etc). No server-side runtime is required.

## Contributing

This project follows [Conventional Commits](https://www.conventionalcommits.org):

```
feat(game): add enemy spawner
fix(input): capture arrow keys during pause menu
chore: bump phaser
```

## License

MIT
