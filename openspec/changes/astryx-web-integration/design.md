# Design — astryx-web-integration

Facts this design relies on come from three spikes run on Astryx 0.7.5 (recorded with thefoolai PRD
`dp-web-design-system`). Where this document gives exact
text (Appendix A, B, C), implement it as written; it was written by the planning layer so the
implementer does not have to make design judgement calls.

## D1 · Package

- Location `packages/astryx-web`, npm name `@cogito.ai/astryx-web`, `publishConfig.access: public`,
  released with changesets like `@cogito.ai/cli`. First published version `0.1.0`.
- Create it with the Astryx integration quick-start (`pnpm exec astryx docs authoring/quick-start`)
  and add each part with `pnpm exec astryx integration add template|doc|agent-doc` (all support
  `--dry-run`). Field reference: `pnpm exec astryx docs authoring/field-reference`.
- `peerDependencies`: `@astryxdesign/core ^0.7.5`; optional peer `@astryxdesign/cli >=0.7.0`
  (required by `replaces` and `keywords`; `integration verify` fails without it).
- `files` whitelist: only the manifest, `templates/`, `docs/`, `skills/` (added by
  `web-tanstackstart-design-direction`), `bin/`, `README.md`, `LICENSE`. A `pnpm-workspace.yaml`
  generated inside the package must never be packed (spike pitfall).
- `astryx integration check` needs the TypeScript 6 compiler; the template uses TypeScript 7. Pin
  the TypeScript 6 compiler as a devDependency of this package only.

## D2 · Archetype conventions (all six)

Each archetype is one `templates/<id>.tsx` plus one `templates/<id>.doc.mjs`. `astryx template`
copies only the `.tsx`, byte for byte, so the file must be complete on its own:

- default-export one React component (Astryx requires it; `page:new` turns it into a route);
- `'use client'` only when the file uses hooks;
- imports allowed: `react`, `@astryxdesign/core/*`, `@tanstack/react-router`, and the app aliases
  `@/components/layout`, `@/components/*` that exist in the template, and `@/i18n`. Use `@/`, never
  `~/` (Astryx reports `~` as a missing package). Nothing else: no icon packages, no sibling files;
- no `style=` attributes, no `CSSProperties`, no color literals, no `useMediaQuery` or
  `matchMedia`, no `Theme`, no `AppShell`, no `<div>` used for layout;
- every visible string goes through the translator hook that the template's existing pages use
  (see `templates/web-tanstackstart/src/components/OverviewLanding.tsx`), with keys
  `page.__PAGE__.<slot>`. `__PAGE__` is a placeholder that `page:new` replaces;
- the file ends with exactly one block comment that starts with `astryx-messages` and contains JSON:
  `{"en": {"page.__PAGE__.title": "…"}, "zh-CN": {"page.__PAGE__.title": "…"}}`. Both locales carry
  the same keys. `page:new` moves these into the app catalogs and deletes the block;
- sample data is three short rows at most, in a `const` named `SAMPLE_*` with a comment
  `// Replace with feature data`;
- touch targets are at least 44×44 px; responsive behaviour uses container queries through the app
  shell or StyleX `@container`, never the viewport.

The per-archetype specification is Appendix B. Base `dock-landing` on the template's
`OverviewLanding.tsx`, `dock-workbench` on `HelloWorkspace.tsx`, and `dock-settings` on the
template's settings page; they encode layouts the owner already accepted.

## D3 · Naming, categories, and `astryx build` selection

- Template ids start with `dock-`. Ids never change after the first publish.
- `astryx build` picks `data.start` with an internal heuristic: it takes the head noun of the
  intent's first clause and treats the idea as a page only when that noun is a family word of some
  page template; otherwise it starts from an app shell. Family words come from words shared by
  template ids within one category group (spike Q3).
- Tune `category`, `keywords`, `displayName`, and `description` until every case in Appendix C
  passes. Do not edit Appendix C to make a case pass; if a case cannot pass, stop and report.
- `dock-list` replaces `library`, `dock-form-flow` replaces `form-wizard`, `dock-settings` replaces
  `settings`, `dock-editor-frame` replaces `canvas-editor` (`replaces` in the doc file). The Core
  originals stay reachable with `--package @astryxdesign/core`.

## D4 · Design base docs

Implement Appendix A as Astryx docs (`type: 'generic'`): an index doc `dock-design-base` that links
one doc per section — `dock-product-stance` (A1), `dock-environment` (A2), `dock-layout` (A3),
`dock-touch-mobile` (A4), `dock-components` (A5), `dock-copy` (A6), `dock-states` (A7),
`dock-accessibility` (A8), `dock-refuse-list` (A9), `dock-visual-acceptance` (A10). Agents read
them with `pnpm exec astryx docs <id>` and find them with `pnpm exec astryx search`. Keep the
wording; you may split long sections into subsections.

## D5 · Agent guidance

Add exactly these lines with `astryx integration add agent-doc` (limits: 8 lines per package, 240
characters per line; commands start with `astryx`):

1. `Create every page from a template: run astryx build "<page> page for <purpose>" and scaffold the start template; never lay a page out from scratch.`
2. `Prefer the dock-* archetypes; when you know the one you need, run astryx template <id> directly.`
3. `Read astryx docs dock-design-base before UI work. Phone (390px) and desktop (1440px) are both first-class; touch targets are at least 44px.`
4. `Keep every string in the app catalogs, every color a token, every breakpoint a container query; no style attributes and no viewport media queries.`
5. `Before calling UI work done, render it at 390x844 and 1440x900 in light and dark and check it against astryx docs dock-visual-acceptance.`

If `integration check` rejects a line, shorten it without changing its rule and note the change in
the PR.

## D6 · Sample renderer

`bin/astryx-web.mjs` exposes `astryx-web samples`. It renders pages of a running dev server with
the system Chrome over the DevTools protocol. No new npm dependency.

```
astryx-web samples --base-url http://localhost:3000 --route /zh-CN/settings \
  --theme neutral --theme matcha --mode light --mode dark \
  --size 390x844 --size 1440x900 --out <dir> [--storage key=value ...]
```

- Chrome path comes from the `CHROME_PATH` environment variable; if it is missing, exit non-zero
  with a clear message.
- Theme and mode are applied through the app's own appearance persistence (`--storage` sets the
  same keys `AppearanceProvider` reads; read
  `templates/web-tanstackstart/src/components/appearance/appearance-persistence.ts`).
- One PNG per combination, named `<route-slug>__<theme>__<mode>__<size>.png`, plus `index.json`
  listing the files, the route, and the git commit. No polling: wait for network idle, then
  capture once.

## D7 · Template-source checks

Astryx's own checks do not read template source: a deliberately broken template (icon package,
sibling import, wrong prop, viewport media query, raw `<div>`) passed `check --strict`, `verify`,
and `doctor` in the spike. So the package ships `scripts/check-templates.mjs`, run in CI:

1. Static scan of every `templates/*.tsx` for the D2 prohibitions, the import allowlist, the
   `astryx-messages` block (valid JSON, same keys in both locales, every `t()` key present), and
   JSX text that contains letters outside a translator call.
2. Compile check: copy `templates/web-tanstackstart` to a temp directory, install this package into
   it with `link:`, run `astryx template <id> src/routes/$locale/check-<id>.tsx --json` for each
   archetype, assert `missingPackages` is empty, wrap the file as a route the way `page:new` will,
   and run the template's `check-types`.
3. Fail the CI job on any finding.

## D8 · Golden intents

`test/golden-intents.json` holds Appendix C. `scripts/golden-intents.mjs` runs
`astryx build "<intent>" --json` inside the same fixture and asserts `data.start.name` and
`data.start.package`. Rerun it on every Astryx upgrade; record the Astryx version in the output.

## D9 · Owner visual gate (blocking)

Before the first publish:

1. Start the fixture's dev server with each archetype scaffolded as a route.
2. Render every archetype with `astryx-web samples`: theme `neutral`, modes light and dark, sizes
   390×844 and 1440×900. Output to the directory in the `DESIGN_SAMPLES_DIR` environment variable
   (the owner sets it in the handoff); never inside this repository.
3. Check the renders against Appendix A yourself and fix everything you find in one batch, at most
   two rounds.
4. **Stop.** Report the render directory to the owner and wait. Do not publish until the owner
   approves. Apply the owner's feedback, re-render, and stop again.

Screenshots are allowed here because the visual result is what is being accepted. Never use
screenshots to watch CI or a pipeline; read their APIs.

## D10 · Release

Changeset `minor` for `@cogito.ai/astryx-web`. Publish only from a commit merged to `main`, after
the owner's visual approval. Afterwards commit a release note that records version → source commit
→ tarball sha512, and tag `@cogito.ai/astryx-web@<version>`.

## Stop and report (do not work around)

- An Appendix C case cannot pass by tuning metadata.
- Installing the package needs a change to the root `pnpm-workspace.yaml`, root build approvals, or
  root dependencies (AgentDock `.claude/CLAUDE.md`: must pause).
- Astryx behaves differently from this design (for example `replaces` has no effect).
- An archetype needs an import outside the D2 allowlist.
- The owner rejects the renders twice.

## Appendix A · Design base (normative text)

### A1 · Product stance

- One page, one job. A first-level route is an index; the work happens one route deeper.
- Hierarchy over decoration. Headings, dividers, and spacing carry structure; borders, shadows, and
  card chrome are exceptions.
- The first screen answers "what do I do now" with a control, not a paragraph.
- Fewer, larger surfaces. If a page reads as a wall of boxes, remove boxes.
- Every label, counter, and tip must earn its line.

### A2 · Environment

- The same Web runs in three places: the TheFoolAI desktop App, where the package Web is the main
  surface; the mobile App's WebView, on a phone with touch; and a standalone browser.
- Phone (390×844) and desktop (1440×900) are both first-class design targets. The narrowest
  supported width is 360px.
- Widths come from container queries, not the viewport: below 420px compact, 420–639px standard,
  640–959px enhanced, 960px and up wide.
- No horizontal scrolling at any width. A wide table becomes key–value rows or a named scrollable
  region.

### A3 · Layout

- Inline padding 12px below 420px, 20px from 420px. Section gap 16px below 420px, 24px from 420px.
- Reading content is capped at 44rem; grids may use 56rem from 960px.
- Second-level pages use the one-screen skeleton (`PageShell`): the top bar stays, only the body
  scrolls.
- Vertical first: put secondary detail behind a disclosure, a drawer, a sheet, or a sub-route
  instead of extending one long scroll.
- Never print a title that repeats the navigation; keep a visually hidden `h1` instead.

### A4 · Touch and mobile

- Touch targets are at least 44×44px. 32px is allowed only in dense toolbars that never appear on
  touch screens.
- On compact containers, first-level destinations live in the bottom navigation, and the primary
  action of a flow sits in a bottom bar within thumb reach.
- Respect safe areas: `viewport-fit=cover` and `env(safe-area-inset-*)` padding on fixed bars.
- Use `100dvh`, not `100vh`.
- Inputs use at least a 16px font so iOS does not zoom.
- Anything revealed on hover must also work by tap; gate hover styles with `@media (hover: hover)`.
- Secondary choices on compact containers open as bottom sheets, not floating menus.

### A5 · Components

- Use Astryx first: `pnpm exec astryx component <Name>`, `pnpm exec astryx search <words>`.
- Layout uses `Stack`, `Grid`, `Section`, `List`, and the app's layout primitives, never raw
  `<div>`s.
- Cards are the exception: only for an independently enterable unit (a module entry, a record
  awaiting a decision), one level deep, never around a form, list, section, or page.
- Row actions: the recurring one stays visible; rare or destructive ones go into one end-aligned
  `MoreMenu` with icon and text. Never three buttons across a row.
- Pick the control from the value's shape: on/off → `Switch`; 2–3 named choices →
  `SegmentedControl`; 4 or more → `Selector`; a number → `NumberInput`; free text → `TextInput`;
  an action → `Button`.
- No `style` attributes, no hard-coded colors, no viewport media queries.

### A6 · Copy

- Every user-facing string lives in the app catalogs, with the same keys in every locale.
- Delete paragraphs that only introduce a section. Keep the one line attached to a thing: a value's
  status, a field's format rule, an option's description.
- Name things by what they do, not by the technology behind them.

### A7 · States

- Every asynchronous surface has loading, empty, error (readable, with a retry), disabled, and
  success states.
- An empty section is one line of text. `EmptyState` is only for a page whose whole purpose is
  empty.
- A failed save never silently drops the user's edit.

### A8 · Accessibility

- Exactly one `h1` per page (visually hidden when it would repeat navigation); headings in order.
- Visible focus on every control; every action reachable by keyboard.
- Status is never color-only.
- Contrast at least 4.5:1 for body text and 3:1 for large text and controls.

### A9 · Refuse list

Never ship: gradient text; glass or blur used as decoration; neon glow on dark backgrounds; colored
side stripes on cards; emoji used as icons; cards inside cards; a page body that is a grid of
identical cards; big-number "hero metrics" on a page that is not a dashboard; small caps "eyebrow"
labels above every heading; purple-to-blue gradients; flows that open with a modal (use an inline
step, a sheet, or a drawer); more than one accent color; reading lines longer than about 75
characters; centered body paragraphs.

### A10 · Visual acceptance

- Render the changed pages at 390×844 and 1440×900, in light and dark.
- Check them against A1–A9. Fix everything you find in one batch. At most two rounds, then hand
  over.
- Screenshots are for judging what the user sees. Never use them to watch CI, pipelines, or
  progress; read the API.

## Appendix B · Archetype specifications

Common to all: D2 conventions; compact (below 420px) is the starting layout, then widen.

### B1 · `dock-landing` — first-level route (index)

- Visually hidden `h1`; at most one line of orientation (`Blockquote`).
- Two to four module entries as `ClickableCard`s (title and one line each), linking one route
  deeper.
- Compact and standard: one column. From a 600px container: one row (two entries → two columns,
  three or four → three columns). Never a 2 + 1 orphan row.
- Nothing else on the page.

### B2 · `dock-workbench` — second-level one-screen page

- `PageShell`: `PageTopBar` with the way back on the left and this page's one action on the right;
  only the body scrolls.
- Body: sections separated by `Divider variant="subtle"`; each section has a `Heading level={2}`
  and its add action on the same row.
- Rows inside sections; an empty section is one line of text.
- Configuration and forms open in `SideDrawer` (no scrim; closes by its own button or Escape).
  Rare actions go into one `MoreMenu`.

### B3 · `dock-list` — collection (replaces `library`)

- `PageShell`; the primary action (for example "New") in the top bar.
- A search field and a filter (`SegmentedControl` with two or three views, for example Recent / All
  / Archived).
- `List` rows: title, one metadata line (for example the updated time with `Timestamp`), and a
  `MoreMenu` for rare actions. The whole row opens the item.
- States: loading (skeleton rows), empty (`EmptyState` with the primary action, because the page's
  whole purpose is the list), no search results (one line), error (`Banner` with retry). "Load
  more" at the end rather than numbered pages.
- Compact: rows full width, top bar stays. Wide: list capped at 56rem.

### B4 · `dock-form-flow` — creation form or wizard (replaces `form-wizard`)

- Single step: one column of fields; `HorizontalFields` for short labels from 640px.
- Multi-step: a step indicator at the top; one step per screen on compact.
- Compact: a bottom bar with Back and Next (or Create), padded for safe areas, within thumb reach.
  Wide: actions at the end of the form.
- Inline validation under each field; submit shows a busy state; failure keeps the input and shows
  a retry.
- Inputs use at least a 16px font.

### B5 · `dock-settings` — settings surface (replaces `settings`)

- The page does not scroll; the section panel does.
- Section navigation: a vertical `SideNav` from a 640px container, a horizontally scrollable
  `TabList` below it. The nav column is 13rem wide.
- A panel does not repeat the section name. Each row: icon, name, and description on the left, the
  control on the right; from 480px down, every row stacks to one column at the same width.
- Controls follow A5; a value-bearing control shows the current value.

### B6 · `dock-editor-frame` — editor or canvas frame (replaces `canvas-editor`)

- A full-bleed main region with an empty, clearly named slot component (`EditorSlot`) where the
  domain editor goes. No demo canvas, no demo shapes, no editor state.
- A floating tool group at the top-left (vertical `IconButton`s with labels for assistive
  technology), a menu at the top-right (`DropdownMenu`), and a compact bottom navigation overlay.
  Floating controls keep 12px from the edges on compact and 24px from 640px, inside safe areas.
- Compact: tools collapse to the five most used plus a "more" button; the menu opens as a bottom
  sheet.
- The frame never scrolls; only the slot owns its scrolling and zoom.

## Appendix C · Golden intents

| Intent                                                 | Expected `start.name` |
| ------------------------------------------------------ | --------------------- |
| `landing page with module entries`                     | `dock-landing`        |
| `landing page on mobile`                               | `dock-landing`        |
| `workbench page with a top bar and sections`           | `dock-workbench`      |
| `list page for documents with search and recent items` | `dock-list`           |
| `library page`                                         | `dock-list`           |
| `list page on mobile`                                  | `dock-list`           |
| `settings page with sections`                          | `dock-settings`       |
| `settings page on mobile`                              | `dock-settings`       |
| `creation form with several steps`                     | `dock-form-flow`      |
| `wizard form on mobile`                                | `dock-form-flow`      |
| `canvas editor workspace`                              | `dock-editor-frame`   |
| `diagram editor page`                                  | `dock-editor-frame`   |

Every expected start comes from package `@cogito.ai/astryx-web`; assert both `start.name` and
`start.package`. For a replaced Core template, the spike showed `start.name` is our id while
`start.command` still names the Core id (`astryx template settings …`); scaffold with
`start.name` and `--package @cogito.ai/astryx-web` so the result does not depend on `command`.
