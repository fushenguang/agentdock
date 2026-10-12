## 1. Planning

- [ ] 1.1 Create OpenSpec proposal, spec delta, design, and tasks
- [ ] 1.2 Confirm the shell-port approach (option A) and the settings route with the owner

## 2. Layout Primitives

- [ ] 2.1 Replace `PageContainer` with the container-query version including `isFullHeight`
- [ ] 2.2 Add `PageTopBar` (back link + page actions, one row, no scrolling)
- [ ] 2.3 Add `PageShell` (fixed `2rem` column gap, one framed content region, `isFramed` opt-out)
- [ ] 2.4 Add `SideDrawer` (end side, transparent backdrop, outside click does not close, width 420 capped to viewport)
- [ ] 2.5 Add `HorizontalFields` (label `auto` / control `minmax(0, 1fr)`, re-applied below the 480px collapse)
- [ ] 2.6 Add `BottomNav` (config-driven items, i18n labels, print-safe)
- [ ] 2.7 Replace `TemplateShell` with the container-query shell; retire `PageHeader`; update `index.ts`

## 3. Demo Surface

- [ ] 3.1 Convert the first-level route to a landing (visually hidden `h1` + one line + module entries, no images)
- [ ] 3.2 Convert the `hello` route to a second-level page using `PageShell`
- [ ] 3.3 Demonstrate `SideDrawer` + `Collapsible` + `MoreMenu alignment="end"` + `HorizontalFields` in the second-level page
- [ ] 3.4 Add the `/$locale/settings` first-level route with the Settings Surface hosting appearance and language
- [ ] 3.5 Key every list by a stable id and keep copy attached to the thing it qualifies
- [ ] 3.6 Add every new string to `enCatalog` and `zhCNCatalog` at key parity

## 4. Design Contract

- [ ] 4.1 Merge Product Stance into `DESIGN.md`
- [ ] 4.2 Rewrite the Layout section (embedded-App-panel context, container queries, one-screen skeleton, card restraint) and delete conflicting old rulings
- [ ] 4.3 Add the Settings Surface and Second-Level Pages sections (generalized, no business domain)
- [ ] 4.4 Update Component Rules for the new primitives and interaction calls

## 5. Agent Guidance

- [ ] 5.1 Update `LLM.md` route/UI recipes and the primitive list
- [ ] 5.2 Update `AGENTS.md` UI rules
- [ ] 5.3 Update the template docs site in both locales at file-list parity

## 6. Release Metadata

- [ ] 6.1 Add a `@cogito.ai/cli` changeset

## 7. Verification

- [ ] 7.1 Run the repo gates (`format`, `lint`, `check-types`, `build`, `align:check`, `arch:check`, `changeset:check`, `secrets:check`, docs parity)
- [ ] 7.2 Validate the OpenSpec change
- [ ] 7.3 End-to-end scaffold: generate, install, `pnpm check`, run dev and load the landing, second-level and settings routes
- [ ] 7.4 Screenshot self-check at a forced 380px and 900px viewport (CDP device metrics, not `--window-size`)
- [ ] 7.5 Stop before commit/push/publish and wait for owner preview approval
