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
- **THEN** the top bar contains an icon-only drawer entry and new-session entry only
- **AND** the drawer expands from the left with a domain selector and session-history search at the
  top, a session list filling the remaining height, and a fixed user entry at the bottom
- **AND** the drawer's leading edge remains aligned with the physical screen's left edge while it
  animates from left to right
- **AND** primary navigation is limited to Domain Desktop and History & Tasks

#### Scenario: The user switches primary workspaces

- **WHEN** the user horizontally swipes the workspace layer or uses the workspace page indicator
- **THEN** the shell pages between Domain Desktop and History & Tasks
- **AND** the active route remains synchronized with the visible primary workspace

#### Scenario: The drawer opens over an expanded agent session

- **WHEN** the agent BottomSheet is open and the user activates the top-bar drawer entry
- **THEN** the agent sheet closes before the left drawer expands

#### Scenario: Low-frequency user information opens as a secondary route

- **WHEN** the user needs profile, privacy, storage, sync, notification, or about information
- **THEN** navigation goes to `/user/**` rather than adding a primary desktop or top-bar shortcut

### Requirement: Voice-first agent panel

The template SHALL keep a persistent agent voice entry available on primary screens. Activating it
SHALL open a BottomSheet fixed at approximately 80% of screen height. Prompt input controls SHALL be
docked to the sheet bottom, the input SHALL have a two-row minimum height, and the result plus
collapsed execution process SHALL occupy the remaining height in an independently scrolling region.

#### Scenario: The user starts a new session

- **WHEN** the new-session action is activated
- **THEN** a draft session is created and the agent sheet opens at its fixed session height
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

#### Scenario: The user-facing answer is conversational

- **WHEN** a validated `agent_result` uses the `text` result kind
- **THEN** ResultCanvas displays only the user-facing text with a native Text component
- **AND** envelope metadata, schema version, status, and JSON syntax remain invisible to the user

#### Scenario: Output fails after retries

- **WHEN** validation and the bounded retry budget are exhausted
- **THEN** the UI shows `structured_output_retries_exhausted` with actionable validation errors
- **AND** no raw free-text result is rendered as if it were structured data

### Requirement: Development provider and credential boundary

The template SHALL provide an OpenAI-compatible development driver behind `AgentTurnDriver` while
keeping the deterministic reference driver as the no-configuration default. The driver SHALL accept
an HTTPS provider base URL or an HTTP localhost proxy, SHALL NOT accept URL credentials, query
strings, or fragments, and SHALL send `EXPO_PUBLIC_AGENT_API_KEY` only in development. Release
bundling SHALL fail when that public key is configured, and all provider output SHALL remain behind
the structured-output gate.

#### Scenario: A developer configures a real provider

- **WHEN** development environment variables define a model and HTTPS OpenAI-compatible base URL
- **THEN** the mobile host calls that provider through `AgentTurnDriver`
- **AND** a configured API key is sent only in development
- **AND** the response remains raw provider output until the structured-output gate validates it

#### Scenario: The configuration is incomplete

- **WHEN** either the provider base URL or model is absent
- **THEN** the local reference driver remains active
- **AND** no provider request is made

#### Scenario: A release build would embed a public key

- **WHEN** `EXPO_PUBLIC_AGENT_API_KEY` is set in the build environment or a production env file
- **THEN** the production environment guard fails before export
- **AND** documentation directs production traffic through an authenticated server-side proxy

#### Scenario: The driver is tested without a device or real provider

- **WHEN** repository tests execute the development driver
- **THEN** environment, transport, timeout, and cancellation behavior are injected
- **AND** tests prove endpoint, request, response extraction, and credential boundaries

### Requirement: Mobile-local persistence boundary

The template SHALL provide SQLite migrations and repository contracts for sessions, events, memory
projections, permission decisions, and idempotent sync-outbox records. Persistence implementation
details MUST remain behind Agent Core data contracts.

#### Scenario: Sessions continue without network

- **WHEN** the app restarts without connectivity
- **THEN** local sessions, history, and audit events remain available
- **AND** remote mutations remain represented as outbox operations

### Requirement: Bilingual user preference

The template SHALL provide a user profile language setting with Simplified Chinese and English
options. Simplified Chinese SHALL be the default for a new installation, the selected preference
SHALL persist locally, primary shell/agent/user text SHALL follow the selection, and provider
user-facing output plus voice recognition SHALL receive the selected locale.

#### Scenario: A new user opens the app

- **WHEN** no language preference has been saved
- **THEN** the interface starts in Simplified Chinese

#### Scenario: The user changes language

- **WHEN** the user chooses English or Simplified Chinese in user settings
- **THEN** primary shell, agent, and user-setting copy update immediately
- **AND** the choice persists across app restarts
- **AND** subsequent provider output and speech recognition use the selected locale

### Requirement: Agent development surfaces

The generated project SHALL provide machine-readable route, action, and stable test-id maps under
`agent/`, and documentation SHALL instruct agents to update those maps whenever navigation or primary
actions change.

#### Scenario: A route is added

- **WHEN** an agent adds or renames a route or primary action
- **THEN** `agent/route-map.json`, `agent/action-map.json`, or `agent/testids.json` is updated in the
  same change
