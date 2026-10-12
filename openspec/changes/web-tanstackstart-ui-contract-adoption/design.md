## Context

The template is scaffolded by `pnpm init:web <package-id>` inside the TheFoolAI domain-packages
repository (see `standards/web-scaffold/SPEC.md`), which locks the template id and the flags but says
nothing about the UI. The reference product (`apps/my-career-web`) has an owner-accepted UI that the
template does not share, so today a freshly scaffolded package starts from a different skeleton and
re-derives every UI decision.

The environment is the deciding constraint:

- The Web is **embedded in the TheFoolAI App's right-hand panel** and is the **auxiliary workbench of
  the App's coding agent**. It is not a standalone marketing site and not a wide desktop dashboard.
- The panel is the design target: default **~380px**, hard minimum **360px** (below that the host does
  not render it). **Width is the scarcest resource** and responsiveness is an acceptance criterion,
  not a nicety. Wider-than-panel rendering is an enhancement, never the target.
- The reader is a human and an AI agent, so the interface must be legible from the DOM/source too:
  stable ids, semantic headings, real controls instead of decorative chrome.

## Goals / Non-Goals

**Goals:**

- Make a freshly scaffolded package "look and behave like the accepted product" by default.
- Port the accepted primitives verbatim, without downgrading them into a second, weaker dialect.
- Encode the interaction judgement calls so an agent can build a second-level page unaided.
- Keep the template Astryx + StyleX only, with no new runtime dependencies.
- State the embedded-App-panel environment so the rules are self-explaining.

**Non-Goals:**

- Bringing the reference product's business domain, images or data model into the template.
- Redesigning the data layer, feature boundaries, or the generated route tree.
- Building a full seven-section settings product; the settings route is the minimum surface that
  gives the appearance/language controls a correct home once the top bar is retired.

## Decisions

### D1: Port the shell, not just the primitives

**Decision.** Replace the Astryx `AppShell` + `TopNav` shell with the accepted container-query shell:
a `TemplateShell` root with `container-type: inline-size`, a `main` flex column, and a bottom
navigation bar (`BottomNav`). Replace `PageContainer` with the container-query version that gains an
`isFullHeight` mode.

**Why.** The one-screen skeleton is not separable from the shell. `PageContainer`'s density comes from
`@container` queries, its full-height mode is capped against the shell's own geometry, and the
bottom navigation is what makes the panel-as-workbench shape work. Porting `PageShell` alone onto an
`AppShell` that owns its own padding and top bar would produce a half-port: the skeleton would claim
a fixed `2rem` gap and container breakpoints that the shell does not actually provide.

**Alternative rejected.** Keep `AppShell` + `TopNav` and adapt the skeleton to it. This leaves the
generated Web visibly different from the accepted product, keeps a top bar that spends a row on
navigation in a ~380px panel, and forces the skeleton's numbers to be re-derived. It is the exact
"two dialects" outcome this change exists to remove.

**Consequence.** `TopNav` was the home of the appearance and language controls, so D2 adds them a
real surface rather than dropping the features.

### D2: A settings route hosts global controls

**Decision.** Add `/$locale/settings` as a first-level route using the Settings Surface skeleton
(section navigation + a single scrolling panel). It hosts the appearance and language controls.

**Why.** Once the top bar is gone, global preference has to live somewhere; the accepted product's
answer is a settings destination, and the Settings Surface (panel scrolls, nav stays) is itself part
of the contract being adopted, so the route doubles as the live sample for it.

**Alternative rejected.** Keep a floating control strip in the shell. That re-introduces the row the
shell exists to avoid and gives configurable preference two competing homes.

### D3: Cards are the exception, and the demo must show that

**Decision.** `DESIGN.md` states — and the demo demonstrates — that a page is `Section` + `Divider` +
`List`/rows; card chrome is allowed only for a discrete, independently enterable unit, exactly one
level deep, never nested. The demo's landing uses `ClickableCard` entries (title + one line, no
images) and its second-level page uses a plain framed content region, not a stack of cards.

**Why.** "The first screenful answers what do I do now" and "fewer, larger surfaces beat many small
boxes" are the owner's tie-breakers. A template whose only sample is "a page header plus a card"
teaches the opposite, so the sample has to carry the rule.

### D4: The drawer, disclosure and overflow-menu calls are normative

**Decision.** Encode as normative rules: the page holds the thing itself while configuration, forms
and secondary detail go into a right-hand `SideDrawer` (`MobileNav side="end"`, `::backdrop`
transparent, outside click does **not** close, width 420 capped to the viewport) or a
trigger-anchored popover; grouped rarely-edited content is a `Collapsible` with
`chevronPosition="start"` and explicit `defaultIsOpen`; rarely used or destructive actions go into one
`MoreMenu` with `alignment="end"` and icon + text items.

**Why.** These are the calls that a headless agent gets wrong by default (three buttons across a row,
a modal that dims the thing being edited, fields expanded by default). Writing them in `DESIGN.md`
and `LLM.md` is the cheapest way to make the generated Web behave like the accepted product.

### D5: Controls follow the value's shape

**Decision.** A named choice set is a `Selector` dropdown, a binary is a `Switch`, a multi-pick is a
`CheckboxList`; short labels (≤4 characters) with plain inputs/selects read across via
`HorizontalFields` (`label auto` / control `minmax(0, 1fr)`), while text areas and long labels stay
stacked. Lists key on stable ids, never on editable content.

**Why.** These are subtle but observable: a dropdown versus a row of pills changes the panel's
height, and a content-derived key remounts a row on the first keystroke and drops input focus.

### D6: Documentation is part of the deliverable

**Decision.** `DESIGN.md` carries the merged contract (conflicting old rulings deleted, not
duplicated); `LLM.md` and `AGENTS.md` carry the shortest path for using the primitives; the docs site
is updated in both locales.

**Why.** The template's product is the _guidance_ as much as the code — an agent that never opens
`DESIGN.md` still has to be steered by `LLM.md` and the shell's own conventions.

## Risks / Trade-offs

- **The shell swap changes the template's navigation model.** `TopNav` disappears, so anything that
  relied on it (docs, screenshots, tests) must be updated. Mitigation: the settings route preserves
  every feature the top bar exposed.
- **The full-height cap is a magic number** derived from the bottom bar height and `main` padding. It
  must be verified at 380px and 900px in both locales, four themes, and light/dark; horizontal
  scrolling must be absent at both widths.
- **The drawer is a native `<dialog showModal>`.** It needs an SSR/hydration check and must keep its
  no-scrim / no-outside-close behaviour.
- **The template's own gates differ from the repo gates** (`oxfmt`, `oxlint --type-aware`, `vitest`,
  `vite build`), so template-side verification is an end-to-end scaffold run, not the repo `pnpm
check` alone.

## Migration Plan

1. Land the primitives and the shell behind the existing routes; keep routes compiling.
2. Convert the demo to the landing + second-level + settings shape.
3. Merge the design contract and the agent guidance; update the docs site.
4. Add the `@cogito.ai/cli` changeset.
5. Verify with the repo gates and a real end-to-end scaffold, then hand to the owner for preview.

## Open Questions

- None blocking. The settings route and the retirement of `PageHeader` were confirmed by the owner as
  part of accepting the full-port approach.
