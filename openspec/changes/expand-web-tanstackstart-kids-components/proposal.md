---
roadmap-id: web-tanstackstart-template
---

## Why

`web-tanstackstart-kids` already proves the Astryx-backed age-profile architecture with themes, providers, and a small child component set, but the common form, feedback, navigation, and surface controls still fall back to stock Astryx presentation. A documented, theme-first visual layer is needed so generated child products do not re-create the same component styling inconsistently or drift away from Astryx behavior.

## What Changes

- Extend the three existing Astryx child themes (`sprout`, `explorer`, `creator`) with semantic tokens and supported component overrides for the phase-one child component visual language in both light and dusk modes.
- Add supported thin wrappers only where Astryx has no visual component for the child pattern, starting with a title ribbon/cloud and a decorative background/pattern surface.
- Add a localized component showcase route that demonstrates Button, Checkbox, Radio, Switch, Input/TextInput, Select/Selector, Tabs, Collapse, Tag, Badge, Tooltip, Toast/Notification, Skeleton/Loading, Empty/Error/Success states, title ribbon/cloud, Background/Pattern, Divider, Modal/Dialog, and Carousel.
- Add unit, accessibility, reduced-motion, locale/profile/mode integration, and visual snapshot coverage for the phase-one component set.
- Preserve the existing Button hard-bottom shadow, ProgressBar track/fill correction, and original first-party `KidIcon` language.
- Record the source-analysis decisions from `animal-island-ui`, `naive-icons`, and Astryx so future work can distinguish reference direction from runtime code.

## Capabilities

### New Capabilities

- `web-tanstackstart-kids-component-visuals`: Defines the child-oriented, theme-first component visual layer, its Astryx ownership boundary, supported wrappers, profile/mode/accessibility/localization adaptation, and verification evidence.

### Modified Capabilities

<!-- No existing main-spec capability changes are required. The new capability extends the child template without changing its archived or in-flight contract. -->

## Impact

- Affects `templates/web-tanstackstart-kids/src/components/appearance/themes/*`, `src/components/kids/*`, `src/i18n/messages.ts`, locale-prefixed routes, component/a11y tests, and Playwright visual tests.
- Adds no runtime dependency. `animal-island-ui`, `naive-icons`, and their assets remain source-only design references and MUST NOT enter the dependency graph.
- Does not fork, swizzle, patch, or copy Astryx source; Astryx remains responsible for component behavior, keyboard interaction, focus, ARIA, SSR, and theme execution.
- Requires regenerated Astryx theme artifacts and a final `pnpm check:full` plus `openspec validate --strict` gate.

## Non-goals

- Pixel-for-pixel reproduction of `animal-island-ui`, Animal Crossing, or any third-party game interface.
- Adding `animal-island-ui`, `naive-icons`, or their historical assets as runtime dependencies.
- Forking, swizzling, patching, copying, or reimplementing Astryx components and interaction behavior.
- Changing child profile cookie contracts, data-layer behavior, authentication, backend storage, or safety policy.
- Delivering a general-purpose production design system beyond the phase-one component list.
