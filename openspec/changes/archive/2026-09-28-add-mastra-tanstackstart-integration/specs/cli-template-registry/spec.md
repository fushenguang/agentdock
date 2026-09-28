## ADDED Requirements

### Requirement: Registry exposes an integration catalog

The generated registry MUST support a root-level integration catalog independent of template entries. Each integration entry MUST declare its stable ID, human-readable metadata, compatible template IDs, asset source, package additions or replacements, and any template-specific lockfiles required for standalone generation.

#### Scenario: Registry includes Mastra

- **WHEN** the registry is generated
- **THEN** it contains a `mastra` integration compatible with both TanStack Start templates

#### Scenario: Unsupported compatibility is rejected

- **WHEN** the generator encounters an integration that declares a non-existent compatible template
- **THEN** registry generation fails with an actionable error

### Requirement: Integration assets are bundled with the CLI

Integration asset directories MUST be included in the published CLI package and MUST be resolvable from the same runtime layout as bundled templates. Registry generation MUST ignore non-template support directories whose names are explicitly reserved for integration assets.

#### Scenario: Published CLI can apply an integration

- **WHEN** the built CLI scaffolds a compatible template with an integration
- **THEN** it resolves the integration assets from the packaged assets without network access

#### Scenario: Support directory is not registered as a template

- **WHEN** the registry generator scans the templates root
- **THEN** it skips the reserved integration support directory and does not emit it as a selectable template

### Requirement: Registry validates variant lockfiles

For every integration/template pair that supports standalone generation, the registry metadata MUST identify the compatible lockfile asset, or explicitly declare that the standalone project must generate its own lockfile before frozen installation. Variant lockfiles MUST match the integrated package manifest.

#### Scenario: Standalone variant lockfile is available

- **WHEN** a standalone Mastra project is generated for either TanStack Start template
- **THEN** the copied lockfile matches the integrated dependencies and `pnpm install --frozen-lockfile` succeeds

#### Scenario: Workspace member ignores variant lockfile

- **WHEN** the same integration is generated as a workspace member
- **THEN** the CLI does not copy the integration's standalone lockfile into the member
