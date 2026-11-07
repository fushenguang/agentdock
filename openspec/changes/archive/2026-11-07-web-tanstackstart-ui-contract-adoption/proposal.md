---
roadmap-id: web-tanstackstart-template
---

## Why

`web-tanstackstart` today ships an Astryx `AppShell` + `TopNav` skeleton whose only page pattern is
"a page header plus one card". The UI contract that a domain package Web actually needs has already
been designed, implemented and owner-accepted in a real product
(`domain-packages/apps/my-career-web`), but none of it lives in the template: the shared layout
primitives (`PageShell`, `PageTopBar`, `SideDrawer`, `HorizontalFields`), the one-screen skeleton,
the drawer/disclosure/overflow-menu judgement calls, and the "cards are the exception" rule are all
absent. A project scaffolded through `pnpm init:web <package-id>` therefore starts from a skeleton
that does not match the accepted product UI, so every package re-derives the same decisions.

The environment must be stated plainly because it drives every rule: this Web is **embedded in the
TheFoolAI App's right-hand panel** as an **auxiliary workbench for the App's coding agent**, not a
standalone website. The panel is the normal viewport (default ~380px, hard minimum 360px), the mouse
and keyboard are the normal input, and the primary reader is both a human and an AI agent. Screen
width is the scarcest resource, responsiveness is a first-class acceptance criterion, and copy that
does not change behaviour is noise.

## What Changes

- Port the accepted layout primitives into the template: `PageTopBar`, `PageShell`, `SideDrawer`,
  `HorizontalFields`, plus a container-query `PageContainer` (with `isFullHeight`) and a
  container-query `TemplateShell` with a bottom navigation bar. Retire the `TopNav` shell and the
  `PageHeader` "title + description + actions" pattern that the one-screen skeleton replaces.
- Establish the one-screen skeleton for second-level pages: `PageTopBar` and the content container in
  one flex column with a fixed `2rem` gap, the page itself does not scroll, only the inner container
  does, and the gap is owned by that column rather than inherited from `PageContainer`.
- Establish the interaction judgement calls: the page holds the thing itself; configuration, forms
  and secondary detail go into a right-hand drawer or a trigger-anchored popover; rarely used
  actions go into one end-aligned overflow menu with icon + text items; grouped, rarely edited
  content is collapsed by default; named choice sets are dropdowns, binaries are switches, multi-picks
  are checkbox lists; short labels read across via `HorizontalFields`.
- Make the card discipline explicit and restrictive: card chrome is the exception, never the frame,
  and never nests. A page is `Section` + `Divider` + `List` / rows, not a wall of boxes.
- Make localization and appearance reachable without a top bar: a `/$locale/settings` first-level
  route carries the Settings Surface (section nav + one panel) and hosts the appearance and language
  controls that used to live in `TopNav`.
- Rewrite the demo surface as a live sample: the first-level route becomes a landing (visually hidden
  `h1` + one line of orientation + module entries) and the `hello` feature becomes a second-level page
  that demonstrates `PageShell` + `SideDrawer` + `Collapsible` + `MoreMenu` + `HorizontalFields`.
- Fold the accepted design contract into `DESIGN.md` (Product Stance, rewritten Layout with the
  one-screen skeleton, Settings Surface, Second-Level Pages, Component Rules) and replace the
  conflicting old rulings instead of keeping two sets.
- Update `LLM.md` and `AGENTS.md` with the shortest path for using the new primitives, and update the
  template documentation site in both locales.

## Capabilities

### New Capabilities

- `web-tanstackstart-ui-language`: the embedded-App-panel UI contract for the template — shell and
  layout primitives, the one-screen skeleton, drawer/disclosure/overflow-menu rules, form-control
  selection, card restraint, and the documentation/agent-guidance obligations that keep it legible.

### Modified Capabilities

## Impact

- `templates/web-tanstackstart/src/components/layout/**` (new and replaced primitives)
- `templates/web-tanstackstart/src/components/**` (landing, hello workspace, settings surface)
- `templates/web-tanstackstart/src/routes/$locale/**` (landing, second-level page, settings)
- `templates/web-tanstackstart/src/i18n/messages.ts` (en + zh-CN key parity)
- `templates/web-tanstackstart/DESIGN.md`, `LLM.md`, `AGENTS.md`
- `apps/docs/content/docs/{en,zh}/templates/web-tanstackstart/**`
- `.changeset/*` for `@cogito.ai/cli` (the template ships inside the CLI tarball)
- No new runtime dependencies; UI stays Astryx + StyleX only

## Non-goals

- Introducing any business domain into the demo; the sample stays a `hello`/example surface.
- Adding images, a licensed-image manifest, or the `fetch:images` pipeline of the reference product.
- Adding a second component library, an icon dependency, Tailwind, or any CSS-in-JS runtime.
- Changing the template's data layer, feature boundary, server functions, or generated route tree
  contract.
- Touching `templates/web-tanstackstart-kids/**`, `.github/**`, or the pnpm lockfile by hand.
- Publishing, pushing, or versioning anything before local verification and owner preview.
