# cli-template-registry Specification

## ADDED Requirements

### Requirement: Mobile Expo template registry metadata

The CLI registry SHALL expose `expo-app` as a standalone pnpm template with SQLite as its
default and only declared data layer.

#### Scenario: The template is discoverable

- **WHEN** the CLI loads its template registry
- **THEN** `getTemplate('expo-app')` resolves to `templates/expo-app`
- **AND** its default data layer is `sqlite`
- **AND** its dependency metadata contains no unresolved `workspace:*` entry

#### Scenario: Local mobile acceptance artifacts remain outside scaffolds and published packages

- **WHEN** an `expo-app` source checkout contains generated `.expo/`, `ios/`, or `android/` state
- **THEN** scaffolding and CLI package builds exclude those directories without traversing their contents
- **AND** the generated project receives only source-owned template files
