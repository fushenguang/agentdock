# @cogito.ai/cli

## 0.7.1

### Patch Changes

- ed1432c: web-nextjs 模板：`UpgradeButton` 接入 dashboard header

  `add-payments-to-web-nextjs` 落地时定义了 `UpgradeButton` 组件，但从未在任何页面
  引用（`grep UpgradeButton` 除组件自身定义外零命中），验收清单第 11.6 项一直是
  未完成状态。现已接入 `src/components/dashboard/site-header.tsx`（header 右上角，
  `source="dashboard-header"`），点击跳转 `/pricing`，与既有 client 组件路由模式
  一致。`pnpm check-types` + `pnpm build`（apps/web）通过。

## 0.7.0

### Minor Changes

- cfcacd7: game-web-phaser 模板新增 IA 断言运行器：让「可判定」真的被判定

  BH 三闸（构建 / 加载 / 渲染）只能证明「东西跑起来了、画面上有东西」，
  证明不了「这个游戏真的能玩」。2026-08-12 一次真实 Run 把这个洞打了出来：
  产物 BH 三闸全绿，而真人一按空格就抛 `TypeError: a[l] is not a function`——
  交互层根本不在任何一闸的覆盖范围内。

  本次新增 `scripts/assert.mjs`（`runAssertions` + `RemoteHarness`），
  在 BH 之后追加一层 IA 断言，通过真实 CDP 驱动真实浏览器判定 7 个模板断言：
  `loads_clean` / `controllable` / `restart` / `hud_text_present` /
  `value_persists` / `score_feedback` / `game_over_trigger`。

  `.verify-result.json` 新增顶层 `assertions` 字段。
  🔴 消费者 **MUST NOT** 把它读成「IA 通过了」，除非
  `assertions.status === 'judged'` 且 `results` 里每一条都 passed——
  verify 中途夭折（BH 失败、浏览器没起来等）时该字段会是 `not_run` 带 reason，
  两者对消费者完全不同。IA 失败同样让 `pnpm verify` 退出非零（design D8）。

  **guest 真机验证已完成**（2026-08-12，Tarit guest VM）：
  `VERIFY_EXIT=0`，四闸 `BH-0/BH-1/BH-2/IA` 全 true，
  `assertions.status: "judged"`、7/7 通过，走真实 headless chromium + CDP，非 mock。
  模板自测 49/49 通过。

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
