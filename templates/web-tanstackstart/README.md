# {{PROJECT_NAME}}

Standalone enterprise web starter built with TanStack Start, React, Astryx/StyleX and Drizzle.

## Stack

- pnpm 12, Node 22.13+
- TypeScript 7, Vite 8, TanStack Start/Router
- React 19, Astryx 0.6 with prebuilt multi-theme support, StyleX 0.19
- Drizzle ORM 0.45 with SQLite by default and Supabase Postgres as an alternate provider
- Oxlint + type-aware Oxlint, Oxfmt, Vitest

## Start

The project requires pnpm 12. If the local pnpm is older, use one of these recovery paths before installing:

```bash
npm_config_registry=https://registry.npmjs.org pnpm self-update 12.4.1
# or
npx --yes --registry=https://registry.npmjs.org pnpm@12.4.1 install
```

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`. The root route redirects to the default Chinese application at `http://localhost:3000/zh-CN`.

## Themes And Languages

The shell includes appearance and language switchers.

- Astryx themes: Neutral, Butter, Matcha, Stone
- Color modes: system, light, dark
- Locales: Simplified Chinese (`/zh-CN`, default) and English (`/en`)

UI composition prefers native Astryx primitives such as `Stack`, `Grid`, `Section`, `List`, `EmptyState`, `Center`, and `Timestamp`; custom wrappers delegate to Astryx instead of reimplementing its behavior. Theme and mode preferences persist in the first-party `agentdock.appearance` cookie so SSR can render the saved appearance without a hydration flash. Application copy lives in `src/i18n/messages.ts`; locale and theme extension rules are documented in `LLM.md` and `DESIGN.md`.

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

The reference `/{locale}/hello` feature demonstrates the complete path from a TanStack server function to SQLite or Supabase through a repository.

## Agent Assets

Start with `LLM.md` for the complete Agent-oriented project guide. See also `AGENTS.md`, `.github/copilot-instructions.md`, and `DESIGN.md`. Vendored third-party skills and their provenance are documented under `.github/skills/THIRD_PARTY_SKILLS.md`.

## License

MIT
