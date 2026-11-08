## ADDED Requirements

### Requirement: Page provenance tracks the installed Astryx version

Every component page produced by the template MUST carry an `astryx-template` provenance marker whose
`astryx:` value equals the installed Astryx CLI version. `pnpm check:pages` MUST fail when a marker
is stale, naming both the expected and recorded versions.

#### Scenario: Astryx upgrade leaves a stale page marker

- **WHEN** the installed Astryx version differs from a page marker's `astryx:` value
- **THEN** `pnpm check:pages` fails with the expected installed version and the recorded version

#### Scenario: Generated sample pages remain current

- **WHEN** a project is generated from the template and the dependency lock is current
- **THEN** the sample pages' markers match the installed Astryx CLI version
