# AgentDock Web-Next.js Template — Copilot Instructions

> Applies to: GitHub Copilot (chat + completions) in any project generated from this template.

## Monorepo Structure

This project is a turborepo + pnpm monorepo with two applications:

| Directory    | Purpose                                                               |
| ------------ | --------------------------------------------------------------------- |
| `apps/web/`  | Main Next.js 16 application (four-layer contract, features, i18n)     |
| `apps/docs/` | Fumadocs documentation site (features, decisions, changelog, roadmap) |
| `packages/`  | Shared tooling packages (eslint-config, tsconfig)                     |

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

## CSS Design System

This project uses a token-based CSS design system. **Always use semantic tokens**, not arbitrary Tailwind values.

### Token Usage Rules

| Rule            | Do This                                 | Not This                  |
| --------------- | --------------------------------------- | ------------------------- |
| Background      | `bg-surface`, `bg-surface-elevated`     | `bg-gray-100`, `bg-white` |
| Text muted      | `text-muted-foreground`                 | `text-gray-500`           |
| Border          | `border-border`                         | `border-gray-200`         |
| Primary         | `bg-primary`, `text-primary-foreground` | `bg-blue-500`             |
| Section padding | `p-[var(--space-section)]` or `clamp()` | Hardcoded `px-16 py-24`   |

### Tailwind `@theme` Registration

The following semantic tokens are registered in `globals.css` `@theme` and available as Tailwind utilities:

- `--color-surface`, `--color-surface-elevated`
- `--color-muted-custom`, `--color-muted-foreground-custom`
- `--color-border-custom`
- `--color-primary-custom`, `--color-primary-foreground-custom`

## Responsive Design Rules (Mobile-First)

- **DEFAULT**: Write mobile styles first (unprefixed Tailwind classes)
- **ENHANCEMENT**: Add desktop styles with `md:` / `lg:` prefixes
- **FORBIDDEN**: Never use `max-md:` / `max-lg:` downgrade patterns
- **Section spacing**: Use `clamp(32px, 8vw, 80px)` for section padding
- **Hero font**: Use `clamp(2rem, 5vw + 1rem, 4rem)` for hero titles
- **Touch targets**: All buttons and links must be at least `min-h-[44px] min-w-[44px]`
- **Container queries**: Use `@container` for component-level responsiveness (e.g., feature cards)

## UI Anti-Patterns (AI Slop)

The following patterns are **strictly forbidden**. AI must self-check before generating UI:

1. **Inter + Roboto font dominance** — Geist is the primary font.
2. **Purple-to-blue gradients** — `from-purple-* to-blue-*` is banned.
3. **Nested rounded cards** — No `rounded-xl` inside `rounded-xl`.
4. **Pure black / pure gray text** — All neutrals must carry subtle hue.
5. **Bounce / elastic easing** — No bounce or spring animations.
6. **Neon glowing header text** — No text-shadow glow on dark backgrounds.
7. **Icon tile above every heading** — No rounded square icon tiles above section headings.

Reference: `DESIGN.md` for full design system context.

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
6. **Design system** — Use semantic tokens from `tokens.css`. Never hardcode colors or spacing.

## Feature Development Pattern

When adding a new feature `apps/web/src/features/<name>/`:

1. Create `__contract__.ts` first — declare input/output types and public API.
2. Create `service.ts` — pure business logic, no side effects.
3. Create `index.ts` — only export what `__contract__.ts` declares.
4. Create `<name>.test.ts` — Vitest unit tests.
5. Create page/component in `apps/web/src/app/[locale]/` to consume the feature.
6. Create `apps/docs/content/docs/features/<name>.mdx` — feature documentation.

Reference implementation: `apps/web/src/features/hello/`.
