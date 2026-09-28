## Purpose

Defines a child-oriented visual layer for the phase-one common component set while keeping Astryx as the authoritative component, interaction, accessibility, SSR, and theme kernel.

## ADDED Requirements

### Requirement: Phase-one child component catalog

The template SHALL provide a usable child-oriented presentation for Button, Checkbox, Radio, Switch, Input/TextInput, Select/Selector, Tabs, Collapse, Tag, Badge, Tooltip, Toast/Notification, Skeleton/Loading, Empty/Error/Success states, title ribbon/cloud, Background/Pattern, Divider, Modal/Dialog, and Carousel.

#### Scenario: A child product needs a phase-one component

- **WHEN** a developer browses the template component showcase for any phase-one category
- **THEN** a localized working example is available with representative states and no dependency on a third-party game UI package

#### Scenario: A missing visual primitive is requested

- **WHEN** an implementation need is not covered by an Astryx component
- **THEN** the template may add a first-party decorative or composition wrapper, but it must not claim or re-create the missing interaction semantics

### Requirement: Astryx remains the component and interaction kernel

All interactive phase-one components MUST use Astryx primitives or supported Astryx extension points. The template MUST NOT fork, swizzle, patch, copy, or bypass Astryx behavior for keyboard operation, focus management, selection, dialog behavior, validation, ARIA, live announcements, or SSR.

#### Scenario: A component needs child visual styling

- **WHEN** stock Astryx presentation does not match the child visual language
- **THEN** the visual change is applied through a supported theme override, token, `xstyle`, slot, or thin wrapper while the Astryx primitive remains responsible for behavior

#### Scenario: A wrapper surrounds an Astryx control

- **WHEN** a first-party wrapper adds layout, decoration, copy, or capability-based presentation
- **THEN** the underlying accessible name, role, disabled state, focus behavior, validation state, and keyboard behavior remain intact

### Requirement: Age-profile and color-mode adaptation

Every interactive phase-one component SHALL render coherently under `sprout`, `explorer`, and `creator`, and under both light and dusk modes. Theme and wrapper adaptation MUST use semantic tokens and resolved child capabilities rather than raw age checks in component code.

#### Scenario: The same component renders for each age profile

- **WHEN** the active profile changes between Sprout, Explorer, and Creator
- **THEN** target size, density, radius, typography, and decoration adapt through the existing profile and theme contracts without changing the component's task semantics

#### Scenario: The same component renders in dusk mode

- **WHEN** the active color mode changes from light to dusk
- **THEN** backgrounds, text, icons, borders, focus rings, status colors, skeletons, and overlays preserve the same hierarchy and required contrast

### Requirement: Child-accessible interaction and motion

Phase-one components MUST preserve complete keyboard paths, visible focus, screen-reader names and state announcements, disabled semantics, error association, and non-color-only feedback. Motion MUST be decorative or orientation-oriented and MUST respect `prefers-reduced-motion`; no component may require motion to be understood or operated.

#### Scenario: A keyboard-only child uses a component

- **WHEN** a child navigates, selects, opens, closes, or dismisses a phase-one component without a pointer
- **THEN** the operation follows the Astryx keyboard contract and focus remains visible and predictably managed

#### Scenario: Reduced motion is requested

- **WHEN** the operating system requests reduced motion
- **THEN** loading, carousel, toast, dialog, collapse, and decoration animations become effectively static or immediately resolved without blocking completion

### Requirement: Complete bilingual child-facing copy

Every user-facing string introduced by the component showcase and wrappers MUST exist in both the English and Simplified Chinese catalogs. Labels, descriptions, status messages, empty states, errors, actions, tooltips, and dismiss controls MUST remain complete and non-blaming in both locales.

#### Scenario: The component showcase switches locale

- **WHEN** the locale changes between English and Simplified Chinese
- **THEN** all visible labels and support text switch languages without mixed-language fallback, truncation, or missing actions

#### Scenario: A new component string is added

- **WHEN** a developer adds copy to a phase-one component or demo
- **THEN** the same semantic key is present in every supported locale catalog and key parity verification passes

### Requirement: Per-component verification evidence

Each phase-one category SHALL have a demo, unit coverage for its controlled behavior or composition, an automated accessibility check, and a visual snapshot. The overall visual matrix MUST cover all three age profiles and both light and dusk modes, and final verification MUST also prove reduced-motion and no Astryx boundary violation.

#### Scenario: Component behavior or composition regresses

- **WHEN** a phase-one component changes label, state, keyboard path, or wrapper composition unexpectedly
- **THEN** at least one unit or accessibility test fails with the affected component identified

#### Scenario: Component visuals regress by profile or mode

- **WHEN** a theme token, component override, or wrapper changes appearance beyond the accepted snapshot
- **THEN** the visual test run reports the affected profile, mode, viewport, and component evidence

#### Scenario: The change is ready for review

- **WHEN** the author runs the template full gate and OpenSpec strict validation
- **THEN** `pnpm check:full` and `openspec validate --strict` pass without adding forbidden runtime references or pushing the branch

### Requirement: Preserved existing child visual contracts

The implementation MUST preserve the existing Button hard-bottom shadow, ProgressBar track/fill correction, and original first-party `KidIcon` direction while extending the component visual layer.

#### Scenario: Existing child controls are restyled

- **WHEN** the theme or wrapper changes are applied
- **THEN** the Button retains its hard-bottom shadow, ProgressBar retains distinct visible track and fill layers, and `KidIcon` remains first-party and original
