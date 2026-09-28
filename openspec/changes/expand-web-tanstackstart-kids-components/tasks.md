## 1. Source Analysis And Contract

- [x] 1.1 Record the source-analysis findings and forbidden-copy boundaries from `animal-island-ui`, `naive-icons`, and Astryx in the change design.
- [x] 1.2 Add or update template documentation that maps each phase-one child component to its Astryx owner and explains supported extension points.
- [x] 1.3 Confirm the template has no `animal-island-ui`, `naive-icons`, swizzled source, patched Astryx source, or copied Astryx implementation.

## 2. Shared Theme And Tokens

- [x] 2.1 Extend `kids-base.ts` with semantic child tokens for paper surfaces, playful accent variants, hard-bottom control depth, patterned surfaces, and state treatments in light and dark modes.
- [x] 2.2 Add supported Astryx component overrides for Button, Checkbox, Radio, Switch, TextInput, Selector, TabList, Collapsible, Token, Badge, Tooltip, Toast, Skeleton, Spinner, EmptyState, FieldStatus, Divider, Dialog, and Carousel.
- [x] 2.3 Preserve the existing Button hard-bottom shadow and ProgressBar track/fill correction while adding the shared component targets.
- [x] 2.4 Add profile-specific size/density deltas for Sprout, Explorer, and Creator without duplicating shared visual rules.
- [x] 2.5 Add reduced-motion-safe component transitions or disable decorative animation through Astryx-supported theme adaptations and the existing global media rule.
- [x] 2.6 Regenerate all Astryx theme `.css`, `.js`, `.d.ts`, and `.variants.d.ts` artifacts with `pnpm theme:build`.

## 3. First-Party Visual Wrappers

- [x] 3.1 Implement `KidTitleRibbon` as a non-interactive ribbon/cloud wrapper that renders Astryx typography and supports localized titles.
- [x] 3.2 Implement `KidBackground` as a non-interactive patterned surface using semantic tokens and original CSS/SVG-style decoration.
- [x] 3.3 Extend `KidState` for the component showcase’s empty, error, success, and loading examples without replacing Astryx semantics.
- [x] 3.4 Export the new wrappers through the child component public index and preserve the original `KidIcon` API/direction.
- [x] 3.5 Add wrapper tests for heading semantics, decorative hiding, token-based styling, and no interactive behavior.

## 4. Localized Component Showcase

- [x] 4.1 Add the complete English and Simplified Chinese copy catalog for all phase-one component demos and states.
- [x] 4.2 Add a locale-prefixed component showcase route linked from the child navigation.
- [x] 4.3 Add demos for Button, Checkbox, Radio, Switch, Input/TextInput, Select/Selector, Tabs, Collapse, Tag, Badge, Tooltip, Toast/Notification, Skeleton/Loading, and Divider.
- [x] 4.4 Add demos for Empty/Error/Success states, Title ribbon/cloud, Background/Pattern, Modal/Dialog, and Carousel.
- [x] 4.5 Ensure every demo is controlled, keyboard-operable, labelled, and rendered through Astryx for interactive behavior.
- [x] 4.6 Add stable test IDs or landmarks for component-level snapshots without exposing test-only UI to child flows.

## 5. Unit And Accessibility Coverage

- [x] 5.1 Add unit tests for Button, Checkbox, Radio, Switch, TextInput, Selector, TabList, Collapsible, Token, Badge, Tooltip, Toast, Skeleton/Spinner, states, wrappers, Dialog, and Carousel composition.
- [x] 5.2 Add axe coverage for the complete showcase across Sprout/Explorer/Creator, English/Simplified Chinese, and light/dark.
- [x] 5.3 Add keyboard/focus assertions for selection controls, tabs, collapse, select, dialog, tooltip, and carousel.
- [x] 5.4 Add reduced-motion assertions for animated Astryx components and the new decorative wrappers.
- [x] 5.5 Add locale key parity and no-missing-copy assertions for the showcase.

## 6. Visual Snapshots

- [x] 6.1 Add per-component Playwright snapshot coverage for every phase-one component across all three age profiles and light/dark modes.
- [x] 6.2 Keep the existing locale × viewport full-page visual matrix and update its baselines for the new navigation/showcase surface.
- [x] 6.3 Add a no-JavaScript SSR assertion for the component showcase across profile/mode attributes and localized copy.
- [x] 6.4 Verify visual snapshots are generated from the implementation, not used as design-reference input.

## 7. Final Verification

- [x] 7.1 Run `pnpm theme:check`, `pnpm assets:check`, and `pnpm boundaries:check` from the template.
- [x] 7.2 Run `pnpm check:full` from the template and resolve every failure within scope.
- [x] 7.3 Run `openspec validate expand-web-tanstackstart-kids-components --strict` and resolve every validation error.
- [x] 7.4 Confirm no forbidden runtime dependency, Astryx copy, secret, push, or automatic archive was introduced.
