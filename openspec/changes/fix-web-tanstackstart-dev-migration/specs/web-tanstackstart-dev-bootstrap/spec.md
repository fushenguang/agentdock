## Purpose

Make the generated template's default SQLite development path work on first run without weakening explicit production or remote-database migration boundaries.

## ADDED Requirements

### Requirement: SQLite development bootstrap

The template MUST apply pending SQLite migrations before starting the development server when `DATA_PROVIDER` is unset or set to `sqlite`.

#### Scenario: New SQLite project starts

- **WHEN** a developer runs `pnpm install` followed by `pnpm dev` in a new project
- **THEN** pending SQLite migrations are applied before Vite starts and the reference `/zh-CN/hello` route does not fail with `no such table: greetings`

#### Scenario: Existing SQLite project restarts

- **WHEN** a developer runs `pnpm dev` again after migrations have already been applied
- **THEN** Drizzle Kit treats the migration as already applied and the development server still starts

### Requirement: Remote database safety

The template MUST NOT automatically apply SQLite migrations when `DATA_PROVIDER=supabase`.

#### Scenario: Supabase provider starts

- **WHEN** a developer runs `pnpm dev` with `DATA_PROVIDER=supabase`
- **THEN** the preparation step skips automatic migration and prints the explicit `pnpm db:migrate:supabase` instruction instead

### Requirement: Production migration boundary

The production `pnpm start` command MUST NOT apply migrations implicitly.

#### Scenario: Production server starts

- **WHEN** the built application is started with `pnpm start`
- **THEN** migration remains an explicit operator action and startup behavior does not change
