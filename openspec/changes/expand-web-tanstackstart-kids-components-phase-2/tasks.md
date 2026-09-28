## 1. Phase-Two Theme Coverage

- [x] 1.1 Extend shared theme targets for Card, ProgressBar, FormLayout/Field, DateInput, TimeInput, Timestamp, Table, Pagination, FileInput, Thumbnail, Lightbox, BottomSheet, and CodeBlock.
- [x] 1.2 Add Sprout/Explorer/Creator size and density deltas for the phase-two controls without duplicating shared styles.
- [x] 1.3 Preserve the existing Button hard-shadow and ProgressBar track/fill correction.
- [x] 1.4 Regenerate all Astryx theme artifacts.

## 2. Localized Showcase And Composition

- [x] 2.1 Add English and Simplified Chinese copy for all phase-two examples.
- [x] 2.2 Add Card and Progress examples.
- [x] 2.3 Add FormLayout and Field composition examples.
- [x] 2.4 Add DateInput, TimeInput, and Timestamp examples with privacy-aware copy.
- [x] 2.5 Add Table and Pagination examples with responsive labels.
- [x] 2.6 Add local-only FileInput, Thumbnail, and Lightbox examples with guardian-boundary copy.
- [x] 2.7 Add BottomSheet/Drawer examples using Astryx behavior.
- [x] 2.8 Add an optional CodeBlock example with localized title and code semantics.

## 3. Tests And Accessibility

- [x] 3.1 Extend unit/composition tests for all phase-two categories.
- [x] 3.2 Extend the axe matrix for the phase-two showcase.
- [x] 3.3 Add keyboard/focus assertions for form, date/time, pagination, file/image, lightbox, and bottom sheet.
- [x] 3.4 Add reduced-motion and no-JavaScript SSR assertions for phase-two content.
- [x] 3.5 Verify locale key parity and no missing phase-two copy.

## 4. Visual And Reference Evidence

- [x] 4.1 Extend per-component Playwright snapshots for all phase-two categories across three profiles and light/dark.
- [x] 4.2 Update full-page visual baselines for the navigation/content changes.
- [x] 4.3 Update template documentation with phase-two ownership, safety exclusions, and evidence.
- [x] 4.4 Verify no forbidden runtime dependency, copied source, global cursor behavior, countdown pressure, or typewriter default was added.

## 5. Final Verification

- [x] 5.1 Run `pnpm theme:check`, `pnpm assets:check`, and `pnpm boundaries:check`.
- [x] 5.2 Run `pnpm check:full` and resolve all failures within scope.
- [x] 5.3 Run `openspec validate expand-web-tanstackstart-kids-components-phase-2 --strict`.
- [x] 5.4 Run documentation parity and confirm no push or automatic archive.
