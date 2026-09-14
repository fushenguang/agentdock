# {{PROJECT_NAME}}

Enterprise web starter built with TanStack Start, React, Astryx/StyleX and Drizzle. It supports standalone generation and generation as a member of an existing pnpm workspace.

## Stack

- pnpm 10.34.5–12.x, Node 22.13+
- TypeScript 7, Vite 8, TanStack Start/Router
- React 19, Astryx 0.6 with prebuilt multi-theme support, StyleX 0.19
- Drizzle ORM 0.45 with SQLite by default and Supabase Postgres as an alternate provider
- Oxlint + type-aware Oxlint, Oxfmt, Vitest

## Start

If `.agentdock/workspace.json` exists, this package is a workspace member. Install from the workspace root and validate with `pnpm --filter <package-name> check`. The section below describes standalone output, where this directory owns its `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and supported pnpm range.

The standalone project supports pnpm `>=10.34.5 <13` and recommends pnpm 12.4.1. The project intentionally does not pin `packageManager`, so pnpm 10 users do not trigger the unreliable pnpm auto-switch path. If the local pnpm is older than 10.34.5, update within the supported range before installing:

```bash
npm_config_registry=https://registry.npmjs.org pnpm self-update 10.34.5
# or, for the recommended version
npm_config_registry=https://registry.npmjs.org pnpm self-update 12.4.1
```

```bash
cp .env.example .env
pnpm install
pnpm dev
```

`pnpm dev` automatically applies pending SQLite migrations before Vite starts. The production `pnpm start` command does not run migrations implicitly; apply them explicitly during deployment.

Open `http://localhost:3000`. The root route redirects to the default Chinese application at `http://localhost:3000/zh-CN`.

## Themes And Languages

The shell includes appearance and language switchers.

- Astryx themes: Neutral, Butter, Matcha, Stone
- Color modes: system, light, dark
- Locales: Simplified Chinese (`/zh-CN`, default) and English (`/en`)

UI composition prefers native Astryx primitives such as `Stack`, `Grid`, `Section`, `List`, `EmptyState`, `Center`, and `Timestamp`; custom wrappers delegate to Astryx instead of reimplementing its behavior. Theme and mode preferences persist in the first-party `agentdock.appearance` cookie so SSR can render the saved appearance without a hydration flash. Application copy lives in `src/i18n/messages.ts`; locale and theme extension rules are documented in `LLM.md` and `DESIGN.md`.

## Commands

```bash
pnpm dev                 # Apply SQLite migrations, then start the development server
pnpm dev:prepare         # Apply migrations for the selected development data provider
pnpm build               # Generate routes and build client + server bundles
pnpm start               # Run the production Node server
pnpm generate-routes     # Regenerate TanStack routeTree.gen.ts
pnpm check-types         # Generate routes, then run TypeScript 7
pnpm lint                # Type-aware Oxlint + architecture rules
pnpm format:check        # Oxfmt verification
pnpm test                # Vitest
pnpm check               # Full local gate
```

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:generate:supabase
pnpm db:migrate:supabase
```

## Data Providers

SQLite is the default:

```dotenv
DATA_PROVIDER=sqlite
SQLITE_DATABASE_URL=./data/app.db
```

When `DATA_PROVIDER=supabase`, `pnpm dev` skips automatic SQLite migration and prints the explicit `pnpm db:migrate:supabase` command instead.

Supabase Postgres uses the same repository contract:

```dotenv
DATA_PROVIDER=supabase
SUPABASE_DATABASE_URL=postgres://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:6543/postgres
```

The Postgres client uses `prepare: false` for compatibility with Supabase transaction pooling. This template targets a long-lived Node process for SQLite persistence; it does not provide an ephemeral/serverless SQLite strategy.

## Architecture

```text
src/routes       File routes and loaders
src/components   Shared presentation
src/core         Domain types and repository contracts
src/features     Feature use cases behind public contracts
src/infra        Drizzle schemas, clients, repository implementations, provider wiring
```

The reference `/{locale}/hello` feature demonstrates the complete path from a TanStack server function to SQLite or Supabase through a repository.

## Agent Assets

Start with `LLM.md` for the complete Agent-oriented project guide. See also `AGENTS.md`, `.github/copilot-instructions.md`, and `DESIGN.md`. Vendored third-party skills and their provenance are documented under `.github/skills/THIRD_PARTY_SKILLS.md`.

## License

MIT
