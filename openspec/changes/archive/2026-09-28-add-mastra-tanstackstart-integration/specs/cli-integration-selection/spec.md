## Purpose

Defines how `agentdock init` selects optional integrations and composes their assets without changing the default generated project.

## ADDED Requirements

### Requirement: Integration selection is explicit and default-off

`agentdock init` MUST accept zero or more integration IDs through `--integrations`. The default MUST be an empty set, and an empty set MUST preserve the existing generated files, dependencies, scripts, environment examples, lockfile behavior, and JSON result shape.

#### Scenario: No integration selected

- **WHEN** a user runs `agentdock init` without `--integrations`
- **THEN** the generated project contains no integration-specific files, dependencies, scripts, or environment variables

#### Scenario: Integration selected with a valid template

- **WHEN** a user runs `agentdock init --template web-tanstackstart --integrations mastra`
- **THEN** the generated project contains the shared Mastra runtime and reports `integrations: ["mastra"]`

### Requirement: Integration values are normalized deterministically

The CLI MUST accept repeated `--integrations` flags and comma-separated values, trim whitespace, remove duplicates, and preserve first-seen order. Agent, JSON, human, and MCP paths MUST expose the same normalized integration set.

#### Scenario: Repeated flags are combined

- **WHEN** a caller supplies `--integrations mastra --integrations future`
- **THEN** the CLI validates the ordered set `["mastra", "future"]` and reports unknown integration IDs using the same error contract as other invalid inputs

#### Scenario: Comma-separated values are combined

- **WHEN** a caller supplies `--integrations mastra,future`
- **THEN** the CLI treats the value as the same normalized set as repeated flags

### Requirement: Integration compatibility is validated before filesystem writes

The CLI MUST reject unknown integrations and integrations that are not compatible with the selected template before creating the target directory. The error response MUST identify the selected template and the supported integration IDs when known.

#### Scenario: Unknown integration

- **WHEN** a caller requests an integration ID that does not exist in the registry
- **THEN** scaffolding fails with a structured integration-not-found error and no target files are written

#### Scenario: Known integration on an incompatible template

- **WHEN** a caller requests a known integration for a template that does not declare compatibility
- **THEN** scaffolding fails with a structured unsupported-integration error and no target files are written

### Requirement: Integration composition preserves workspace ownership

In standalone mode, an integration MAY replace the template lockfile with a compatible generated-project lockfile. In workspace-member mode, the CLI MUST NOT write a local lockfile or package-manager ownership fields and MUST leave dependency resolution to the workspace root.

#### Scenario: Standalone integration lockfile

- **WHEN** a standalone project is generated with Mastra
- **THEN** its package manifest and lockfile describe the same dependencies and support frozen installation

#### Scenario: Workspace member integration

- **WHEN** a workspace-member project is generated with Mastra
- **THEN** the member has no local lockfile and the root workspace remains the lockfile owner

### Requirement: Integration application is declarative and reversible

Integration assets and package changes MUST be declared by registry metadata rather than hardcoded per template. Removing an integration from the selection MUST not leave its files or package metadata behind, and an integration MUST not silently overwrite an existing file or incompatible package entry unless the integration contract explicitly declares that replacement.

#### Scenario: Shared overlay reused by two templates

- **WHEN** both TanStack Start templates select the same integration
- **THEN** they reuse the same integration asset source for files that are not template-specific

#### Scenario: Declared package conflict

- **WHEN** an integration declares a dependency or script value that conflicts with an existing template value and no replacement is allowed
- **THEN** scaffolding fails before writing the project instead of silently choosing one value
