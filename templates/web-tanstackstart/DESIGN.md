# Design System Contract

This template uses Astryx as the component and token foundation and StyleX as the first-party styling engine. UI changes must remain legible to agents and consistent with enterprise internal applications.

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

- Mobile-first; minimum supported viewport is 320px.
- Prefer spacing and hierarchy over decorative containers.
- Use cards only for discrete, independently actionable units.
- Keep controls at least 44px in touch contexts.
- Avoid nested cards, gradient headline text, excessive pills, and decorative icon tiles.
- Ensure keyboard focus is visible and semantic headings remain ordered.

## Component Rules

- Use Astryx controls and layout primitives before creating or hand-rolling a component.
- Prefer `Stack`, `Grid`, `Section`, `List`, `EmptyState`, `Center`, `Timestamp`, and other native Astryx components over raw `div`, `header`, `section`, `ul`, `ol`, `li`, `p`, or `time` structures.
- A custom wrapper must exist for a repeated project convention or semantic boundary, and its internals must delegate to Astryx primitives rather than reimplement layout or interaction behavior.
- A wrapper component should add layout or product semantics, not restyle a control's internal implementation.
- Keep StyleX definitions near the component and compose multiple style objects with `stylex.props`.
- Loading, empty, error, disabled, and success states are part of the component contract.

## Review

Before finishing a UI task:

1. Inspect the rendered result at mobile and desktop widths.
2. Check the layer/token rules above.
3. Run keyboard navigation through interactive elements.
4. Run the `impeccable` skill for critique and polish when the change is non-trivial.
