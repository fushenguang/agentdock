## ADDED Requirements

### Requirement: scaffold_project input parity

The `scaffold_project` MCP tool MUST accept and forward the same scaffold inputs supported by `agentdock init --json`, including `displayName`, `dataLayer`, `schema`, `integrations`, package manager, mode, and target directory. MCP calls MUST use the same validation and result semantics as the CLI agent adapter.

#### Scenario: MCP scaffolds an integrated project

- **WHEN** an MCP client calls `scaffold_project` with a compatible template and `integrations: ["mastra"]`
- **THEN** the generated project contains Mastra and the result reports the selected integration

#### Scenario: MCP applies data-layer selection

- **WHEN** an MCP client calls `scaffold_project` with `dataLayer: "supabase"` and a schema
- **THEN** the generated project receives the same data-layer substitution as `agentdock init --json`

#### Scenario: MCP rejects unsupported integration

- **WHEN** an MCP client calls `scaffold_project` with an integration that is unknown or incompatible
- **THEN** the tool returns `ok: false` with the same stable error code and writes no project files

### Requirement: MCP metadata exposes integration choices

`list_templates` and `get_template_schema` MUST expose enough integration metadata for an MCP client to discover compatible integration IDs and construct a valid `scaffold_project` call without out-of-band knowledge.

#### Scenario: list_templates reports compatibility

- **WHEN** an MCP client lists templates
- **THEN** compatible templates include their supported integration IDs or an equivalent discoverable metadata shape

#### Scenario: get_template_schema reports init parameters

- **WHEN** an MCP client requests a template schema
- **THEN** the response includes the JSON Schema for the same scaffold inputs accepted by `scaffold_project`, including the supported integration enum
