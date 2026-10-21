# expo-app-template Specification

## ADDED Requirements

### Requirement: Expo mobile Agent Host baseline

The template SHALL scaffold an Expo SDK 57 React Native application using Expo Router, NativeWind 4,
source-owned `react-native-reusables` primitives, and `@expo/ui` for selected native controls.

#### Scenario: A standalone mobile project is generated

- **WHEN** `agentdock init` uses template `expo-app`
- **THEN** the generated project contains an Expo Router application and NativeWind configuration
- **AND** the generated package uses Expo SDK 57-compatible React, React Native, Router, and UI versions
- **AND** no `.git` directory or `node_modules` directory is copied.

#### Scenario: Native controls are used selectively

- **WHEN** the generated agent panel needs a bottom sheet
- **THEN** it uses the `@expo/ui` BottomSheet adapter rather than replacing the entire UI system

### Requirement: Two-layer mobile information architecture

The template SHALL provide a two-layer mobile UI: an agent interaction layer above a domain workspace
layer. The shell top bar SHALL expose exactly two entries: a left drawer/domain entry and a right
new-session action.

#### Scenario: The user opens the shell

- **WHEN** Domain Desktop renders
- **THEN** the top bar contains the drawer/domain entry and new-session entry only
- **AND** the drawer provides current domain, search, history, and user summary
- **AND** primary navigation is limited to Domain Desktop and History & Tasks

#### Scenario: Low-frequency user information opens as a secondary route

- **WHEN** the user needs profile, privacy, storage, sync, notification, or about information
- **THEN** navigation goes to `/user/**` rather than adding a primary desktop or top-bar shortcut

### Requirement: Voice-first agent panel

The template SHALL keep a persistent agent voice entry available on primary screens. Activating it
SHALL open a BottomSheet with approximately 25%, 50%, and 90% snap points for voice/status, focused
task/result, and full result/process states respectively.

#### Scenario: The user starts a new session

- **WHEN** the new-session action is activated
- **THEN** a draft session is created and the agent sheet opens at the voice/status snap point
- **AND** the sheet remains reachable while the user moves between primary work surfaces

#### Scenario: A long-running turn is visible

- **WHEN** a turn runs longer than three seconds
- **THEN** the agent panel shows the current stage
- **WHEN** it runs longer than ten seconds
- **THEN** elapsed time and completed step count remain visible
- **AND** the process log stays collapsed by default but can be expanded, and cancel remains available

### Requirement: Agent Core Lite boundary

The template SHALL provide mobile-local Agent Core Lite contracts for turn execution, context
envelopes, memory projections, typed tools, permission decisions, and audit events. Domain packages
MUST NOT receive authority over the LLM loop, context, memory, tool policy, or permissions.

#### Scenario: A tool requires approval

- **WHEN** a registered tool invokes a protected capability
- **THEN** execution pauses at the permission broker and records an allow/deny decision
- **AND** the decision and tool invocation appear in the local audit trail

#### Scenario: A domain package is mounted

- **WHEN** the Domain Desktop loads a package Web or capability
- **THEN** it exposes only machine-readable route/action surfaces to the agent host
- **AND** it does not start a second LLM loop or own agent memory

### Requirement: Structured output gate

The template SHALL validate every rendered result against an `agent_result` envelope using Zod
internally and JSON Schema 2020-12 across system boundaries. Invalid output SHALL pass through bounded
deterministic revive-only repair and targeted retry, and exhaustion SHALL produce an explicit typed
error. The renderer MUST NOT silently treat arbitrary assistant prose as a valid result.

#### Scenario: Output validates

- **WHEN** the provider returns a valid `agent_result` envelope
- **THEN** ResultCanvas renders the high-density native result

#### Scenario: Output fails after retries

- **WHEN** validation and the bounded retry budget are exhausted
- **THEN** the UI shows `structured_output_retries_exhausted` with actionable validation errors
- **AND** no raw free-text result is rendered as if it were structured data

### Requirement: Mobile-local persistence boundary

The template SHALL provide SQLite migrations and repository contracts for sessions, events, memory
projections, permission decisions, and idempotent sync-outbox records. Persistence implementation
details MUST remain behind Agent Core data contracts.

#### Scenario: Sessions continue without network

- **WHEN** the app restarts without connectivity
- **THEN** local sessions, history, and audit events remain available
- **AND** remote mutations remain represented as outbox operations

### Requirement: Agent development surfaces

The generated project SHALL provide machine-readable route, action, and stable test-id maps under
`agent/`, and documentation SHALL instruct agents to update those maps whenever navigation or primary
actions change.

#### Scenario: A route is added

- **WHEN** an agent adds or renames a route or primary action
- **THEN** `agent/route-map.json`, `agent/action-map.json`, or `agent/testids.json` is updated in the
  same change
