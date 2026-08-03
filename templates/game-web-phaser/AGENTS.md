# AgentDock Game-Web-Phaser Template — Agent Execution Boundaries

> For AI coding agents running autonomously in a VM, building on this project after it was scaffolded from AgentDock's `game-web-phaser` template.

This is a standalone Phaser 3 + Vite + TypeScript project — not part of a monorepo. There is no `core/features/infra` layering here; it's a single package. The rules below are the ones that matter for an agent working unattended in a VM.

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

- Take an actual screenshot / rendered snapshot (headless browser, Playwright, whatever tool you have) and look at where things actually are — not just at attribute values in the DOM or console-logged numbers.
- If the feature involves more than one key/input/branch, exercise **all** of them, not just the first one that comes to mind. Space and arrow keys specifically — this template captures them (rule in `src/scenes/GameScene.ts`), but if you add more keys, verify each one individually.

## Project layout

```text
index.html            # entry HTML + the CSS reset that keeps the canvas positioned correctly
vite.config.ts         # dev/preview server config — port 8080 pinned, see rule 2
src/
├── main.ts            # creates the Phaser.Game instance — should rarely need edits
├── config.ts           # Phaser.Types.Core.GameConfig — Scale Manager lives here
└── scenes/
    ├── BootScene.ts     # engine-level setup only, runs first
    ├── PreloadScene.ts  # load assets, generate placeholder textures, show progress
    └── GameScene.ts     # the actual playable scene + the input-capture reference pattern
```

Keep this split. Don't collapse Boot/Preload/Game back into one file — it's what makes the loading screen, the asset pipeline, and gameplay independently replaceable and testable.

## May execute autonomously

- `pnpm install`, `pnpm build`, `pnpm check-types`
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
2. `pnpm build` — exits 0, produces `dist/`.
3. Dev server started **in the background** (rule 1), and reachable at `http://localhost:8080/`.
4. Visual behavior verified by actually looking at the rendered page (rule 5) — not just by reading property values.
5. Every interactive key/control your change touches has been pressed and observed, not just one of them (rule 5).
6. Working state committed to git (rule 3).
