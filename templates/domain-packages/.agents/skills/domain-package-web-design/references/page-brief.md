# Page brief

Use this before every new page or structural page change. It is not a screenshot checklist; it is
the design decision the implementation must express.

## Required conversation

Ask the owner:

1. What is the page's one core function?
2. What is the primary action or decision?
3. What must be visible above the fold?
4. What is secondary and should be revealed on demand?
5. What is auxiliary and belongs on another route or settings surface?
6. Which Astryx page archetype and data shape fit?

If the package is still being designed, resolve package-level audience and visual direction first.

## DESIGN.md row

Add the result under `## Page briefs`:

| Route              | Core function           | Primary action                       | Above the fold                          | Hidden by default                      | Archetype   |
| ------------------ | ----------------------- | ------------------------------------ | --------------------------------------- | -------------------------------------- | ----------- |
| `/$locale/example` | Find or create one item | Open the selected item or create one | Search, current context, existing items | History, advanced filters, diagnostics | `dock-list` |

`page:new` fails until the normalized route has a row with all five content fields populated.

## Information budget

- One page, one job.
- One primary action; do not repeat it in the top bar and body.
- Above the fold: only the context needed to understand the job and the controls needed to start it.
- Secondary: inline disclosure, drawer, popover, or row expansion.
- Auxiliary: contextual route, More menu, settings, diagnostics, or history.
- If a capability does not help with the current job, it does not belong on this page.

## Content shape

Classify data before choosing a component:

- homogeneous records -> `List` or `Table`;
- independently enterable/actionable units -> one level of `Card`/`ClickableCard`;
- forms, page sections, and collections -> never card chrome;
- configuration/detail -> drawer/popover/sheet;
- repeated row actions -> one end-aligned `MoreMenu`;
- binary -> `Switch`;
- 2-3 named choices -> `SegmentedControl`;
- 4+ named choices -> `Selector`.

## Stop

- Stop if the core function is a list of features rather than one user outcome.
- Stop if the first screen is a tour of everything the package can do.
- Stop if the page has no explicit hidden-by-default content.
- Stop if the archetype is chosen before the information hierarchy is known.
