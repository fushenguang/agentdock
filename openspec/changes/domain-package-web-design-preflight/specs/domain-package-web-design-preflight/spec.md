## Purpose

Define the package- and page-level design preflight used by domain-package Web development so an
agent establishes audience, hierarchy, visual direction, and core page intent before it writes UI.

## ADDED Requirements

### Requirement: Package design intake

Before a domain-package Web design is approved, the agent MUST collect owner decisions for the target
audience and context, core product tasks, information hierarchy, visual character and references,
layout/page grammar, typography, color, spacing, interaction, and hidden-by-default policy. The
agent MUST stop and wait when one of those decisions is unresolved.

#### Scenario: Package direction is incomplete

- **WHEN** audience, core tasks, or visual direction are absent from `PRODUCT.md` or `DESIGN.md`
- **THEN** the agent asks the owner before implementing a feature page

### Requirement: Per-page brief before creation

Each new page MUST have a complete row under `DESIGN.md`'s `## Page briefs` section before
`pnpm page:new` creates its route. The row MUST name the core function, primary action,
above-the-fold content, hidden-by-default content, and Astryx archetype.

#### Scenario: Missing page brief

- **WHEN** a user runs `pnpm page:new` for a route without a complete page-brief row
- **THEN** the command fails before Astryx scaffolds the page and tells the agent which route and
  fields to complete

#### Scenario: Complete page brief

- **WHEN** the normalized route has a complete page-brief row
- **THEN** the existing template selection, provenance, catalog, and formatting flow continues

### Requirement: Astryx remains the implementation authority

The workflow MUST map the approved intent to Astryx templates, components, tokens, and application
wrappers. Stitch, Taste Skill, UI UX Pro Max, and Impeccable MAY inform discovery or review, but
MUST NOT introduce a second component system, token source, or package-local design runtime.

#### Scenario: External references conflict with Astryx

- **WHEN** an external reference suggests a component or styling pattern that conflicts with Astryx
- **THEN** the agent records it as inspiration only and uses the Astryx-owned implementation

### Requirement: Information hierarchy and content shape

The design contract MUST distinguish primary, secondary, auxiliary, and hidden-by-default
information. Component mapping MUST follow content shape: homogeneous records use rows/tables,
independent entry or decision units may use one level of card chrome, and forms, page sections,
lists, or whole pages MUST NOT be wrapped as cards.

#### Scenario: Agent plans a feature-heavy page

- **WHEN** a page has more capabilities than belong in its first screen
- **THEN** the page brief assigns the core job above the fold and moves secondary or auxiliary
  functionality to a drawer, disclosure, menu, contextual route, or settings surface

### Requirement: Domain-package skill distribution

The domain-packages template MUST provide an automatically discoverable
`domain-package-web-design` skill and copy it into generated `apps/web/.agents/skills/` projects.
The skill MUST route to `astryx-web-design` for templates, page construction, and visual acceptance.

#### Scenario: Generated package is opened by Codex

- **WHEN** a package Web is generated from the domain-packages template
- **THEN** `apps/web/.agents/skills/domain-package-web-design/SKILL.md` exists and the package
  guidance tells the agent to use it before page work
