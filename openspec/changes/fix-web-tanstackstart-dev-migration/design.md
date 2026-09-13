## Context

`web-tanstackstart` defaults to SQLite at `./data/app.db`. The database file may be created by the driver before any migration has run, so the failure is not an obviously missing file; it surfaces later as `no such table: greetings` in the reference route.

## Goals / Non-Goals

**Goals:**

- Make the default SQLite first-run path work with `pnpm install && pnpm dev`.
- Keep migration behavior explicit and safe for Supabase.
- Preserve explicit migration commands for production and other controlled environments.

**Non-Goals:**

- Automatically migrating a shared Supabase/Postgres database during development.
- Replacing Drizzle Kit or introducing an application-level schema bootstrap.
- Changing production `pnpm start` to run migrations implicitly.

## Decisions

### D1: Provider-aware pre-dev migration

`pnpm dev` invokes `pnpm dev:prepare` before Vite. The preparation script inspects `DATA_PROVIDER`:

- `sqlite` or unset: run `pnpm db:migrate`.
- `supabase`: print the required `pnpm db:migrate:supabase` command and skip automatic migration.
- unsupported value: fail with a clear diagnostic.

This keeps the common local path zero-friction while preventing accidental schema writes to a remote shared database. Production startup remains explicit.

### D2: Keep the prep script small and dependency-free

The preparation logic lives in `scripts/prepare-dev-db.mjs` and uses only Node built-ins. It runs the existing Drizzle Kit scripts rather than duplicating migration logic in application code.

## Risks / Trade-offs

- [Repeated local migration commands] → Drizzle Kit is idempotent and records applied migrations, so repeated `pnpm dev` calls are safe.
- [Supabase schema drift is not repaired automatically] → This is intentional; the script prints the explicit migration command instead of touching shared infrastructure.
- [Script logic can drift from provider names] → Add a template configuration test and keep provider validation aligned with `src/infra/providers.ts`.
