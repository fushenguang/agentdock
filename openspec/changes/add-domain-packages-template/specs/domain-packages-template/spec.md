# domain-packages-template Specification

## ADDED Requirements

### Requirement: Empty initialized workspace

The template SHALL initialize workspace tooling, schemas, agent context, and checks without creating
a business domain package.

#### Scenario: A workspace is initialized

- **WHEN** `agentdock init` uses template `domain-packages`
- **THEN** the generated repository contains `openspec/`, `apps/docs/`, and the `apps/web/` scaffold
  reservation
- **AND** the generated repository contains no `apps/<package-id>/` business package
- **AND** package creation, validation, and build tooling are present.

### Requirement: Spec-driven package creation

The template SHALL provide a package generator with a non-interactive `package-spec.json` mode and a
human interactive mode, and the generator SHALL validate package id, domain intent, owner, lifecycle,
repository class, and no-Web exception before writing files.

#### Scenario: An agent creates a package

- **WHEN** the agent runs `pnpm create:package --spec package-spec.json`
- **THEN** the generator creates package declarations and surfaces deterministically
- **AND** no package directory is reconstructed manually from model memory.

#### Scenario: A human runs the generator without a spec

- **WHEN** `pnpm create:package` runs in an interactive terminal
- **THEN** the generator prompts for the package id and domain intent
- **AND** derives sensible defaults for display name and owner while allowing overrides
- **AND** creates the package without requiring a temporary `package-spec.json`.

#### Scenario: A specified spec file is missing

- **WHEN** `pnpm create:package --spec package-spec.json` runs and that file does not exist
- **THEN** the generator emits a friendly actionable error instead of an unhandled `ENOENT`
- **AND** no package files are written.

#### Scenario: Generator input is requested in non-interactive mode

- **WHEN** the generator runs without `--spec` and standard input is not an interactive terminal
- **THEN** it fails with instructions to provide `--spec` rather than blocking on prompts.

### Requirement: Initializer creates the first package on request

The CLI SHALL support domain-package onboarding after scaffolding the `domain-packages` template.
Human interactive initialization SHALL collect the package id and intent and invoke the package
generator before returning. Agent/JSON initialization SHALL remain non-interactive and SHALL support
either a package spec file or explicit id and intent arguments.

#### Scenario: A human initializes the workspace

- **WHEN** `agentdock init` interactively selects `domain-packages`
- **THEN** the CLI asks for the first package id and domain intent
- **AND** creates `apps/<package-id>/` and `apps/web/` before reporting completion.

#### Scenario: An agent initializes with explicit values

- **WHEN** agent/JSON mode provides the domain package id and intent arguments or a spec file
- **THEN** initialization creates the corresponding package without terminal prompts.

#### Scenario: An agent initializes without package input

- **WHEN** agent/JSON mode scaffolds `domain-packages` without package arguments or a spec
- **THEN** initialization preserves the existing empty-workspace behavior and does not block.

### Requirement: Standard generated repository layout

The generated workspace SHALL keep OpenSpec at the repository root and SHALL place domain packages,
documentation, and package Web under `apps/`.

#### Scenario: Package paths are checked

- **WHEN** a package with id `example-domain` is created
- **THEN** its package root is `apps/example-domain/`
- **AND** its Web source project is `apps/web/`
- **AND** its ignored build staging directory is `apps/example-domain/web/`
- **AND** its catalog context entry points to `apps/example-domain/AGENTS.md`.

#### Scenario: A duplicate package id is supplied

- **WHEN** the target package root already exists or `apps/web/` is already a generated Web project
- **THEN** creation fails before overwriting either directory.

### Requirement: Formal packages default to Web

A newly created formal package SHALL default to `hasWeb: true` and SHALL declare an intent-level Web
Surface. A no-Web formal package SHALL include an approved exception.

#### Scenario: A formal package is generated

- **WHEN** the spec does not explicitly disable Web
- **THEN** the generator creates a `web-tanstackstart` Web source project at `apps/web/`
- **AND** emits `agent/web-surface.json`.

#### Scenario: Web is intentionally omitted

- **WHEN** the spec sets `hasWeb` to false without an approved exception
- **THEN** generation fails before creating the package.

### Requirement: AgentDock CLI version is pinned

The template SHALL record the tested AgentDock CLI version and package creation SHALL invoke that
exact version rather than floating to `latest`.

#### Scenario: Web source is scaffolded

- **WHEN** the generator invokes AgentDock for `web-tanstackstart`
- **THEN** it invokes the version recorded in `standards-lock.json`.

### Requirement: Practice pack is minimal and public

The template SHALL distribute reusable engineering practice as executable checks and narrow skills.
It SHALL NOT include a business package, private host runtime implementation, product roadmap, or
generated output.

#### Scenario: A contributor proposes copying a business package

- **WHEN** a complete product package is proposed as template content
- **THEN** the contribution is rejected
- **AND** the minimal reusable invariant is extracted instead.

### Requirement: Generated output stays out of source Git

The generated workspace SHALL ignore `<package-id>/web/` and generated seed databases. Build tooling
MAY create local staging, but immutable release artifacts SHALL be produced by a release pipeline.

#### Scenario: Package Web is built locally

- **WHEN** `pnpm build:<package-id>-package` completes
- **THEN** ignored `apps/<package-id>/web/` staging is created or refreshed
- **AND** the package `start:web` command launches the fixed `apps/web` workspace member
- **AND** packaged text output contains no build-machine absolute paths
- **AND** the source commit remains free of generated output.

#### Scenario: The generated workspace check runs package Web checks

- **WHEN** a package with Web has been generated and `pnpm check` runs
- **THEN** workspace structure checks and the `web` workspace member checks both execute.
