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

## Layout

- Mobile-first; minimum supported viewport is 320px.
- Prefer spacing and hierarchy over decorative containers.
- Use cards only for discrete, independently actionable units.
- Keep controls at least 44px in touch contexts.
- Avoid nested cards, gradient headline text, excessive pills, and decorative icon tiles.
- Ensure keyboard focus is visible and semantic headings remain ordered.

## Component Rules

- Use Astryx controls before creating primitives.
- A wrapper component should add layout or product semantics, not restyle a control's internal implementation.
- Keep StyleX definitions near the component and compose multiple style objects with `stylex.props`.
- Loading, empty, error, disabled, and success states are part of the component contract.

## Review

Before finishing a UI task:

1. Inspect the rendered result at mobile and desktop widths.
2. Check the layer/token rules above.
3. Run keyboard navigation through interactive elements.
4. Run the `impeccable` skill for critique and polish when the change is non-trivial.
