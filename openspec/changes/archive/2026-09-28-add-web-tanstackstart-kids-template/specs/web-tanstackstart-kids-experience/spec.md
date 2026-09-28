## Purpose

Defines a reusable child experience layer for AgentDock web templates: a warm, safe, age-sensitive, multimodal product language that keeps Astryx responsible for component behavior while controlling visual identity, interaction policy, content tone, and adaptation by developmental need.

## ADDED Requirements

### Requirement: Child-first emotional design language

The template SHALL define a first-party visual language that communicates warmth, safety, friendliness, joy, and encouragement without reproducing any third-party game interface or copyrighted character. The language MUST use semantic design tokens for color, typography, shape, elevation, motion, and illustration rather than feature-level hard-coded values.

#### Scenario: A page uses the child visual language

- **WHEN** a generated page uses only the provided theme and child visual components
- **THEN** the page presents the same warm, rounded, low-pressure visual identity without importing third-party UI assets or depending on a theme name inside the feature

#### Scenario: A designer changes a visual token

- **WHEN** a palette, radius, shadow, type, or motion token changes in the child theme source
- **THEN** child pages update through semantic tokens and do not require per-feature color or spacing edits

### Requirement: Astryx remains the component and interaction kernel

The child experience MUST use Astryx components, hooks, and accessibility behavior as its interaction foundation. It MUST NOT fork, swizzle, patch, or replace Astryx core behavior to achieve the child visual language.

#### Scenario: A child component needs different presentation

- **WHEN** a child-facing component needs a different visual treatment from a stock Astryx component
- **THEN** the implementation uses a supported theme override, `xstyle`, wrapper, slot, or first-party composition while preserving the Astryx component's keyboard, focus, ARIA, and state behavior

#### Scenario: Astryx behavior and child styling conflict

- **WHEN** a visual request would require changing Astryx's internal structure or interaction semantics
- **THEN** the design is revised or implemented as a first-party wrapper with its own explicit behavior contract instead of modifying the Astryx core

### Requirement: Age profiles express developmental needs

The template SHALL expose configurable age profiles that represent developmental needs rather than treating age as a raw visual theme. The initial profiles MUST support an early-childhood profile, an early-primary profile, and an upper-primary profile, and the profile model MUST be extensible without changing feature component contracts.

#### Scenario: The same activity renders for a younger child

- **WHEN** the active age profile is the early-childhood profile
- **THEN** the experience applies larger targets, lower density, fewer primary choices, stronger visual guidance, and greater reading support than the older profiles

#### Scenario: The same activity renders for an older child

- **WHEN** the active age profile is the upper-primary profile
- **THEN** the experience preserves the same activity semantics while allowing more information, greater autonomy, and less infantilizing decoration

#### Scenario: Product configuration introduces a new age profile

- **WHEN** a product adds an age profile with a new capability combination
- **THEN** profile registration and capability resolution can be extended without adding raw age checks throughout feature components

### Requirement: Age adaptation uses semantic capabilities

Feature components MUST consume semantic experience capabilities such as target size, density, reading support, maximum primary choices, navigation depth, motion level, audio default, confirmation policy, and feedback style. Feature components MUST NOT branch directly on a raw numeric age or on a specific age-profile label.

#### Scenario: A capability changes

- **WHEN** maximum primary choices or reading support changes for an age profile
- **THEN** affected feature components receive the updated capability through the experience boundary and adapt without feature-specific age logic

#### Scenario: A profile is previewed or tested

- **WHEN** a developer renders a screen under a selected profile in development or tests
- **THEN** the same capability resolution path is used as in production and the result is deterministic

### Requirement: Child-appropriate interaction policy

The experience SHALL provide a centralized interaction policy for target size, density, choice count, navigation depth, gesture use, confirmation, undo, timeout behavior, feedback timing, and error recovery. The policy MUST default to reversible, forgiving interactions for younger profiles.

#### Scenario: A destructive action is presented

- **WHEN** a child triggers an action that can remove or overwrite meaningful work
- **THEN** the interaction provides an age-appropriate confirmation or undo path and does not rely on hidden gestures

#### Scenario: A child makes a mistake

- **WHEN** an action fails or validation is rejected
- **THEN** the response explains the next step in non-blaming language and keeps the child's previous work recoverable

### Requirement: Multimodal and accessible child experience

The child experience SHALL support visual, textual, auditory, and tactile-appropriate feedback where the platform permits. It MUST preserve semantic markup, keyboard operation, screen-reader announcements, focus visibility, contrast, captions or transcripts for audio, and reduced-motion behavior.

#### Scenario: Reduced motion is enabled

- **WHEN** the operating system or user preference requests reduced motion
- **THEN** decorative motion is removed or replaced with an immediate state change without removing the underlying feedback

#### Scenario: Audio is unavailable or disabled

- **WHEN** an activity provides spoken or sound-based guidance and audio is disabled or inaccessible
- **THEN** equivalent text or visual guidance remains available and the activity stays completable

#### Scenario: A child navigates without a pointer

- **WHEN** the child uses a keyboard, switch, or assistive input
- **THEN** every interactive child component remains reachable, operable, and visibly focusable through Astryx-compatible semantics

### Requirement: Child-safe content and ethical interaction

The child experience SHALL define content and interaction constraints that avoid shame, fear, urgency, deceptive patterns, and manipulative engagement. It MUST NOT introduce infinite reward loops, gambling-like variable rewards, public social pressure, or dark-pattern retention mechanics by default.

#### Scenario: The product presents progress

- **WHEN** progress, completion, or achievement feedback is shown
- **THEN** it emphasizes effort, learning, or completion in a low-pressure form and does not punish absence or force a streak

#### Scenario: The product links outside the template

- **WHEN** an action opens an external destination, requests sensitive information, or initiates a consequential transaction
- **THEN** the template exposes a parental or guardian confirmation boundary instead of presenting it as an ordinary child action

### Requirement: Private and stable profile resolution

The experience SHALL resolve the active age profile and theme before the first render in server-rendered applications. It MUST persist only the minimum profile information needed for experience selection, and it MUST NOT persist a precise birth date or an exact age unless a consuming product explicitly provides a separate privacy-reviewed requirement.

#### Scenario: The application reloads with a saved profile

- **WHEN** a child reloads a server-rendered page after selecting an age profile
- **THEN** the server and client render the same profile-dependent theme and capabilities without a visible hydration flash

#### Scenario: A product stores a profile

- **WHEN** profile data is persisted by the generated application
- **THEN** the saved value is a coarse age band or equivalent capability selection and contains no birth date by default

### Requirement: Provenance and reference discipline

The child experience MAY cite external projects as design references, but its shipped runtime MUST contain only first-party code and assets whose provenance and license are recorded. The template MUST document which reference ideas were adopted, adapted, or rejected.

#### Scenario: A reference project is used during design

- **WHEN** a design concept is adapted from an external project
- **THEN** the design documentation records the source, license status, adopted principle, and any known risk that caused the template to avoid copying its implementation or assets

#### Scenario: A template asset is shipped

- **WHEN** an icon, illustration, font, texture, or animation is included in the template
- **THEN** its origin and redistribution rights are recorded and the asset does not depend on a historically disputed third-party source
