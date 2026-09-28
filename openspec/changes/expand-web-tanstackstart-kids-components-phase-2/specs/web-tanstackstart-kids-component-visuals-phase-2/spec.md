## Purpose

Defines a bounded phase-two child visual layer for supporting product surfaces while preserving Astryx as the behavior, accessibility, SSR, and theme kernel.

## ADDED Requirements

### Requirement: Phase-two component catalog

The template SHALL provide child-oriented examples and visual treatment for Card, ProgressBar, FormLayout/Field composition, DateInput, TimeInput, Timestamp, Table, Pagination, FileInput, Thumbnail, Lightbox, BottomSheet/Drawer, and CodeBlock.

#### Scenario: A developer needs a phase-two component

- **WHEN** a developer opens the localized component showcase for any phase-two category
- **THEN** a working example is available with representative states and localized child-facing copy

#### Scenario: A reference component is unsafe or unnecessary by default

- **WHEN** a reference pattern requires global cursor replacement, typewriter motion, countdown pressure, or a custom form engine
- **THEN** it is documented as excluded or product-specific rather than added to the default template

### Requirement: Astryx remains the phase-two behavior kernel

Phase-two interactive components MUST use Astryx primitives. Visual changes MUST use supported theme targets, tokens, `xstyle`, slots, or thin wrappers. The template MUST NOT fork, swizzle, patch, copy, or replace Astryx form, date/time, table, pagination, file, lightbox, bottom-sheet, or code-block behavior.

#### Scenario: A phase-two component needs child styling

- **WHEN** stock Astryx presentation does not match the child visual language
- **THEN** the change uses a supported theme target, token, or composition while Astryx retains keyboard, focus, ARIA, validation, SSR, and state behavior

#### Scenario: A phase-two example needs a product flow

- **WHEN** a demo composes several Astryx controls
- **THEN** the demo does not create a second state machine or bypass the primitive's public API

### Requirement: Safe phase-two examples

Phase-two examples MUST remain local-only unless a product separately implements a guardian-approved backend. File and image examples MUST not upload, persist, track, or expose content by default. Date/time examples MUST not request precise birth date, precise location, or unnecessary identity data.

#### Scenario: A child opens the file or image demo

- **WHEN** the FileInput, Thumbnail, or Lightbox example is used
- **THEN** no network upload or persistence occurs in the template demo and the guardian boundary is explained in localized copy

#### Scenario: A child opens the date or time demo

- **WHEN** the DateInput or TimeInput example is used
- **THEN** the example demonstrates optional scheduling semantics without asking for birth date or storing precise personal data by default

### Requirement: Phase-two profile, mode, localization, and accessibility

Every phase-two interactive category SHALL render coherently under `sprout`, `explorer`, and `creator`, and under light and dusk. Labels, helper text, status messages, table headings, pagination labels, file/image copy, sheet labels, and code-block titles MUST exist in English and Simplified Chinese. Keyboard, focus, screen-reader, validation, and reduced-motion behavior MUST remain intact.

#### Scenario: Phase-two controls render in every profile and mode

- **WHEN** the active profile and mode change
- **THEN** target size, density, surfaces, and feedback adapt through the existing capability and theme contracts without changing component semantics

#### Scenario: A keyboard-only child uses a phase-two component

- **WHEN** a child navigates form fields, date/time input, table controls, pagination, file input, lightbox, bottom sheet, or code block without a pointer
- **THEN** Astryx provides the expected keyboard operation and visible focus

### Requirement: Phase-two verification evidence

Each phase-two category SHALL have a localized demo, unit or composition coverage, automated accessibility coverage, and a visual snapshot across all three age profiles and both light and dark modes.

#### Scenario: A phase-two component regresses

- **WHEN** a label, state, keyboard path, composition, theme target, or layout changes unexpectedly
- **THEN** a unit, axe, SSR, or visual test identifies the affected category

#### Scenario: The phase is ready for review

- **WHEN** the author runs the template full gate and strict OpenSpec validation
- **THEN** `pnpm check:full` and `openspec validate --strict` pass without adding forbidden runtime dependencies or copying third-party source
