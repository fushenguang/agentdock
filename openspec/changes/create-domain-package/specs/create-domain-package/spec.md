## ADDED Requirements

### Requirement: Non-interactive package creation

AgentDock SHALL create and verify a standalone domain package from a local JSON file or HTTPS URL.

#### Scenario: Create from a spec

- **WHEN** an agent supplies a valid spec
- **THEN** the command generates the workspace and package, preserves localized metadata, runs its checks, and returns the result without prompting

#### Scenario: Invalid spec

- **WHEN** the spec is malformed or unsupported
- **THEN** the command fails without creating a remote repository

### Requirement: Safe Gitee delivery

The command SHALL support creating and pushing to a Gitee enterprise repository and verifying its initial ref.

#### Scenario: Deliver a verified package

- **WHEN** local verification passes and the requested repository is absent
- **THEN** the command creates an empty private repository, pushes normally, and verifies the remote commit

#### Scenario: Existing unrelated repository

- **WHEN** the target already exists and cannot be tied to this creation
- **THEN** the command fails without modifying it
