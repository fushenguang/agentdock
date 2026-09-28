---
roadmap-id: web-tanstackstart-template
---

## Why

AgentDock needs a first-class web template for products built for children. The existing `web-tanstackstart` template is an enterprise application baseline; changing only its theme cannot deliver the required low cognitive load, age-sensitive interaction rules, multimodal feedback, content tone, safety boundaries, and emotional visual language.

`animal-island-ui` is useful as a design reference, not as the runtime foundation. Its current v2.0.0 is MIT, but its history includes a real Nintendo DMCA remediation, and its React package is a light-only, independent component system with global CSS, globally scoped cursor behavior, large font assets, limited SSR evidence, and a component model that would conflict with Astryx. The template should preserve Astryx as the component and interaction kernel while independently designing a child experience layer.

## What Changes

- Add a new `web-tanstackstart-kids` template that shares the TanStack Start, React 19, Vite, Drizzle, SQLite/Supabase, i18n, SSR, and Astryx substrate with `web-tanstackstart`.
- Add a first-party Child Experience System:
  - prebuilt Astryx theme variants for the child-friendly visual language;
  - configurable age bands such as Sprout, Explorer, and Creator;
  - semantic capability profiles for touch target size, density, choice count, reading support, motion, navigation depth, confirmation policy, and feedback style;
  - first-party visual components for friendly backgrounds, cards, headings, illustrations, progress, empty/loading/error/success states, and other child-facing patterns.
- Keep Astryx component behavior and accessibility mechanisms authoritative. Do not fork or patch Astryx internals; use themes, `xstyle`, wrappers, providers, and supported extension points.
- Add age-aware content and interaction guidance covering short copy, icon-plus-text pairing, non-punitive errors, optional audio, captions, reduced motion, large targets, reversible destructive actions, and low-pressure progress.
- Add privacy, safety, and ethics requirements for child-facing templates, including coarse age profiles without storing precise birth dates, no default third-party tracking or advertising, parental gates for external or consequential actions, and no manipulative engagement mechanics.
- Add template documentation and agent guidance so generated projects can extend age bands, themes, components, and content without falling back to a generic enterprise UI.
- Add comprehensive verification: unit tests for profile resolution, SSR/hydration checks, responsive and visual regression coverage, accessibility checks, reduced-motion checks, and documentation parity.
- Record `animal-island-ui` as a design reference with its provenance, license status, DMCA remediation context, and the specific ideas adopted or rejected; do not add it as a runtime dependency.

## Capabilities

### New Capabilities

- `web-tanstackstart-kids-experience`: Defines the child experience model, visual language, age profiles, interaction and content policies, safety/accessibility constraints, and Astryx integration contract.
- `web-tanstackstart-kids-template`: Defines the standalone child-oriented template package, its information architecture, theme and experience wiring, components, documentation, CLI registration, and verification.

### Modified Capabilities

No existing capability requirements are modified. This introduces a dedicated child template instead of changing the existing enterprise template's requirements.

## Impact

- Adds `templates/web-tanstackstart-kids/` with package metadata, Astryx theme artifacts, child experience providers, first-party visual components, routes, tests, agent documents, and design documentation.
- Adds or updates generated CLI template registry metadata and template documentation in `apps/docs`.
- Reuses the existing TanStack Start and Drizzle patterns without changing their core behavior.
- Adds no `animal-island-ui` runtime dependency. Any future first-party illustration or icon assets must have original provenance and license records.
- Does not modify Astryx source, existing `web-tanstackstart` behavior, root dependencies, deployment contracts, or child data/backend systems.

## Non-goals

- Pixel-for-pixel reproduction of `animal-island-ui`, Animal Crossing, or any third-party game interface.
- Importing, vendoring, or depending on `animal-island-ui`, `naive-icons`, or its historical assets as part of the template runtime.
- Forking, swizzling, or modifying Astryx core components or accessibility behavior.
- Implementing child accounts, parental consent, backend profile storage, content moderation, payments, advertising, or analytics in this change.
- Providing medical, developmental, educational, or legal certification for a particular age range.
- Replacing or redefining the existing enterprise `web-tanstackstart` template.
