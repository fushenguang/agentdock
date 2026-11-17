---
status: draft # draft | approved
approvedBy: # the owner's name, set only on approval
approvedAt: # YYYY-MM-DD
archetype: # a row id from `astryx docs dock-style-archetypes`
theme:
  base: # an Astryx theme id
  brandColor: # for example oklch(0.62 0.12 160)
  modes: [light, dark]
---

# Design contract — {{PROJECT_NAME}}

Shared rules: `pnpm exec astryx docs dock-design-base`. Product facts: `PRODUCT.md`. This file holds
only what is specific to this product.

## Overview

Personality (three adjectives), audience, primary surfaces.

## Audience and context

- Primary user:
- Usage environment and frequency:
- Primary product outcome:
- What "done" means for the user:
- App Agent role, if any:

Do not approve this contract while these fields are generic. The implementation agent must ask the
owner and record real product context.

## Information hierarchy

- Primary: the one current job of the product.
- Secondary: functions used while doing that job; reveal them on demand.
- Auxiliary: history, diagnostics, advanced settings and rare configuration.
- Never above the fold: capabilities unrelated to the current job.

Each page has one primary action. Supporting information earns its place only when it helps the user
make the next decision. Empty space is an intentional part of the composition, not a place to fill
with inactive features.

## Visual direction

- Character:
- Positive references and what to borrow:
- Anti-references and what not to copy:
- Density:
- First-screen posture:

Use Stitch for zero-to-one direction exploration when the owner has no visual direction. Use Taste
Skill as an aesthetic constraint, UI UX Pro Max as design knowledge, and Impeccable for critique and
polish of an existing surface. Astryx remains the implementation authority.

## Colors

The brand color and where it is used; any status colors beyond the theme's.

## Typography

Theme fonts kept or changed; scale adjustments.

## Layout and navigation

Phone: navigation, first screen, where the primary action sits.
Desktop: navigation, content width.

## Page grammar

| Page type | Use for                                 | Required shape                                                |
| --------- | --------------------------------------- | ------------------------------------------------------------- |
| Landing   | First-level index and module entry      | One orientation line, primary module entries, no feature wall |
| List      | Homogeneous records                     | Search/filter when needed, rows or table, one create action   |
| Workbench | A focused task with live state          | Top bar, current task surface, configuration in drawer        |
| Form      | Creating or editing one object          | Fields in task order, inline validation, one primary submit   |
| Settings  | Global preferences                      | Section navigation and row-based controls                     |
| Editor    | Canvas, timeline or long-lived document | Work surface visible, inspector/toolbar secondary             |

Do not invent a page structure outside this table without an owner-approved decision. Similar jobs
use the same grammar across routes.

## Content shape and component policy

| Content                                    | Owner                                     |
| ------------------------------------------ | ----------------------------------------- |
| Homogeneous records                        | `List` or `Table`                         |
| Independently enterable or actionable unit | One level of `Card`/`ClickableCard`       |
| Form, collection or page section           | `Section` + `Divider`; never card chrome  |
| Configuration or secondary detail          | `SideDrawer`, `Popover`, or `Collapsible` |
| Rare row actions                           | One end-aligned `MoreMenu`                |
| Binary state                               | `Switch`                                  |
| Two or three named choices                 | `SegmentedControl`                        |
| Four or more named choices                 | `Selector`                                |

Cards are never the page frame and never nest. If a page reads as a wall of boxes, the information
hierarchy is wrong before the styling starts.

## Hidden-by-default policy

List what stays out of the first screen and name its reveal surface:

- advanced configuration -> drawer
- grouped history or metadata -> collapsible
- rare or destructive row actions -> More menu
- auxiliary workflow -> contextual route
- global preferences -> settings route

## Interaction and motion

- Primary keyboard path:
- Focus behavior:
- Loading, saving, error and recovery:
- Motion and reduced-motion behavior:
- Destructive confirmation:

## Pages

| Route | Archetype | Purpose |
| ----- | --------- | ------- |

## Page briefs

Every new page needs a complete row before `pnpm page:new` runs. The route is normalized to
`/$locale/<path>`. If the product has no secondary or auxiliary content for a page, write why.

| Route               | Core function                  | Primary action                | Above the fold                                     | Hidden by default                     | Archetype        |
| ------------------- | ------------------------------ | ----------------------------- | -------------------------------------------------- | ------------------------------------- | ---------------- |
| `/$locale/`         | Choose the next module to open | Open a module                 | Module entries and one orientation line            | Workspace detail and settings         | `dock-landing`   |
| `/$locale/hello`    | Exercise one example workflow  | Save the example interaction  | Current state and the action needed to complete it | History and secondary controls        | `dock-workbench` |
| `/$locale/settings` | Change appearance or language  | Apply the selected preference | Current preference and its options                 | Unrelated account or product settings | `dock-settings`  |

## Do and don't

Rules specific to this product.

## Delivery contract

The design is not accepted because the dev server renders or because elements exist in the DOM.
Acceptance requires the built application, the real App-hosted path, visible controls, successful
core interaction and phone/desktop review against this file. Canvas, chart and diagram output also
requires geometry and painted-pixel checks.

Use template provenance for every page. Preserve the archetype's frame, gap and padding; product
work goes inside its sections. When migrating an existing page, decide explicitly whether to keep
it, rebuild it from the matching archetype, or remove it rather than layering new styles on the old
structure.

Before implementation, the package-level design intake and current page brief must be complete.
After implementation, the normal project checks and visible interaction review apply. Screenshots
help judge the rendered result but do not replace product and information-hierarchy decisions.

## Decisions

Dated entries: what was chosen, what else was shown, and the owner's words.
