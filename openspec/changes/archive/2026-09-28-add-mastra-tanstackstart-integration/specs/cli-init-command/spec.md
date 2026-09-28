## ADDED Requirements

### Requirement: Init supports optional integrations

`agentdock init` MUST pass the normalized integration selection through both the agent and human adapters. The human flow MUST preserve its existing prompts when no integration flag is supplied, and an explicit integration flag MUST be honored without requiring an additional prompt.

#### Scenario: Agent mode with integrations

- **WHEN** an agent runs `agentdock init --name app --template web-tanstackstart --integrations mastra --json`
- **THEN** the command scaffolds the Mastra-enabled project and emits a successful JSON result containing the selected integration

#### Scenario: Human mode without integrations

- **WHEN** a human runs the existing interactive init flow without `--integrations`
- **THEN** the existing prompt order and default generated project behavior remain unchanged

### Requirement: Init JSON reports integrations only when selected

Successful JSON output MUST include the normalized `integrations` array when one or more integrations were selected. When the array is empty, the result MUST omit the field so existing consumers see the pre-change shape.

#### Scenario: Default JSON remains backward compatible

- **WHEN** `agentdock init --json` runs without integrations
- **THEN** the JSON result contains no `integrations` field

#### Scenario: Integrated JSON includes selection

- **WHEN** `agentdock init --json --integrations mastra` succeeds
- **THEN** the JSON result contains `integrations: ["mastra"]`

### Requirement: Invalid integration input uses structured errors

Invalid integration IDs and incompatible template/integration pairs MUST return stable structured error codes in agent mode and MUST not create the target directory.

#### Scenario: Agent receives invalid integration error

- **WHEN** an agent requests an unavailable integration
- **THEN** stdout contains the structured error, the process exits non-zero, and no project files are created
