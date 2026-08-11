---
'@cogito.ai/cli': minor
---

Add a self-verifying test harness to the `game-web-phaser` template: `pnpm verify`
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

