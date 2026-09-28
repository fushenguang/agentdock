---
roadmap-id: web-tanstackstart-template
---

## Why

The first component change covers high-frequency child controls, feedback, and navigation, but common supporting surfaces such as cards, structured forms, date/time entry, tables, file/image handling, sheets, and code display still lack a complete theme-first example and regression contract. Continuing in a bounded phase avoids both an incomplete template and an unsafe one-to-one clone of a third-party component library.

## What Changes

- Add phase-two child visual coverage for Card and ProgressBar.
- Add FormLayout and Field composition examples without creating a new form engine.
- Add DateInput, TimeInput, and Timestamp theming, localized demos, and privacy-aware copy.
- Add Table and Pagination theming and responsive examples for older-child or guardian-facing data views.
- Add FileInput, Thumbnail, and Lightbox visual coverage with guardian-boundary copy; no upload backend or tracking is added.
- Add BottomSheet/Drawer coverage using Astryx BottomSheet behavior.
- Add optional CodeBlock styling and a localized Creator-oriented example.
- Extend the existing showcase, unit tests, axe matrix, and Playwright component snapshots for every phase-two category.
- Record the reviewed mappings and explicit exclusions for reference components that should not become defaults.

## Capabilities

### New Capabilities

- `web-tanstackstart-kids-component-visuals-phase-2`: Defines the phase-two component coverage, Astryx ownership, child-safety constraints, localization, accessibility, and visual verification.

### Modified Capabilities

<!-- No main-spec capability is changed. This adds a bounded second phase to the existing component visual layer. -->

## Impact

- Extends `templates/web-tanstackstart-kids/src/components/appearance/themes/kids-base.ts` and profile theme deltas.
- Extends the localized component showcase, i18n catalogs, unit/a11y/visual tests, and template/docs reference material.
- Adds no runtime dependency and no backend behavior. File/Image demos remain fully local and do not upload or persist content.
- Keeps Astryx responsible for form fields, date/time pickers, table semantics, pagination, file input, lightbox, bottom-sheet focus/dismissal, and code-block copy behavior.
- Requires regenerated Astryx theme artifacts, `pnpm check:full`, and `openspec validate --strict`.

## Non-goals

- One-to-one reproduction of all 35 `animal-island-ui` component directories.
- Adding `animal-island-ui`, `naive-icons`, their source, assets, fonts, or runtime dependencies.
- Copying global cursor replacement, typewriter animation, or countdown pressure mechanics into the default child template.
- Building a custom form-state engine, upload backend, media storage, analytics, advertising, or child social features.
- Changing profile cookies, data-layer contracts, authentication, or guardian-gate semantics.
