## Purpose

Defines the standalone child-oriented TanStack Start template, including its shared platform substrate, child experience wiring, information architecture, first-party components, documentation, registration, and verification while preserving Astryx as the interaction kernel.

## Requirements

### Requirement: Dedicated child-oriented template package

AgentDock SHALL provide a standalone `web-tanstackstart-kids` template rather than overloading the enterprise `web-tanstackstart` template with child-specific branches. The template MUST support both standalone generation and workspace-member generation using the established template conventions.

#### Scenario: A developer scaffolds the child template

- **WHEN** a developer selects `web-tanstackstart-kids` in the AgentDock CLI
- **THEN** the generated project contains the child experience layer, Astryx foundation, TanStack Start application, Drizzle providers, and child-oriented documentation without requiring a manual starter refactor

#### Scenario: The child template is generated as a workspace member

- **WHEN** the template is generated inside an existing pnpm workspace
- **THEN** it follows the existing workspace-member ownership rules for installation, package-manager policy, lockfiles, and build approvals

### Requirement: Shared web platform substrate

The child template SHALL reuse the proven TanStack Start, React 19, TypeScript 7, Vite 8, Astryx, StyleX, Drizzle SQLite/Supabase, locale routing, SSR, and test foundations of `web-tanstackstart` unless a child-specific requirement justifies a documented divergence.

#### Scenario: A platform fix is applied

- **WHEN** the underlying web template fixes route generation, database wiring, locale routing, SSR, or build behavior
- **THEN** the child template can adopt the same pattern without forking the platform behavior

#### Scenario: A child-specific divergence is proposed

- **WHEN** the child template needs to diverge from the shared platform substrate
- **THEN** the divergence is documented with its child-experience rationale, compatibility impact, and verification consequence

### Requirement: Prebuilt child theme assets

The template SHALL ship one child visual language implemented as prebuilt Astryx theme artifacts and imported compiled CSS. Theme artifacts MUST be generated from first-party theme source using the supported Astryx theme build workflow and MUST be checked for freshness in the template verification gate.

#### Scenario: The application first renders

- **WHEN** the child theme is active during SSR and hydration
- **THEN** theme tokens and component overrides are present in the prebuilt CSS and no runtime theme injection is required for the child theme

#### Scenario: Theme source changes

- **WHEN** a developer edits child theme source
- **THEN** regenerating the built theme updates the committed JavaScript and CSS artifacts and the verification gate fails if the artifacts are stale

### Requirement: Experience-aware application shell

The template SHALL provide an application shell that expresses the child experience in navigation, page structure, controls, feedback, and content hierarchy. The shell MUST keep Astryx responsible for component semantics and interaction behavior and MUST expose age-profile switching for development and template demonstration.

#### Scenario: The shell renders under an age profile

- **WHEN** the active age profile changes
- **THEN** the shell applies the profile's density, target-size, navigation, reading-support, and motion policies without rebuilding the route tree

#### Scenario: A child uses the shell navigation

- **WHEN** the child navigates between primary destinations
- **THEN** the navigation uses clear labels, recognizable icons, large targets, visible focus, and an age-appropriate number of primary destinations

### Requirement: Child-facing component and pattern library

The template SHALL provide first-party child-facing components and patterns for friendly surfaces, section headings, illustrated empty states, loading and waiting states, success feedback, recoverable errors, progress, rewards or encouragement, and safe navigation. Components MUST compose or wrap Astryx primitives rather than replacing their interaction contracts.

#### Scenario: A new page needs a child-facing state

- **WHEN** a feature needs a loading, empty, error, success, waiting, or progress state
- **THEN** it uses the shared child-facing state component with localized copy, appropriate illustration, and age-profile adaptation instead of inventing a one-off state

#### Scenario: A child-facing component wraps Astryx

- **WHEN** a wrapper changes the visible composition of an Astryx component
- **THEN** it retains the underlying component's accessible name, disabled state, focus behavior, and semantic role

### Requirement: Localized child content system

The template SHALL ship localized child-facing content with short, concrete, age-appropriate wording and a consistent encouraging tone. User-facing text MUST remain in the application message catalogs, and the template MUST demonstrate copy and layout behavior at every supported age profile and locale.

#### Scenario: A page renders in every locale and age profile

- **WHEN** a developer opens the template in any supported locale under any supported age profile
- **THEN** copy, labels, illustrations, target sizes, and spacing remain coherent without truncation or untranslated fallback text

#### Scenario: A feature author adds child-facing copy

- **WHEN** a new message is required
- **THEN** the project guidance directs the author to add it to every catalog and follow the child content rules instead of embedding copy in a feature component

### Requirement: Privacy, safety, and ethical defaults

The template SHALL default to privacy-preserving and child-safe behavior. It MUST NOT include advertising, third-party behavioral tracking, social feeds, public child profiles, infinite engagement loops, or precise birth-date storage by default. External links, purchases, sensitive-data requests, and other consequential actions MUST be capable of routing through a guardian confirmation boundary.

#### Scenario: The generated application starts with default settings

- **WHEN** a child uses the generated template without product-specific integrations
- **THEN** the application contains no advertising or behavioral tracking and does not require a birth date to select an age profile

#### Scenario: A product adds a consequential action

- **WHEN** the product exposes an external link, purchase, or sensitive-data flow through the template
- **THEN** the template provides a guardian confirmation pattern and the product documents its age-appropriate policy

### Requirement: Agent-oriented documentation and extension guidance

The template SHALL include `AGENTS.md`, `LLM.md`, `DESIGN.md`, a template README, and relevant Agent Skills guidance. The documentation MUST explain the Astryx kernel boundary, child experience model, age profiles, theme extension, component rules, content tone, safety policy, verification commands, and third-party reference provenance.

#### Scenario: An agent adds a child-facing feature

- **WHEN** an AI coding agent reads the template guidance before editing a route or component
- **THEN** it can identify the correct Astryx primitive, semantic token, age capability, localized copy source, safety boundary, and verification gate without inspecting unrelated platform code

#### Scenario: A developer evaluates a new dependency or asset

- **WHEN** a developer proposes a new UI library, illustration set, icon set, font, or animation runtime
- **THEN** the template guidance requires a compatibility, accessibility, bundle, and provenance review before adoption

### Requirement: Verification for child experience quality

The template SHALL provide automated and documented verification for theme freshness, type safety, linting, formatting, unit behavior, SSR/hydration, responsive layout, accessibility, reduced motion, localization, and visual behavior across age profiles and color modes.

#### Scenario: A child experience change is ready for review

- **WHEN** the author runs the template acceptance command
- **THEN** the command verifies the Astryx integration, generated theme artifacts, child profile resolution, locale parity, accessibility, SSR-safe rendering, and the template build

#### Scenario: An age profile regresses visually or behaviorally

- **WHEN** a profile-dependent target size, label, state, or layout changes beyond its accepted contract
- **THEN** the verification gate reports the affected profile and prevents the change from being accepted as complete
