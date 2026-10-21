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
