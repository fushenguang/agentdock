## Purpose

Ship the page archetypes, design base, sample renderer, and agent guidance that AgentDock web
projects build their UI from, as an Astryx integration (`@cogito.ai/astryx-web`).

## ADDED Requirements

### Requirement: Page archetypes as Astryx templates

The package MUST provide the page templates `dock-landing`, `dock-workbench`, `dock-list`,
`dock-form-flow`, `dock-settings`, and `dock-editor-frame`. In a project that installs the package,
`astryx build` MUST be able to select them and `astryx template` MUST be able to write them.

#### Scenario: Golden intents select the archetypes

- **WHEN** `astryx build "<intent>" --json` runs for every intent in `test/golden-intents.json`
  inside the fixture project
- **THEN** `data.start.name` equals the expected archetype and `data.start.package` equals
  `@cogito.ai/astryx-web`

#### Scenario: Natural postfix mobile wording is rejected with a usable fallback

- **WHEN** `astryx build "settings page on mobile" --json` runs in the fixture
- **THEN** `data.start.name` is Core `shell-top-nav`
- **AND** `dock-settings` is among the first three `data.pages` entries from
  `@cogito.ai/astryx-web`

#### Scenario: Scaffolding needs no extra packages

- **WHEN** `astryx template <id> <path> --json` runs for any archetype in the fixture project
- **THEN** exactly one file is written and `missingPackages` is empty

### Requirement: Archetype source conventions

Archetype sources MUST import only from the allowlist in design D2, MUST NOT contain `style`
attributes, `CSSProperties`, color literals, viewport media queries, `Theme`, `AppShell`, or layout
`<div>`s, MUST route every visible string through the app translator with `page.__PAGE__.*` keys,
and MUST end with an `astryx-messages` block whose `en` and `zh-CN` objects have identical keys.

#### Scenario: The check rejects a violating template

- **WHEN** a template imports an icon package or uses a `style` attribute
- **THEN** `scripts/check-templates.mjs` fails and names the file and the rule

#### Scenario: Archetypes compile inside the template

- **WHEN** each archetype is scaffolded into the fixture and wrapped as a route
- **THEN** the fixture's `check-types` exits 0

### Requirement: Conflicting Core templates are replaced

The package MUST replace the Core templates `library`, `form-wizard`, `settings`, and
`canvas-editor` with its archetypes of the same intent.

#### Scenario: A replaced template resolves to the archetype

- **WHEN** a project with the package runs `astryx template settings <path>`
- **THEN** the written file is `dock-settings`
- **AND** `astryx template settings <path> --package @astryxdesign/core` still writes the Core
  original

### Requirement: Design base docs

The package MUST ship the design base as Astryx docs with the ids listed in design D4.

#### Scenario: An agent finds the design base

- **WHEN** an agent runs `astryx docs dock-design-base`
- **THEN** the output lists the ten section docs

### Requirement: Agent guidance

The package MUST contribute the guidance lines of design D5 to `astryx init`.

#### Scenario: init writes the guidance

- **WHEN** a project that installs the package runs `astryx init --features agents`
- **THEN** the Astryx block in `AGENTS.md` lists the lines under `@cogito.ai/astryx-web`

### Requirement: Sample renderer

`astryx-web samples` MUST render the given routes for every requested theme, color mode, and size
with the system Chrome, writing one PNG per combination and an `index.json`.

#### Scenario: Chrome path is missing

- **WHEN** `CHROME_PATH` is not set
- **THEN** the command exits non-zero with a message that names `CHROME_PATH`

### Requirement: Owner visual approval before the first publish

The first published version MUST NOT be released before the owner approves renders of all six
archetypes at 390×844 and 1440×900 in light and dark.

#### Scenario: The release record carries the approval

- **WHEN** version `0.1.0` is published
- **THEN** its release record links the render directory and quotes the owner's approval
