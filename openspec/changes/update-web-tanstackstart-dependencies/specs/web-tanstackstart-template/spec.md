## Purpose

Keep new `web-tanstackstart` projects on the current stable dependency baseline
while preserving the template's existing runtime and package-manager support.

## ADDED Requirements

### Requirement: Current stable dependency baseline

The template MUST resolve all direct runtime and development dependencies to
stable npm releases at update time. TanStack Start and TanStack Router MUST use
the current stable v1 line, and dependency updates MUST NOT change the template's
supported Node or pnpm ranges.

#### Scenario: Updated template has no stale direct dependencies

- **WHEN** the standalone template is checked with pnpm's latest dependency
  update mode after an update
- **THEN** no direct dependency is reported as outdated and no prerelease is
  installed as the selected stable version

#### Scenario: Updated dependency graph remains buildable

- **WHEN** a developer runs `pnpm check` in the updated template
- **THEN** formatting, linting, type checking, tests, and the production client
  and SSR builds all pass
