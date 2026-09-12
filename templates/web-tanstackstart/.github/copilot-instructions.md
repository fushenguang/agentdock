# AgentDock web-tanstackstart Template — Copilot Instructions

> Applies to GitHub Copilot and other agents working in generated projects.

## Stack

TanStack Start + TanStack Router, React 19, TypeScript 7, Vite 8, pnpm 12, Oxlint, Oxfmt, Vitest, Astryx, StyleX, Drizzle ORM, SQLite, and optional Supabase Postgres.

## Structure

| Path              | Responsibility                                                      |
| ----------------- | ------------------------------------------------------------------- |
| `src/routes/`     | File routes, loaders, and route components                          |
| `src/components/` | Shared UI composition                                               |
| `src/core/`       | Types and repository contracts; no framework or DB imports          |
| `src/features/`   | Feature behavior behind `__contract__.ts` and `index.ts`            |
| `src/infra/`      | Drizzle clients, dialect schemas, repositories, and provider wiring |

Data flow: route → feature → core repository contract → infra provider/implementation.

## Hard Rules

1. Features must not import `@/infra/db/**` directly.
2. Features must not import another feature's internals.
3. Core must not import features or infra.
4. Every feature directory must contain `__contract__.ts`.
5. Use `pnpm`; do not switch package managers.
6. Use TypeScript strict mode; no `any` and no unexplained `@ts-ignore`.
7. Use Astryx components and StyleX for UI. Prefer Astryx tokens over literals.
8. Never commit secrets. `.env.example` contains placeholders only.
9. Do not edit generated `src/routeTree.gen.ts` or Drizzle metadata by hand.

## Data Layer

`DATA_PROVIDER=sqlite` is the default and uses `better-sqlite3`.
`DATA_PROVIDER=supabase` uses the Postgres driver against a Supabase connection string with `prepare: false`.

Repository consumers must remain dialect-neutral. If behavior changes, update both schemas and both repository implementations.

## UI

- Use Astryx `Theme` and `LinkProvider` from the root route.
- Import Astryx CSS through `src/styles/app.css`; do not reorder the reset, component, and theme layers.
- Write first-party component styles with `stylex.create`.
- Follow `DESIGN.md` before adding visual patterns.
- Run the `impeccable` review for non-trivial UI work.

## Validation

```bash
pnpm generate-routes
pnpm format:check
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Use `pnpm check` for the complete gate. A change is not complete until the relevant gates pass.

## Skills

Start with `.github/skills/THIRD_PARTY_SKILLS.md`, then load the smallest relevant skill. `keel` and `coding-protocol` govern architecture/risk; Matt Pocock's engineering skills govern development workflow; `impeccable` governs UI quality.
