# AgentDock web-tanstackstart Template — Copilot Instructions

> Applies to GitHub Copilot and other agents working in generated projects.

## Read First

Read `LLM.md` before making changes. It is the authoritative guide for technology choices, architecture, data flow, feature recipes, UI conventions, and verification. This file is the compact execution checklist.

## Stack

TanStack Start + TanStack Router, React 19, TypeScript 7, Vite 8, pnpm 12, Oxlint, Oxfmt, Vitest, Astryx, StyleX, Drizzle ORM, SQLite, and optional Supabase Postgres.

## Structure

| Path              | Responsibility                                                      |
| ----------------- | ------------------------------------------------------------------- |
| `src/routes/`     | File routes, loaders, and route components                          |
| `src/components/` | Shared UI, AppShell layout, appearance, and locale controls         |
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
8. Prefer native Astryx layout and collections such as `Stack`, `Grid`, `Section`, `List`, `EmptyState`, `Center`, and `Timestamp` over hand-rolled equivalents.
9. Use `AppearanceProvider` and prebuilt Astryx themes; do not create route-local theme state.
10. Put user-facing strings in all `src/i18n/messages.ts` catalogs and resolve them with `useTranslator()`.
11. Never commit secrets. `.env.example` contains placeholders only.
12. Do not edit generated `src/routeTree.gen.ts` or Drizzle metadata by hand.

## Data Layer

`DATA_PROVIDER=sqlite` is the default and uses `better-sqlite3`. `pnpm dev` applies pending SQLite migrations before Vite starts; `pnpm start` does not migrate implicitly.
`DATA_PROVIDER=supabase` uses the Postgres driver against a Supabase connection string with `prepare: false`; run `pnpm db:migrate:supabase` explicitly.

Repository consumers must remain dialect-neutral. If behavior changes, update both schemas and both repository implementations.

## pnpm Bootstrap

The project requires pnpm 12. `.npmrc` disables automatic package-manager switching and enables strict engine validation, so pnpm 10 fails cleanly instead of downloading a broken wrapper.

Recover with:

```bash
pnpm self-update 12.4.1
# or
npx --yes pnpm@12.4.1 install
```

## UI

- Use Astryx `Theme` and `LinkProvider` from the root route.
- Import Astryx CSS through `src/styles/app.css`; do not reorder the reset, component, and theme layers.
- Write first-party component styles with `stylex.create`.
- Keep theme CSS imports in `src/styles/app.css`; use `AppearanceProvider` for theme and mode selection.
- Keep localized pages under `src/routes/$locale/` and preserve path/query/hash when switching locale.
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
