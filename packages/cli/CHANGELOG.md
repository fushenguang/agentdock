# @cogito.ai/cli

## 0.6.0

### Minor Changes

- c9022ef: Add a self-verifying test harness to the `game-web-phaser` template: `pnpm verify`
  runs three executable gates — build succeeds, headless Chromium loads the built
  game with no uncaught exception or failed resource request, and the rendered
  screenshot is provably non-empty (not just "a PNG exists") with a non-zero-size
  canvas. Zero new dependencies — it spawns whatever Chromium already exists in the
  environment and speaks CDP over Node's built-in `WebSocket`.

  Why: this template's `AGENTS.md` used to ask an agent to "take a screenshot and
  eyeball it" — prose an agent can silently skip and still report success. This
  replaces that floor check with an artifact that either passes or exits non-zero
  with what it expected vs. what it found; it never prints "skipping" and exits 0.

  Also new in this template:
  - A `listStates()` / `jump(id, seed?)` / `isValidStart(id, state)` state-jump
    contract (`src/debug/state-jump.ts`) plus a minimal Boot/Preload/Game reference
    implementation and a traversal assertion (`tests/state-jump.test.mjs`) that
    checks both legality and reproducibility of every state's `jump()`.
  - Two build targets: `build:play` (→ `dist-play/`, port 8080, the public share
    link — no debug panel) and `build:learn` (→ `dist-learn/`, port 8090, includes
    a debug panel). Which one you get is decided by the build target
    (`import.meta.env.MODE`), not a runtime switch anyone could flip in the
    browser.

  **Contract change**: the generated project's `package.json` now declares
  `engines.node: ">=22"` (up from `>=18`) — the zero-dependency CDP transport needs
  the built-in `WebSocket` global that only exists from Node 22 onward, and
  `verify.mjs` itself refuses to run on an older Node instead of silently skipping
  BH-1. Existing `game-web-phaser` projects on Node 18–21 are unaffected until they
  pull in this template update; new projects scaffolded after this change need
  Node ≥22.

  Minor, not patch: this is new opt-in capability layered onto an already-shipped
  template (a new `verify`/`test`/`build:learn` script and a new `src/debug/`
  module), not a bug fix — nothing existing was broken or removed, and the CLI's
  own `engines.node` requirement is unchanged.

  Also in this release:
  - `verify.mjs` writes a machine-readable `.verify-result.json` (gate ids, pass/fail,
    detail) so the outcome can be surfaced outside the VM. It is written on failure as
    well as success — a verification layer that is invisible exactly when it has
    something to say is worse than none.
  - The template now ships `pnpm-workspace.yaml` with `allowBuilds: esbuild: true`.
    Without it `pnpm install` leaves esbuild's build unapproved and pnpm then refuses
    to run **any** script, so `pnpm verify` could not run at all on a freshly
    scaffolded project until someone manually ran `pnpm approve-builds`. Note pnpm 11
    reads `allowBuilds` from this file, not `pnpm.onlyBuiltDependencies` in
    package.json.
  - 🔴 `engines.node` is now `>=22` (the zero-dependency CDP transport uses the
    built-in `WebSocket` global). Generated projects on Node 18–21 will fail
    `pnpm verify` with an explicit message rather than skipping the gate.

## 0.5.0

### Minor Changes

- f351439: Add the `game-web-phaser` template — a Phaser 3 + Vite + TypeScript scaffold for
  browser games written by AI coding agents.

  Why this template exists: two real agent-driven runs, given only a
  natural-language goal, hand-wrote vanilla JS + Canvas from scratch and shipped a
  canvas-offset bug and a space-key hang. Prose in the prompt did not prevent it.
  This template encodes the constraints as executable scaffolding instead:
  - Phaser's Scale Manager (`FIT` + `CENTER_BOTH`) so the canvas cannot drift out
    of the visible area
  - A conventional input setup that stops space/arrow keys from scrolling the page
  - Boot / Preload / Game scenes split up front, so the agent has structure to
    extend rather than a blank file to improvise in
  - `dev` / `preview` pinned to port 8080, so the surrounding system can create a
    stable share link
  - An `AGENTS.md` for the _generated_ project carrying the hard-won operational
    rules: never run a non-exiting foreground process, commit every verifiable
    step, and verify real rendered position and real key presses rather than
    property values

## 0.4.10

### Patch Changes

- 2ba5b10: add supabase schema

## 0.4.9

### Patch Changes

- add data layer & schema selection to CLI init flow, fix template routing bugs with i18n Link double-locale, parameterize SQL migrations with **SCHEMA** placeholder

## 0.4.8

### Patch Changes

- 9978b27: fixed react-query issues
- 9978b27: to correct the right version

## 0.4.6

### Patch Changes

- 91e8cdc: enhance web-nextjs template

## 0.4.5

### Patch Changes

- 08c8fa8: new content

## 0.4.4

### Patch Changes

- b9bae37: add payments to web-nextjs

## 0.4.3

### Patch Changes

- 71f9ce2: develop web-nextjs template and refine docs

## 0.4.2

### Patch Changes

- c94deed: refine web-nextjs and docs app

## 0.4.1

### Patch Changes

- 83a32e7: resolve web-nextjs template css issues

## 0.4.0

### Minor Changes

- dff1e2b: refine web-nextjs template

## 0.3.5

### Patch Changes

- 64ef5b6: docs: add release-pitfalls guide covering template packaging trap, Release Bot diverge, and CI-only publish workflow
- b158ca5: refine CLI commands

## 0.3.4

### Patch Changes

- fixed template issues: remove hello route, fix zh.json translations, fix dashboard getTranslations, add ThemeProvider and Toaster

## 0.3.3

### Patch Changes

- 7d5709c: fixed template issues

## 0.3.2

### Patch Changes

- 9a29b0b: enhanced web-nextjs template

## 0.3.1

### Patch Changes

- 4ed79a6: Remove rewriteTurboJson post-processing from scaffold; template turbo.json is now standalone (no extends) so no post-processing is needed after scaffolding.

## 0.3.0

### Minor Changes

- 0c23f70: Initial release: agentdock init (human + agent mode) and agentdock mcp (stdio MCP server)

## 0.2.0

### Minor Changes

- Initial release: agentdock init (human + agent mode) and agentdock mcp (stdio MCP server)
