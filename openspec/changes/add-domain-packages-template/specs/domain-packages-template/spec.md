# domain-packages-template Specification

## ADDED Requirements

### Requirement: Empty initialized workspace

The template SHALL initialize workspace tooling, schemas, agent context, and checks without creating
a business domain package.

#### Scenario: A workspace is initialized

- **WHEN** `agentdock init` uses template `domain-packages`
- **THEN** the generated repository contains no `<package-id>/` business package
- **AND** package creation, validation, and build tooling are present.

### Requirement: Spec-driven package creation

The template SHALL provide a non-interactive package generator driven by `package-spec.json`, and the
generator SHALL validate package id, domain intent, owner, lifecycle, repository class, and no-Web
exception before writing files.

#### Scenario: An agent creates a package

- **WHEN** the agent runs `pnpm create:package --spec package-spec.json`
- **THEN** the generator creates package declarations and surfaces deterministically
- **AND** no package directory is reconstructed manually from model memory.

#### Scenario: A duplicate package id is supplied

- **WHEN** the target package root or Web source directory already exists
- **THEN** creation fails before overwriting either directory.

### Requirement: Formal packages default to Web

A newly created formal package SHALL default to `hasWeb: true` and SHALL declare an intent-level Web
Surface. A no-Web formal package SHALL include an approved exception.

#### Scenario: A formal package is generated

- **WHEN** the spec does not explicitly disable Web
- **THEN** the generator creates a `web-tanstackstart` Web source project
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
- **THEN** ignored `<package-id>/web/` staging is created or refreshed
- **AND** the source commit remains free of generated output.
