# Design System Contract

This template uses Astryx as the component and token foundation and StyleX as the first-party styling engine. UI changes must remain legible to agents and consistent with enterprise internal applications.

## Product Stance

The look we are aiming for: **clean, simple, easy to pick up; a clear information hierarchy; nobody should open a page and feel it is "hard".** When a rule below is ambiguous, this stance is the tie-breaker:

- **One page, one job.** A first-level route is an index; the work happens one route deeper. A page that needs more than a screenful of explanation needs sub-routes, not more copy.
- **Hierarchy over decoration.** Section headings + `Divider` + spacing carry structure; card chrome, shadows and borders are the exception, and card chrome never nests inside card chrome.
- **The first screenful answers "what do I do now"** and shows the primary action as a control, not as a paragraph. Secondary detail belongs behind a disclosure or on its own route.
- **Fewer, larger surfaces beat many small boxes.** If a screen reads as a wall of boxes, the fix is fewer boxes, not tighter boxes. A page is `Section` + `Divider` + `List`/rows; reaching for a `Card` is the exception and has to be justified by the rule below.
- **Labelling is a cost.** Every standing label, counter or tip must earn its line; default to the wording that a first-time user needs and cut the rest.

## Environment

**This Web is embedded in the TheFoolAI App's right-hand panel and is the auxiliary workbench of the App's coding agent.** It is not a standalone site and not a wide desktop dashboard. Everything below follows from that:

- The panel is the design target: default **~380px**, **hard minimum 360px** (the host clamps at 360 and does not render the panel below that). Wider than the panel is an _enhancement_, never the target.
- **Screen width is the scarcest resource**, and the panel is short too — it shares the window with the agent. Vertical space is spent the same way width is, so navigation, chrome and standing copy all have to justify themselves.
- Mouse and keyboard are the normal input; touch is rare. Minimum pointer target is 32px (44px only where a touch surface is plausible), and keyboard focus must stay visible.
- The readers are a human **and an AI agent** working in the same panel, so the interface must be legible from the source as well as the pixels: semantic headings, stable ids, and real controls instead of decorative chrome.

## Sources Of Truth

1. Astryx component APIs and semantics.
2. Astryx CSS variables and theme tokens.
3. `src/styles/app.css` layer ordering.
4. `src/components/**` StyleX styles.
5. This document for product-level hierarchy, density, and interaction rules.

## CSS Layers

The required order is:

```text
reset < astryx-base < astryx-theme < product
```

Do not move first-party styles into the Astryx base layer. Do not add `!important` to win a cascade fight; fix the source or layer order instead.

## Tokens

Use Astryx variables for color, typography, spacing, radius, and elevation when available. Examples:

```ts
stylex.create({
  surface: {
    color: "var(--color-text-primary)",
    backgroundColor: "var(--color-background-surface)",
    borderColor: "var(--color-border)",
  },
});
```

Hard-coded colors are allowed only when the value is intentionally outside the design system and documented in the component.

## Themes And Color Modes

The template supports Astryx `neutral`, `butter`, `matcha`, and `stone` themes plus `system`, `light`, and `dark` color modes.

- Theme CSS must stay in `src/styles/app.css` in the documented layer order.
- Use prebuilt `/built` theme objects with their compiled `theme.css` files so SSR and first paint are stable.
- Persist selection through `AppearanceProvider`; do not create a second theme store.
- Do not branch feature styles on a theme name. Semantic Astryx tokens must adapt automatically.
- Verify all supported themes in light and dark modes when changing shared surfaces or component overrides.

## Localization

Application routes are locale-prefixed; Simplified Chinese (`/zh-CN`) is the default and English (`/en`) is the alternate. `src/routes/$locale.tsx` owns locale validation, Astryx `InternationalizationProvider`, and the application shell.

- Put every user-facing string in `src/i18n/messages.ts`; keep all locale catalogs at key parity.
- Resolve copy with `useTranslator()` rather than embedding product text in components.
- Use stable semantic keys; do not build sentences by concatenating translated fragments.
- Keep language names in `LOCALE_OPTIONS`; translate interface labels, not a user's language self-name.
- Preserve path, query string, and hash when switching locale.
- Check layout and text expansion at the narrowest supported width for each locale.
- Use `getLocaleDirection(locale)` for document direction.

## Layout

Rules:

- **Width is measured by the container, not the viewport.** Breakpoints come from **container queries** (the shell root is `container-type: inline-size`), so they stay correct whether the Web is a native view, an iframe, or a split pane: `<420` compact, `420–639` standard, `≥640` enhanced.
- **Never scroll horizontally.** Turn a wide table into key–value rows (`MetadataList`) or a named scrollable region; the panel has no room to pan.
- **Density follows the container**: 12px inline padding under 420px and 20px above; 16px section gap under 420px and 24px above. Do not hard-code desktop paddings or a fixed 1200px max width.
- **Module cards form one row, not a wall.** From a 600px container the entries sit side by side in one row — two entries are two columns, three or four are three columns, and a 2 + 1 orphan row is never produced (it reads worse than stacking). It is a container-query grid, not `Grid columns={{ minWidth }}`. Content is capped at 44rem, relaxed to 56rem from 960px so a full-width browser row still breathes (a card grid is not a text column).
- **One-screen skeleton for every second-level page.** A second-level page puts its `PageTopBar` and its content in **one flex column with a fixed `2rem` gap** (the gap is owned by that column, never inherited from `PageContainer`'s responsive 16/24px page gap). The **page itself does not scroll**; scrolling happens only inside the content container, so the top bar (and, on Settings, the section nav) never scrolls away. `PageShell` is the shared implementation, and `PageContainer isFullHeight` is what makes it possible.
- **Vertical first.** Long pages get disclosure (`Collapsible` / `TabList`) and sub-routes rather than one continuous scroll. Secondary detail belongs on a `$id` page, in a sheet, in a drawer, or in a dialog.
- **One page, one job.** A first-level route shows at most a one-line purpose, an optional "how this works" disclosure, and the module entries that lead to its sub-pages.
- **No repeated page titles.** A first-level route does not print its bottom-navigation name as a visible heading; keep a `VisuallyHidden` `h1` for accessibility. Sub-pages use their own functional `h1`, which `PageShell` renders visually hidden because the top bar already carries the way back.
- **Cards are the exception, not the frame.** Never wrap a whole form, list or page section in a `Card`; use `Section` + `Divider` + `List` / rows / `MetadataList` for those. Card chrome is allowed only where the unit is _independently enterable or actionable_, exactly one level deep:
  - **module-entry cards** on a first-level route (`ClickableCard`, one per module, compact `padding={3}`, title + one line), and
  - a discrete record awaiting a decision.
    Keep the list of module cards short (2–4) and inside one screen; if a page needs more, it needs sub-routes instead. Card-in-card is always wrong.
- **One-line orientation, not standing instructions.** A first-level route carries at most one line of copy (`Blockquote`) plus its module entries. Long "how to use" blocks do not belong on a route — the flow should be self-evident from the module titles. The same discipline applies inside a page: delete a paragraph that merely introduces a section.
- Ensure semantic headings remain ordered (exactly one `h1` per page, visually hidden when the title would duplicate navigation).

## Settings Surface

Settings/preferences pages follow the Astryx `settings-dialog` template's information design (`pnpm exec astryx template settings-dialog` writes the reference page; we do not copy its code):

- **The page does not scroll; the section panel does.** With the shell on `isFullHeight`, the section nav (a vertical `SideNav`, or a horizontal `TabList` when narrow) stays put and only the panel column scrolls, so a long section does not carry the nav off screen.
- **Section navigation + one section at a time.** The nav is a vertical `SideNav` from a 640px **container** and a horizontally scrollable `TabList` (`hasDivider`) below it — keyed to the container, since the panel is the screen here. A settings surface this small does not need a search box.
- **The nav column owns its width (13rem).** `SideNav` ships a 260px root width; a column narrower than that must pin it back (`xstyle={{ width: "100%" }}`) or the nav bleeds over the content column. The group header is an `aria-labelledby`, so it is helper text, not chrome: pass the `SideNavSection` title with `isHeaderHidden` rather than dropping it.
- **A panel does not repeat the section name.** The navigation directly above already says it, so the panel goes straight to its rows — a heading only when the panel carries more than the row group. A group is one subject and carries no explanatory second sentence; the explanation belongs on the row it qualifies. (Owner copy discipline: a repeated title is noise.)
- **A row is icon + name + description on the left, its control on the right.** The icon is **required** on every row so titles share one vertical line, the row's name is more specific than the section's, and a value-bearing control reports the **current value** (the theme, the language) rather than repeating that name — no word is printed twice.
- **Rows stack together, at one width**: `@container (max-width: 480px)` flips every row on the panel to a single column. Never let rows wrap on their own contents — rows that break separately read as a bug rather than as one layout changing.
- **Pick the control from the value's shape**: on/off → `Switch`; 2–3 named choices → `SegmentedControl`; 4+ → `Selector`; number → `NumberInput`; free text → `TextInput`; an action rather than a value → `Button`. Content that cannot fit beside the row (a textarea, a preview) goes in the row's `detail`, not as a following sibling.
- **Icons come from the package registry** (`src/components/settings/settings-icons.tsx`, namespaced `appdock:*` keys registered through Astryx `registerIcons`) — no icon dependency.

## Second-Level Pages (one-screen skeleton)

Every second-level page follows the same skeleton and the same judgement calls. The template's reference page is `/$locale/hello`.

**Shell exception — Settings.** `/$locale/settings` is a first-level bottom-navigation destination (no back link, no page-level action), so it does not use `PageShell`: it keeps the **Settings Surface** skeleton, where the section nav plays the top bar's role and only the panel scrolls. The one-screen discipline itself is unchanged — the page does not scroll.

**Skeleton.** `PageShell` renders `PageContainer isFullHeight` → `h1` (`VisuallyHidden`) → a column with `gap: 2rem` → `PageTopBar` (way back on the left, this page's action on the right) → a content body that scrolls, sitting directly on the page background. **A secondary page is never wrapped in a card** — no rounded, bordered, card-background surface around page content, and `PageShell` has no frame or opt-in prop for one. Structure comes from headings, spacing, dividers, tabs and tables. `Card` is reserved for a genuinely independent interactive unit, never a page or section wrapper.

**What goes on the page vs. in a drawer.** The page holds the thing itself — the list, the queue, the question, the record. Anything that is _configuration_, _a form_, or _secondary_ goes into a right-hand `SideDrawer` (`MobileNav side="end"`, no scrim, does not close on an outside click, closes on its own icon or Escape) or a trigger-anchored `Popover`. One drawer per action; the trigger lives in the top bar (page-level) or in the section header (section-level). Because the drawer does not dim the page, the thing it configures stays visible while it changes — that is the point of the no-scrim rule, and it is why a drawer is preferred over a modal here.

**Sections.** A page with more than one subject is a stack of sections separated by `Divider` (`variant="subtle"`), each `Heading level={2}` with its add action on the same row (`justify-content: space-between`). An empty section is **one line of text**, not a centred `EmptyState` — the `EmptyState` is reserved for a page whose whole purpose is empty.

**Row actions.** The recurring decision stays visible as a control; everything rare or destructive goes into one end-aligned `MoreMenu` with **icon + text** items. Never lay three buttons across a row.

**Controls follow the value's shape.** Any named set is a `Selector` dropdown, never a row of pill buttons. A binary is a `Switch`. A multi-pick is a `CheckboxList`, not a button wall.

**Short labels read across.** `HorizontalFields` (label left, `minmax(0, 1fr)` control right) for labels ≤4 characters with plain inputs and selects. `TextArea`s and long labels stay stacked, and a `Switch` stays on its own line — its label travels with the track, so it cannot join the shared label column.

**Copy discipline — which sentence to cut.** Delete the standing paragraph that introduces a section; a first-time user learns the model from the controls themselves. Keep the one line that is _attached_ to a thing: the value's own `status` (a caveat about the current value), a field's `description` (a format hint or rule), an option's `description`, or the inside of a `Collapsible`. Section headings that merely repeat the page name are also cut.

**Shared primitives.** `TemplateShell`, `BottomNav`, `PageContainer`, `PageTopBar`, `PageShell`, `SideDrawer` and `HorizontalFields` live in `src/components/layout/`.

**Lists key on stable ids.** Never key a row by editable content (`name + email`, `content.slice(0, 8)`) — a content-derived key remounts the row on the first keystroke and drops input focus.

**Icons the Astryx set does not ship** are registered with `registerIcons` under the package namespace (`appdock:*`) — `src/components/settings/settings-icons.tsx`. Do not add an icon dependency.

## Component Rules

- Use Astryx controls and layout primitives before creating or hand-rolling a component.
- Prefer `Stack`, `Grid`, `Section`, `List`, `EmptyState`, `Center`, `Timestamp`, and other native Astryx components over raw `div`, `header`, `section`, `ul`, `ol`, `li`, `p`, or `time` structures.
- A custom wrapper must exist for a repeated project convention or semantic boundary, and its internals must delegate to Astryx primitives rather than reimplement layout or interaction behavior.
- A wrapper component should add layout or product semantics, not restyle a control's internal implementation.
- Keep StyleX definitions near the component and compose multiple style objects with `stylex.props`.
- Loading, empty, error, disabled, and success states are part of the component contract.

## Review

Before finishing a UI task:

1. Inspect the rendered result at the narrow panel width (~380px) **and** at a wide width (900px), in both locales.
2. Check the layer/token rules above.
3. Run keyboard navigation through interactive elements.
4. Run the `impeccable` skill for critique and polish when the change is non-trivial.
