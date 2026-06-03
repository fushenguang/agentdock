# AgentDock Web-Next.js Template — Copilot Instructions

> Applies to: GitHub Copilot (chat + completions) in any project generated from this template.

## Monorepo Structure

This project is a turborepo + pnpm monorepo with two applications:

| Directory    | Purpose                                                              |
| ------------ | -------------------------------------------------------------------- |
| `apps/web/`  | Main Next.js 16 application (four-layer contract, features, i18n)    |
| `apps/docs/` | Fumadocs documentation site (features, decisions, changelog, roadmap)|
| `packages/`  | Shared tooling packages (eslint-config, tsconfig)                    |

Run all commands from the monorepo root: `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm check-types`.

## Directory Contract

This project enforces a four-layer directory contract inside `apps/web/`. **Before placing any code**, confirm which layer it belongs to:

| Layer           | Path                                  | Purpose                                                        | Rules                                                                      |
| --------------- | ------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **core**        | `apps/web/src/core/`                  | Stable domain layer — types, repository interfaces, pure logic | No framework imports, no DB clients, read-only                             |
| **features**    | `apps/web/src/features/`              | AI coding zone — business features                             | Must have `__contract__.ts`; no direct DB access; no cross-feature imports |
| **infra**       | `apps/web/src/infra/`                 | Infrastructure — Supabase clients, third-party SDKs            | Requires approval; only `core/repositories` implementations live here      |
| **experiments** | `apps/web/src/features/_experiments/` | Sandbox                                                        | Never imported by non-experimental features                                |

## Layer 2 Architecture Rules (error-level, enforced by ESLint)

Four rules are enforced at `error` severity in `apps/web/src/features/**`. Violations fail `pnpm lint`.

1. **`no-direct-db-in-features`** — Features must not import from `infra/db`. Use repository interfaces from `apps/web/src/core/repositories/` instead.
2. **`require-feature-contract`** — Every feature subdirectory must contain `__contract__.ts` declaring its public API boundary.
3. **`no-cross-feature`** — Features must not directly import from sibling feature internals. Import through the feature's `index.ts` only.
4. **`no-core-mutation`** — `apps/web/src/core/` is read-only. Features and infra must not modify core types or interfaces in-place.

## Docs Co-evolution

Documentation lives alongside the application and grows with it:

- **Feature docs**: When adding a new feature, create `apps/docs/content/docs/features/<name>.mdx` documenting its purpose, API, and architecture notes.
- **Architecture decisions**: Record significant decisions in `apps/docs/content/docs/decisions/<adr-id>.mdx` (e.g., `001-database-choice.mdx`).
- **Changelog & Roadmap**: After archiving a change in `openspec/`, run `pnpm docs:sync` from the monorepo root to auto-generate changelog and roadmap pages in `apps/docs/`.

## Hard Rules

1. **No secrets** — Never write real API keys, tokens, or passwords. Use placeholders: `YOUR_KEY_HERE`, `process.env.YOUR_VAR`.
2. **TypeScript strict** — `strict: true` enforced. No `any`, no `// @ts-ignore` without explanation.
3. **Conventional commits** — `type(scope): summary` format required.
4. **pnpm only** — Do not use `npm install` or `yarn`. Always `pnpm add`.
5. **ESLint config** — Architecture rules come from `packages/eslint-config/features.js`.

## Feature Development Pattern

When adding a new feature `apps/web/src/features/<name>/`:

1. Create `__contract__.ts` first — declare input/output types and public API.
2. Create `service.ts` — pure business logic, no side effects.
3. Create `index.ts` — only export what `__contract__.ts` declares.
4. Create `<name>.test.ts` — Vitest unit tests.
5. Create page/component in `apps/web/src/app/[locale]/` to consume the feature.
6. Create `apps/docs/content/docs/features/<name>.mdx` — feature documentation.

Reference implementation: `apps/web/src/features/hello/`.

