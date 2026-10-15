---
roadmap-id: web-tanstackstart-template
---

## Why

Builder ruling (2026-10-15): in domain package Web apps, secondary pages must never be wrapped in a
Card (no rounded + bordered + card-background surface around page content).

`templates/web-tanstackstart` currently does the opposite by default. `PageShell` defaults
`isFramed = true` and draws a frame (`border` + `--radius-container` + `--color-background-card`)
around every second-level page body, and `DESIGN.md` ("Skeleton") prescribes "one content frame
(`--radius-container` + card surface)". The in-flight change `web-tanstackstart-ui-contract-adoption`
(task 2.3, design D3, spec "Card restraint" scenario) explicitly approved that "one framed content
region". Packages generated from the template (my-career, agent-eval) inherited the frame. Because an
approved spec mandates the frame, removing it is a spec change and needs its own approved proposal
before any template code is touched.

## What Changes

- Remove the frame from `PageShell` entirely: delete the frame style and the `isFramed` prop; keep
  the full-height one-screen layout and the inner scroll region.
- Update every template call site of `PageShell` (`HelloWorkspace.tsx`) and any use of `isFramed`.
- Rewrite the `DESIGN.md` Skeleton rule: secondary pages are never wrapped in a card; structure comes
  from headings, spacing, dividers, tabs and tables; Card is only for a genuinely independent
  interactive unit, never a page or section wrapper.
- Fix every other place that prescribes or describes the frame: `LLM.md` (lines mentioning "content
  frame"), `AGENTS.md`, the `PageShell`/`PageTopBar` doc comments, and the en/zh template docs
  (`index.mdx`, `usage.mdx`: "content frame" wording).
- Audit `templates/web-tanstackstart-kids` for the same pattern (it has no `PageShell`; its
  `KidComponentsPage.tsx` uses `--radius-container` and must be judged individually) and fix only
  what is the same page-wrapper pattern.
- Add a patch changeset for `@cogito.ai/cli` (the template ships inside the CLI tarball), consistent
  with the earlier template fix changes.
- Supersede the "one framed content region" wording in `web-tanstackstart-ui-contract-adoption`
  (task 2.3, design D3, spec "Card restraint" scenario) so the two changes do not contradict.

## Capabilities

### New Capabilities

### Modified Capabilities

- `web-tanstackstart-ui-language`: adds a "No page-level card frame" requirement and replaces the
  framed-region scenario of "Card restraint". (The base spec still lives inside the unarchived
  change `web-tanstackstart-ui-contract-adoption`; this delta is expressed as ADDED and must be
  reconciled at archive time.)

## Impact

- `templates/web-tanstackstart/src/components/layout/PageShell.tsx`, `PageTopBar.tsx` (comment),
  `src/components/HelloWorkspace.tsx`
- `templates/web-tanstackstart/{DESIGN,LLM,AGENTS}.md`
- `apps/docs/content/docs/{en,zh}/templates/web-tanstackstart/{index,usage}.mdx`
- possibly `templates/web-tanstackstart-kids/**` (audit first)
- `.changeset/*.md` (patch, `@cogito.ai/cli`)
- Behavior change for newly scaffolded projects only; no data layer, route, or dependency change.

## Non-goals

- Fixing already-generated packages (my-career, agent-eval); handled in another repo.
- Removing `Card`/`ClickableCard` components themselves or the first-level landing module entries
  (independent, actionable units remain a legitimate use).
- Redesigning the one-screen skeleton (fixed `2rem` gap, non-scrolling page, inner scroll) beyond
  removing the frame.
- Publishing, pushing, or versioning anything.
