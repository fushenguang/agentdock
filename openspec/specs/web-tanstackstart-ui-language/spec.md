# web-tanstackstart-ui-language Specification

## Purpose

Define the embedded-App-panel UI contract for `templates/web-tanstackstart` so a project scaffolded
with the CLI starts from the accepted design and interaction language instead of re-deriving it.

## Requirements

### Requirement: Embedded App panel environment

The template's UI guidance MUST state that the same Web runs in three first-class places: the
TheFoolAI desktop App, where the package Web is the main surface; the mobile App's WebView on a
phone with touch; and a standalone browser. Phone (390x844), desktop (1440x900), and the narrowest
supported width (360px) MUST be explicit design targets. Widths MUST use container queries rather
than viewport queries, and layouts MUST NOT introduce horizontal scrolling at any supported width.

#### Scenario: Agent reads the environment before building UI

- **WHEN** an agent or developer reads `DESIGN.md`, `LLM.md`, or `AGENTS.md` in a generated project
- **THEN** it states that phone and desktop are first-class surfaces and points to
  `astryx docs dock-environment`

#### Scenario: Layout holds at panel widths

- **WHEN** a page renders at 390x844 and 1440x900
- **THEN** no horizontal scrolling appears, and width-dependent behavior follows container queries

### Requirement: Shared layout primitives

The template MUST provide `PageContainer` (container-query density plus an `isFullHeight` mode),
`PageTopBar`, `PageShell`, `SideDrawer`, `HorizontalFields`, `BottomNav` and `TemplateShell` under
`src/components/layout/`, exported from its `index.ts`. `TemplateShell` MUST be a container-query root
(`container-type: inline-size`) rendering a bottom navigation bar. The template MUST NOT keep a
`TopNav` shell or a `PageHeader` "title + description + actions" pattern.

#### Scenario: Second-level page composes the primitives

- **WHEN** a page composes `PageShell`
- **THEN** it renders a `PageTopBar` and exactly one content region in a single flex column with a
  fixed `2rem` gap, the page itself does not scroll, and only the content region scrolls

#### Scenario: Horizontal fields keep short labels beside the control

- **WHEN** a short label (≤4 characters) is paired with a plain input or select inside
  `HorizontalFields`
- **THEN** the label sits left of the control in a grid of `auto` and `minmax(0, 1fr)`, re-applied
  below the framework's 480px collapse, and long labels or text areas stay stacked

### Requirement: Drawer interaction contract

`SideDrawer` MUST render from the end side with a transparent `::backdrop`, MUST NOT close on an
outside click, MUST close on its own close control or Escape, and MUST keep a width of 420 capped to
the viewport so it is panel-wide on a narrow panel.

#### Scenario: Drawer edits while the page stays visible

- **WHEN** a drawer is open beside its page
- **THEN** the page behind it is not dimmed, a click outside the drawer does not dismiss it, and its
  own close control or Escape dismisses it

### Requirement: Page composition judgement calls

`DESIGN.md` and `LLM.md` MUST state that: the page holds the thing itself while configuration, forms
and secondary detail go into a drawer or a trigger-anchored popover; rarely used or destructive
actions go into one end-aligned `MoreMenu` with icon + text items; grouped rarely-edited content is a
`Collapsible` with `chevronPosition="start"` and explicit `defaultIsOpen`; a named choice set is a
`Selector`, a binary is a `Switch`, a multi-pick is a `CheckboxList`; a list MUST key on a stable id
rather than editable content.

#### Scenario: Agent builds a row action group

- **WHEN** an agent needs several secondary or destructive actions on a row
- **THEN** the guidance directs it to a single `MoreMenu` with `alignment="end"` and icon + text items
  rather than several buttons across the row

#### Scenario: Agent edits a list of inputs

- **WHEN** an agent renders an editable list
- **THEN** the guidance requires a stable id key, and the sample uses one, so typing does not remount
  the row and drop focus

### Requirement: Card restraint

The design contract MUST state that a page is composed of `Section` + `Divider` + `List`/rows, that
card chrome is the exception rather than the frame, that it is never nested, and that it is allowed
only for a discrete, independently enterable or actionable unit. The template's demo surface MUST
demonstrate this by not stacking cards as its page structure.

#### Scenario: Reviewer audits the demo for card usage

- **WHEN** a reviewer inspects the generated template's demo pages
- **THEN** the first-level landing shows module entries and the second-level page shows unframed content
  directly on the page background (no card frame; see `remove-web-tanstackstart-page-frame`)

### Requirement: Settings Surface for global controls

The template MUST provide a `/$locale/settings` first-level route using a section-navigation surface
whose panel scrolls while the navigation stays, and it MUST host the appearance and language controls
there rather than in a shell top bar.

#### Scenario: User changes appearance or language without a top bar

- **WHEN** a user opens the settings route
- **THEN** the appearance and language controls are reachable, the section navigation does not scroll
  away with the panel, and switching language preserves path, query string and hash

### Requirement: Agent-facing documentation stays in sync

`DESIGN.md`, `LLM.md` and `AGENTS.md` MUST document the new primitives and the shortest path to use
them, and the template documentation site MUST be updated in both supported locales at matching file
lists.

#### Scenario: Documentation parity holds

- **WHEN** the template documentation parity check runs
- **THEN** the English and Simplified Chinese template docs have identical file lists and meta page
  lists

### Requirement: No page-level card frame

`PageShell` MUST NOT draw a rounded, bordered, card-background surface around page content and MUST
NOT expose a prop that enables one. Second-level pages MUST be structured with headings, spacing,
dividers, tabs and tables. A card MUST be used only for a genuinely independent interactive unit and
MUST NOT wrap a whole page or a section. `DESIGN.md`, `LLM.md`, `AGENTS.md` and the template docs
MUST NOT prescribe a content frame.

#### Scenario: Generated second-level page

- **WHEN** a project is scaffolded and its second-level demo page is rendered
- **THEN** the page content sits directly on the page background with no border, radius or card
  surface around it, the page itself does not scroll, and only the inner content region scrolls

#### Scenario: Agent reads the design guidance

- **WHEN** an agent reads `DESIGN.md`, `LLM.md` or `AGENTS.md`
- **THEN** none of them instruct wrapping a page or section in a card or frame, and the Skeleton
  rule states that cards are reserved for independent interactive units

### Requirement: Page provenance tracks the installed Astryx version

Every component page produced by the template MUST carry an `astryx-template` provenance marker whose
`astryx:` value equals the installed Astryx CLI version. `pnpm check:pages` MUST fail when a marker
is stale, naming both the expected and recorded versions.

#### Scenario: Astryx upgrade leaves a stale page marker

- **WHEN** the installed Astryx version differs from a page marker's `astryx:` value
- **THEN** `pnpm check:pages` fails with the expected installed version and the recorded version

#### Scenario: Generated sample pages remain current

- **WHEN** a project is generated from the template and the dependency lock is current
- **THEN** the sample pages' markers match the installed Astryx CLI version
