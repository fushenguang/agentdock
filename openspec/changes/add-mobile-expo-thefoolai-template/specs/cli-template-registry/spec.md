# cli-template-registry Specification

## ADDED Requirements

### Requirement: Mobile Expo template registry metadata

The CLI registry SHALL expose `mobile-expo-thefoolai` as a standalone pnpm template with SQLite as its
default and only declared data layer.

#### Scenario: The template is discoverable

- **WHEN** the CLI loads its template registry
- **THEN** `getTemplate('mobile-expo-thefoolai')` resolves to `templates/mobile-expo-thefoolai`
- **AND** its default data layer is `sqlite`
- **AND** its dependency metadata contains no unresolved `workspace:*` entry
