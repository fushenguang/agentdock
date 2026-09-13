---
roadmap-id: web-tanstackstart-template
---

## Why

New `web-tanstackstart` projects use SQLite by default but do not create the schema until `pnpm db:migrate` is run manually. A developer who follows `pnpm install` directly with `pnpm dev` receives `no such table: greetings` on the reference feature, which makes the generated project appear broken during first-run onboarding.

## What Changes

- Add a provider-aware development preparation step before `vite dev`.
- Automatically apply SQLite migrations for the default `DATA_PROVIDER=sqlite`.
- Skip automatic migration for Supabase and print an explicit instruction to run `pnpm db:migrate:supabase`, avoiding accidental writes to a shared remote database.
- Update README and LLM guidance so first-run and production migration behavior are unambiguous.
- Add template configuration coverage for the development bootstrap scripts.

## Capabilities

### New Capabilities

- `web-tanstackstart-dev-bootstrap`: first-run development bootstrap behavior for the template's supported data providers.

### Modified Capabilities

## Impact

- `templates/web-tanstackstart/package.json`
- `templates/web-tanstackstart/scripts/prepare-dev-db.mjs`
- Template README, LLM guide, and configuration tests
- No application runtime or production server behavior changes

## Non-goals

- Automatically migrate shared Supabase/Postgres databases during development.
- Change production `pnpm start` to run migrations implicitly.
- Replace Drizzle Kit or add application-runtime schema initialization.
