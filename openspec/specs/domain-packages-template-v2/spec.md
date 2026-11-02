# domain-packages-template-v2 Specification

## Purpose
TBD - created by archiving change domain-packages-template-2-0. Update Purpose after archive.

## Requirements

### Requirement: Generated packages target domain-package spec 2.0

The generator SHALL emit a contract for spec `>=2.0.0-rc.2 <3.0.0` and protocol `=2.0.0`,
including the intent declaration, collaboration mode, v2 Agent Surface, caller-based Web
authorization, sourced runtime state, and structured capability errors.

#### Scenario: A package is generated

- **WHEN** the package generator writes a Web domain package
- **THEN** its contract, package surface, Web surface, and capability descriptors use the 2.0
  declaration shapes
- **AND** the package has no identity or authorization `audience` field.

### Requirement: Generated Web packages include mandatory system capabilities

A generated package with `hasWeb: true` SHALL include the spec-defined health, self-check, and
host-only delete-all-data system capabilities.

#### Scenario: The generated package is validated

- **WHEN** the devkit checks the package with profile 2.0
- **THEN** all three required system capabilities satisfy their fixed access, risk, effects, and
  idempotency templates
- **AND** the package contains a package-local standards lock.

### Requirement: Generated packages expose a multi-skill index

The generator SHALL emit a starter skill and its FORMAT-025 index entry whose intent, capability,
and reference declarations resolve to generated package declarations.

#### Scenario: A starter workflow is generated

- **WHEN** a package is created
- **THEN** `agent/skills-index.json` lists the starter skill
- **AND** the skill body exists under `skills/<skill-id>/SKILL.md`.

### Requirement: Generated package passes the real package build

The generated workspace SHALL be able to build the package Web and pass the devkit 2.0 source
profile after that build creates the ignored `web/` staging directory.

#### Scenario: Package verification follows the release path

- **WHEN** dependencies are installed, `pnpm build:<package-id>-package` succeeds, and devkit
  checks the package with profile 2.0
- **THEN** the contract, budgets, system templates, skills index, and standards lock pass
- **AND** generated `web/` output remains ignored by source Git.
