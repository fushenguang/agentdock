# {{PROJECT_NAME}}

Standalone enterprise web starter built with TanStack Start, React, Astryx/StyleX and Drizzle.

## Stack

- pnpm 12, Node 22.13+
- TypeScript 7, Vite 8, TanStack Start/Router
- React 19, Astryx 0.6, StyleX 0.19
- Drizzle ORM 0.45 with SQLite by default and Supabase Postgres as an alternate provider
- Oxlint + type-aware Oxlint, Oxfmt, Vitest

## Start

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`.

## Commands

```bash
pnpm dev                 # Development server
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

The reference `/hello` feature demonstrates the complete path from a TanStack server function to SQLite or Supabase through a repository.

## Agent Assets

See `AGENTS.md`, `.github/copilot-instructions.md`, and `DESIGN.md`. Vendored third-party skills and their provenance are documented under `.github/skills/THIRD_PARTY_SKILLS.md`.

## License

MIT
