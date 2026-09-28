## Context

See `proposal.md` and the phase-two spec for requirements. Phase one already established the theme-first pattern, `KidTitleRibbon`, `KidBackground`, the localized showcase, and the profile/mode visual matrix.

Astryx 0.6 already owns the phase-two behavior and exposes stable targets for the selected components. Astryx does not need a custom form engine, date picker, table implementation, file uploader, lightbox, bottom sheet, or code syntax engine. The design therefore extends the existing theme and showcase rather than creating a second component library.

## Goals / Non-Goals

**Goals:**

- Complete the common supporting-surface visual layer with Astryx-owned behavior.
- Keep phase-two examples localized, profile-aware, light/dusk-safe, and child-safe.
- Add per-category visual evidence without increasing runtime dependencies.
- Document which animal-island-ui patterns remain product-specific or excluded.

**Non-Goals:**

- Literal parity with every animal-island-ui component.
- Backend upload, image persistence, media storage, analytics, or child tracking.
- A custom form state/validation engine.
- Global cursor replacement, typewriter animation, or countdown pressure patterns.
- Exact reproduction of third-party code, assets, or layout structure.

## Decisions

### 1. Map phase-two categories to existing Astryx owners

| Phase-two category | Astryx owner                           | Strategy                                                                  |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------- |
| Card               | `Card`                                 | Theme targets and localized showcase; already part of shared theme.       |
| Progress           | `ProgressBar`, `KidProgress`           | Preserve track/fill correction; add showcase and regression coverage.     |
| Form               | `FormLayout`, `Field`, existing fields | Compose layout and validation states; do not create a form engine.        |
| Date/time          | `DateInput`, `TimeInput`, `Timestamp`  | Theme fields; examples avoid birth-date/precise identity semantics.       |
| Table              | `Table`                                | Theme table parts and use data-driven server-safe columns where possible. |
| Pagination         | `Pagination`                           | Theme controls and localize the accessible label.                         |
| File/image         | `FileInput`, `Thumbnail`, `Lightbox`   | Local-only example, guardian-boundary copy, no upload backend.            |
| Sheet/drawer       | `BottomSheet`                          | Theme surface; Astryx owns focus trap, dismissal, and modality.           |
| Code               | `CodeBlock`                            | Optional Creator-oriented theme and localized title/example.              |

Alternatives considered:

- **Create custom wrappers for every reference component.** Rejected: duplicates behavior and would drift from Astryx a11y.
- **Skip all remaining components.** Rejected because common form, table, file, and sheet surfaces are needed for a complete template.
- **Copy animal-island-ui implementations.** Rejected by provenance, accessibility, SSR, and maintenance constraints.

### 2. Extend the shared theme, not the component behavior

Add component targets to `kidsBaseTheme` for the phase-two Astryx classes, then add profile-specific size/density deltas only in the three profile themes. Keep form, date/time, table, pagination, file, lightbox, bottom-sheet, and code interactions untouched.

### 3. Use local-only media demos

The file/image demo uses a generated in-memory `File` or data URL only for preview and never calls an upload API. The visible copy explains the guardian boundary. No persistence, network fetch, analytics, or backend route is added.

### 4. Extend verification by reusing the current matrix

Add phase-two sections to `KidComponentsPage`, include them in unit/a11y coverage, and extend the same Playwright component snapshot loop. This keeps one source of truth and avoids a parallel test harness.

### 5. Explicitly exclude unsafe reference patterns

`Cursor`, `Countdown`, and `Typewriter` are not added as default components. `BackTop` remains a product-only navigation pattern. `Footer` is covered by layout composition rather than a new primitive. This is documented in the template reference and the change design.

## Risks / Trade-offs

- [Date/time demos imply scheduling or identity collection] → Keep examples neutral and local, and document the guardian/privacy boundary.
- [File demos accidentally simulate an upload backend] → Keep all media local and make the absence of server behavior explicit.
- [Table/pagination visuals become too dense for younger profiles] → Keep examples primarily Creator/guardian-facing and use profile size/density deltas.
- [BottomSheet focus behavior is hard to test in jsdom] → Unit-test composition and use Astryx behavior plus browser axe/visual checks for the surface.
- [CodeBlock is developer-facing rather than child-facing] → Mark it optional and keep it in a Creator-oriented example.

## Migration Plan

1. Extend shared/profile theme targets and regenerate artifacts.
2. Add localized phase-two copy and showcase sections.
3. Add unit, axe, SSR, reduced-motion, and visual coverage.
4. Run the template full gate and strict OpenSpec validation.

Rollback is source-level: remove phase-two sections/components and regenerate themes. No data or persistence migration exists.
