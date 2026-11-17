# External design reference roles

Use these references selectively. They inform the design; Astryx and the approved package contract
decide the implementation.

## Stitch

Use for zero-to-one direction exploration: high-level visual directions, first-screen compositions,
and a candidate design system. Export the chosen rules into `DESIGN.md`.

Do not use it as the component library or as evidence that a page is usable.

## Taste Skill

Use to establish aesthetic constraints and references before generation. It is useful for avoiding
generic AI composition and for making the page belong to its product.

Do not copy its company-site template, licensed media, or signature effects into a domain package.
License: MIT.

## UI UX Pro Max

Use as a queryable design-knowledge source for information architecture, accessibility, responsive
behavior, and interaction rules. Its design-system suggestions are candidates only.

Do not let its generated palettes, stack recommendations, or style recipes override Astryx.
License: MIT.

## Impeccable

Use on an existing page or after a first implementation for critique, audit, hierarchy, and polish.
It is especially useful when comparing sibling pages or diagnosing inconsistent spacing and visual
weight.

Do not use it as the initial product model or install its rewrite hooks as an automatic package
policy. License: Apache-2.0.

## Astryx

Astryx is the implementation authority for components, props, tokens, themes, templates,
accessibility, and responsive primitives. Use the installed CLI and integration docs before writing
UI.

If external advice conflicts with Astryx or the approved `DESIGN.md`, keep the conflict as a design
note and implement the Astryx-owned version.
