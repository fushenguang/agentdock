## 1. Planning

- [x] 1.1 Create OpenSpec proposal, spec delta, design, and tasks
- [x] 1.2 Confirm the shell-port approach (option A) and the settings route with the owner

## 2. Layout Primitives

- [x] 2.1 Replace `PageContainer` with the container-query version including `isFullHeight`
- [x] 2.2 Add `PageTopBar` (back link + page actions, one row, no scrolling)
- [x] 2.3 Add `PageShell` (fixed `2rem` column gap, unframed content body; the original `isFramed` frame was superseded by change `remove-web-tanstackstart-page-frame`)
- [x] 2.4 Add `SideDrawer` (end side, transparent backdrop, outside click does not close, width 420 capped to viewport)
- [x] 2.5 Add `HorizontalFields` (label `auto` / control `minmax(0, 1fr)`, re-applied below the 480px collapse)
- [x] 2.6 Add `BottomNav` (config-driven items, i18n labels, print-safe)
- [x] 2.7 Replace `TemplateShell` with the container-query shell; retire `PageHeader`; update `index.ts`

## 3. Demo Surface

- [x] 3.1 Convert the first-level route to a landing (visually hidden `h1` + one line + module entries, no images)
- [x] 3.2 Convert the `hello` route to a second-level page using `PageShell`
- [x] 3.3 Demonstrate `SideDrawer` + `Collapsible` + `MoreMenu alignment="end"` + `HorizontalFields` in the second-level page
- [x] 3.4 Add the `/$locale/settings` first-level route with the Settings Surface hosting appearance and language
- [x] 3.5 Key every list by a stable id and keep copy attached to the thing it qualifies
- [x] 3.6 Add every new string to `enCatalog` and `zhCNCatalog` at key parity

## 4. Design Contract

- [x] 4.1 Merge Product Stance into `DESIGN.md`
- [x] 4.2 Rewrite the Layout section (embedded-App-panel context, container queries, one-screen skeleton, card restraint) and delete conflicting old rulings
- [x] 4.3 Add the Settings Surface and Second-Level Pages sections (generalized, no business domain)
- [x] 4.4 Update Component Rules for the new primitives and interaction calls

## 5. Agent Guidance

- [x] 5.1 Update `LLM.md` route/UI recipes and the primitive list
- [x] 5.2 Update `AGENTS.md` UI rules
- [x] 5.3 Update the template docs site in both locales at file-list parity

## 6. Release Metadata

- [x] 6.1 Add a `@cogito.ai/cli` changeset

## 7. Verification

- [x] 7.1 Run the repo gates (`format`, `lint`, `check-types`, `build`, `align:check`, `arch:check`, `changeset:check`, `secrets:check`, docs parity)
- [x] 7.2 Validate the OpenSpec change
- [x] 7.3 End-to-end scaffold: generate, install, `pnpm check`, run dev and load the landing, second-level and settings routes
- [x] 7.4 Screenshot self-check at a forced 380px and 900px viewport (CDP device metrics, not `--window-size`)
- [ ] 7.5 Stop before commit/push/publish and wait for owner preview approval
