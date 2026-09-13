## Purpose

Define predictable pnpm 12 onboarding for generated projects so incompatible package managers fail with actionable diagnostics instead of attempting a broken self-update.

## ADDED Requirements

### Requirement: Template-level pnpm guard

The template MUST keep pnpm 12 as the declared package manager while disabling pnpm's automatic package-manager switching and enabling strict engine validation.

#### Scenario: pnpm 10 runs install

- **WHEN** a developer runs `pnpm install` with pnpm 10
- **THEN** installation stops with `ERR_PNPM_UNSUPPORTED_ENGINE` and does not attempt to download or execute a pnpm 12 wrapper

#### Scenario: pnpm 12 runs install

- **WHEN** pnpm 12 runs `pnpm install --frozen-lockfile`
- **THEN** installation proceeds normally

### Requirement: Recovery instructions

The template MUST document how to obtain pnpm 12 when the local version is incompatible.

#### Scenario: Agent sees pnpm failure

- **WHEN** an agent reads `LLM.md` after a pnpm engine failure
- **THEN** it can choose either `pnpm self-update 12.4.1` or `npx pnpm@12.4.1` without searching external documentation
