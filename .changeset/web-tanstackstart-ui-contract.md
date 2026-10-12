---
'@cogito.ai/cli': minor
---

Adopt the accepted embedded-App-panel UI language in the `web-tanstackstart` template, so a project
scaffolded with `pnpm init:web <package-id>` starts from the workbench shape instead of a demo
skeleton.

The Web runs inside the TheFoolAI App's right-hand panel as the App's coding-agent workbench, and the
template now states and implements that environment: width is the scarcest resource, container queries
drive density, and horizontal scrolling is never acceptable.

- The shell is now a container-query root with bottom navigation and no top bar; the appearance and
  language controls moved to a new `/{locale}/settings` route that uses the Settings Surface (section
  navigation plus one scrolling panel). The `PageHeader` pattern was retired.
- New layout primitives: `PageTopBar`, `PageShell` (the one-screen skeleton: fixed `2rem` column gap,
  the page does not scroll, only the content frame does), `SideDrawer` (`MobileNav side="end"`,
  transparent backdrop, does not close on an outside click, 420 capped to the viewport) and
  `HorizontalFields` (label left, `minmax(0, 1fr)` control right, re-applied below the 480px
  collapse). `PageContainer` gained container-query density and an `isFullHeight` mode.
- The demo is now a live sample: the first-level route is a landing (visually hidden `h1`, one line of
  orientation, module entries) and `hello` is a second-level page demonstrating `PageShell`,
  `SideDrawer`, `Collapsible`, an end-aligned `MoreMenu` and `HorizontalFields`.
- `DESIGN.md` now carries the merged contract (Product Stance, the embedded-panel environment, the
  one-screen skeleton, the Settings Surface, Second-Level Pages, card restraint) with the conflicting
  older rulings removed, and `LLM.md` / `AGENTS.md` document the shortest path to the primitives.
