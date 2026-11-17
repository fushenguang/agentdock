---
name: domain-package-web-design
description: Use before designing or changing any domain-package Web page when audience, information hierarchy, visual direction, page composition, or Astryx mapping must be decided. Runs package intake once, requires a page brief before every page, and routes implementation through astryx-web-design. Do not use for backend-only work or generic websites outside a generated domain package.
---

# Domain package web design

The product failure this skill prevents is a page that compiles and passes checks but has no clear
audience, exposes every capability at once, repeats information through cards, and changes its page
grammar from route to route.

Design intent must exist before implementation. Validation after generation can catch a regression;
it cannot decide what the page is for.

## Read first

1. Read the package `PRODUCT.md`, `DESIGN.md`, root and Web `AGENTS.md`, and `LLM.md`.
2. Load the project `astryx-web-design` skill. It owns templates, page building, component usage, and
   visual acceptance.
3. Read the package `contract.json`, roadmap, and relevant machine-readable Web surface so the page
   brief reflects the actual product rather than a generic dashboard.

## Phase 1: Package design foundation

Read [references/package-intake.md](references/package-intake.md) when `DESIGN.md` is draft, lacks
audience/hierarchy, or a new visual direction is requested.

Ask the owner in small batches, at most three questions per message. Establish:

- audience, environment, frequency, and product posture;
- primary, secondary, auxiliary, and hidden information;
- visual character, positive references, and anti-references;
- page grammar, density, typography, color, spacing, and interaction;
- which content is listed as rows, which is a card, and which belongs in a drawer, disclosure,
  menu, contextual route, or settings page.

When the direction is unclear, use Stitch or local Astryx samples to show two or three concrete
directions. Use the other design references only for their defined roles in
[references/reference-roles.md](references/reference-roles.md). Stop and wait for the owner to choose.
Write the result into `DESIGN.md`; never invent the missing decision.

## Phase 2: Page brief

Before creating or structurally changing any page, read
[references/page-brief.md](references/page-brief.md) and ask:

1. What is this page's one core function?
2. What is the user's primary action?
3. What must be visible above the fold, and what must remain hidden until requested?

Record a complete row under `DESIGN.md`'s `## Page briefs` table. A new route cannot be created until
the row names its core function, primary action, above-the-fold content, hidden-by-default content,
and Astryx archetype.

The page must reduce the product to its current job. Do not put every capability on the page because
the package supports it. Secondary detail goes into `SideDrawer`, `Collapsible`, `Popover`, or
`MoreMenu`; auxiliary functions move to a contextual route or settings surface.

## Phase 3: Astryx mapping

Read [references/astryx-mapping.md](references/astryx-mapping.md) after the page brief is complete.
Then query the installed Astryx CLI:

```bash
pnpm exec astryx build "<page function and type>"
pnpm exec astryx template --list
pnpm exec astryx component <Name>
pnpm exec astryx docs dock-design-base
```

Map the brief to one app archetype and named Astryx owners before writing JSX. Homogeneous records
use rows or tables. Card chrome is only for an independently enterable or actionable unit, one level
deep. Never wrap a form, list, page section, or whole page in a card.

## Phase 4: Implement and inspect

Create new pages with `pnpm page:new`; change existing pages only inside their approved sections.
Keep Astryx tokens, app wrappers, locale catalogs, container queries, and provenance intact.

Run the project's normal checks. When the page has a visual change, render the changed route at
390x844 and 1440x900 in light and dark, inspect it, and exercise the real core interaction. Use the
existing `design:samples` workflow only when it helps judge the result; do not add a separate heavy
acceptance platform or treat screenshots as a substitute for the page brief.

## Stop conditions

- Stop if the audience, core task, information hierarchy, or visual direction is unresolved.
- Stop if the current page has no core function or primary action.
- Stop if the agent cannot name what is secondary and therefore hidden by default.
- Stop if an external design reference conflicts with Astryx or the approved `DESIGN.md`.
- After one failed visual repair, diagnose the brief or mapping instead of adding more patches.
