# AgentDock Web-Next.js Template — Copilot Instructions

> Applies to: GitHub Copilot (chat + completions) in any project generated from this template.

## Directory Contract

This project enforces a four-layer directory contract. **Before placing any code**, confirm which layer it belongs to:

| Layer | Path | Purpose | Rules |
|---|---|---|---|
| **core** | `src/core/` | Stable domain layer — types, repository interfaces, pure logic | No framework imports, no DB clients, read-only |
| **features** | `src/features/` | AI coding zone — business features | Must have `__contract__.ts`; no direct DB access; no cross-feature imports |
| **infra** | `src/infra/` | Infrastructure — Supabase clients, third-party SDKs | Requires approval; only `core/repositories` implementations live here |
| **experiments** | `src/features/_experiments/` | Sandbox | Never imported by non-experimental features |

## Layer 2 Architecture Rules (error-level, enforced by ESLint)

Four rules are enforced at `error` severity in `src/features/**`. Violations fail `pnpm lint`.

1. **`no-direct-db-in-features`** — Features must not import from `infra/db`. Use repository interfaces from `src/core/repositories/` instead.
2. **`require-feature-contract`** — Every feature subdirectory must contain `__contract__.ts` declaring its public API boundary.
3. **`no-cross-feature`** — Features must not directly import from sibling feature internals. Import through the feature's `index.ts` only.
4. **`no-core-mutation`** — `src/core/` is read-only. Features and infra must not modify core types or interfaces in-place.

## Hard Rules

1. **No secrets** — Never write real API keys, tokens, or passwords. Use placeholders: `YOUR_KEY_HERE`, `process.env.YOUR_VAR`.
2. **TypeScript strict** — `strict: true` enforced. No `any`, no `// @ts-ignore` without explanation.
3. **Conventional commits** — `type(scope): summary` format required.
4. **pnpm only** — Do not use `npm install` or `yarn`. Always `pnpm add`.
5. **ESLint config** — Architecture rules come from `packages/eslint-config/features.js` in the AgentDock platform.

## Feature Development Pattern

When adding a new feature `src/features/<name>/`:

1. Create `__contract__.ts` first — declare input/output types and public API.
2. Create `service.ts` — pure business logic, no side effects.
3. Create `index.ts` — only export what `__contract__.ts` declares.
4. Create `<name>.test.ts` — Vitest unit tests.
5. Create page/component in `src/app/[locale]/` to consume the feature.

Reference implementation: `src/features/hello/`.
