# LLM Development Guide

> Read this file before changing the project. It is the compact source of truth for technology rationale, architecture, constraints, and implementation workflows.

## 1. Project Mission

This is a standalone enterprise web application starter designed for AI coding agents and teams working in internal networks.

The project optimizes for:

- fast, repeatable agent feedback loops
- explicit boundaries between business behavior, domain contracts, and infrastructure
- a typed design system instead of free-form component styling
- SQLite as a zero-service default, with Supabase Postgres as an alternate repository implementation
- a single long-lived Node process and persistent filesystem by default

It is not a monorepo. Every application dependency, script, and source file lives at the repository root.

The default application frame also includes user-selectable Astryx themes, light/dark/system modes, and route-prefixed localization. These capabilities are part of the template contract rather than optional demo code.

## 2. Technology Stack And Rationale

| Technology              | Why it is here                                                                                               | Agent-facing consequence                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm 12                 | Content-addressed installs and workspace-ready dependency management; v12 uses the native implementation.    | Use pnpm only. The template disables automatic pnpm switching so incompatible pnpm versions fail cleanly instead of downloading a broken wrapper. |
| TypeScript 7            | Native compiler and faster type checking keep type verification inside the edit loop.                        | `pnpm check-types` is mandatory after meaningful code changes. Do not use `any` or unexplained `@ts-ignore`.                                      |
| Vite 8                  | Rolldown/Oxc-based development and production pipeline.                                                      | Use `pnpm dev` and `pnpm build`; do not add a second bundler.                                                                                     |
| TanStack Start          | Full-stack React framework with file routing, server functions, SSR, and streaming.                          | Route files live under `src/routes`; server-only work must use server functions or server-only modules.                                           |
| TanStack Router         | Type-safe route definitions, loaders, navigation, and invalidation.                                          | Route paths and parameters are part of the type contract. Use `router.invalidate()` after mutations when loader data must refresh.                |
| React 19                | Mature component model with transitions and async action support.                                            | Keep state local unless there is a clear cross-page owner.                                                                                        |
| Astryx                  | Meta design system with accessible components, prebuilt themes, i18n, templates, and a machine-readable CLI. | Prefer Astryx components, tokens, and shipped locale catalogs. Query the CLI before guessing APIs.                                                |
| StyleX                  | Type-safe, composable styling with compile-time CSS extraction.                                              | First-party styling uses `stylex.create`; do not add Tailwind or a runtime CSS-in-JS library.                                                     |
| Oxlint                  | Native static analysis with type-aware rules and fast feedback.                                              | `pnpm lint` is the architecture and static-analysis gate.                                                                                         |
| Oxfmt                   | Native formatter for TypeScript, JavaScript, JSON, CSS, and Markdown.                                        | Run `pnpm format` after edits and `pnpm format:check` before completion.                                                                          |
| Vitest                  | Vite-native unit test runner.                                                                                | Add tests next to the feature or infrastructure code they exercise.                                                                               |
| Drizzle ORM             | Explicit TypeScript schemas and SQL-first query composition.                                                 | Database access belongs in `src/infra/db`; features consume repository interfaces.                                                                |
| SQLite + better-sqlite3 | Zero external service by default and synchronous local persistence.                                          | Use `./data/app.db` unless `SQLITE_DATABASE_URL` is configured. Keep the filesystem persistent in production.                                     |
| Supabase Postgres       | Optional managed Postgres backend for internal deployments that need a shared database.                      | The same repository interface must work across SQLite and Supabase. Update both dialects when domain persistence changes.                         |
| srvx                    | Small production Node server adapter for the TanStack Start server bundle.                                   | `pnpm start` serves the built application; it is not a development command.                                                                       |

## 3. Architecture

```text
src/routes/
  TanStack Start route modules, loaders, server-function entrypoints

src/components/
  Shared presentation, layout shell, appearance controls, and locale controls

src/i18n/
  Supported locales, application message catalogs, and the Astryx i18n provider

src/core/
  Domain types and repository interfaces
  No React, router, Drizzle, Supabase, or Node infrastructure imports

src/features/
  Product behavior and use cases
  Every feature owns __contract__.ts and a public index.ts

src/infra/
  Drizzle clients, schemas, repository implementations, and provider wiring

src/styles/
  Global Astryx reset/component/theme imports and small global rules
```

### Dependency direction

```text
route -> feature -> core repository contract -> infra provider -> database
                         ^
                         |
                  domain types/contracts
```

Rules:

1. `core` must not import `features`, `infra`, React, or the router.
2. `features` must not import `infra/db` directly.
3. `features` must not import another feature's internals.
4. Each `src/features/<name>/` directory must contain `__contract__.ts`.
5. Each feature exposes only its intended public surface from `index.ts`.
6. Routes compose features. They must not contain database queries or business rules.
7. `infra` implements contracts. It must not import route components.
8. User-facing strings must be registered in `src/i18n/messages.ts`; do not add hard-coded UI copy to feature components.
9. First-party styling must use Astryx theme tokens. Do not special-case a theme name inside feature components.

## 4. Data Flow

The hello feature is the reference path:

```text
src/routes/$locale/hello.tsx
  -> src/features/hello/index.ts
  -> createServerFn in src/features/hello/server.ts
  -> src/features/hello/hello.ts
  -> src/core/repositories/greeting-repository.ts
  -> src/infra/providers.ts
  -> SQLite or Supabase repository
```

Provider selection is controlled by `DATA_PROVIDER`:

- `sqlite` (default): `SQLITE_DATABASE_URL`
- `supabase`: `SUPABASE_DATABASE_URL`

Supabase uses the `postgres` driver with `prepare: false` for transaction-pooler compatibility.

## 5. Package Manager Bootstrap

The project requires pnpm 12.

The template intentionally sets these values:

```dotenv
# .npmrc
manage-package-manager-versions=false
engine-strict=true
```

This prevents old pnpm versions from attempting a broken self-update. If pnpm is older than 12, install fails with `ERR_PNPM_UNSUPPORTED_ENGINE`.

Recovery options:

```bash
# Upgrade the active pnpm installation
npm_config_registry=https://registry.npmjs.org pnpm self-update 12.4.1
pnpm -v

# Or run this project without changing the global pnpm
npx --yes --registry=https://registry.npmjs.org pnpm@12.4.1 install
```

Do not remove `packageManager` to make an old pnpm pass. That weakens the declared toolchain.

## 6. Commands

```bash
pnpm dev                 # Vite development server
pnpm build               # Generate routes and produce client/server bundles
pnpm start               # Run the built Node server
pnpm generate-routes     # Regenerate src/routeTree.gen.ts
pnpm check-types         # Generate routes + TypeScript 7 check
pnpm lint                # Type-aware Oxlint + architecture rules
pnpm format              # Oxfmt write
pnpm format:check        # Oxfmt verification
pnpm test                # Vitest
pnpm check               # Full local gate
```

Database:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:generate:supabase
pnpm db:migrate:supabase
```

Preferred agent loop:

```text
edit -> focused test -> check-types -> lint -> format:check -> build
```

Run `pnpm check` before declaring a task complete.

## 7. Create A Business Feature

Use this directory shape:

```text
src/features/<feature>/
  __contract__.ts
  index.ts
  <feature>.ts
  <feature>.test.ts
  server.ts
```

### Step 1: define domain types and repository contracts

Put shared types in `src/core/types/` and interfaces in `src/core/repositories/`.

### Step 2: create the feature contract

`__contract__.ts` describes the feature's public inputs and outputs. It must not contain concrete database code.

### Step 3: implement the use case

Put orchestration in `<feature>.ts`. Import repository implementations through `src/infra/providers.ts`, never from `src/infra/db` directly.

### Step 4: expose server functions

Use `createServerFn` in `server.ts` for browser-callable server behavior.

### Step 5: export the public API

`index.ts` is the only module routes or other consumers may import.

### Step 6: add the route

Create `src/routes/$locale/<feature>.tsx`, use a loader or server function, and compose `PageContainer` and `PageHeader`.

### Step 7: verify

- Add at least one focused test.
- Run `pnpm check`.

## 8. Add A Database Table

1. Add the SQLite table in `src/infra/db/sqlite/schema.ts`.
2. Add the equivalent Postgres table in `src/infra/db/supabase/schema.ts`.
3. Add or update the core repository interface.
4. Implement both repository classes.
5. Update provider wiring if a new repository is introduced.
6. Generate migrations:

```bash
pnpm db:generate
pnpm db:generate:supabase
```

7. Review both generated SQL files.
8. Add repository contract tests using an in-memory SQLite database.

Do not edit generated Drizzle metadata manually.

## 9. Add A Route

Application pages are locale-prefixed. Add the file under `src/routes/$locale/` and declare the route with `$locale` in its path:

```tsx
// src/routes/$locale/customers.tsx
export const Route = createFileRoute("/$locale/customers")({
  component: CustomersPage,
});
```

1. Keep loaders thin. Put behavior behind the feature boundary.
2. Render content inside `PageContainer`.
3. Use `PageHeader` for the page title and description.
4. Add every visible string to `enCatalog` and `zhCNCatalog` in `src/i18n/messages.ts`.
5. If the route mutates data and loader output must refresh, call `router.invalidate()`.

The `/$locale` layout validates the locale, provides `InternationalizationProvider`, and wraps pages in `TemplateShell`. Global routes outside that layout must provide their own suitable document/i18n handling.

## 10. UI Development

Astryx is the component and design-token source. StyleX owns first-party layout and product styling.

Before using an unfamiliar component, query the Astryx CLI:

```bash
pnpm exec astryx component Button
pnpm exec astryx component --list
pnpm exec astryx docs theme
pnpm exec astryx docs tokens
pnpm exec astryx template --list
```

Rules:

- Use Astryx components before creating a replacement primitive. Check `Stack`, `Grid`, `Section`, `List`, `EmptyState`, `Center`, `Timestamp`, and the component-specific APIs before writing raw layout or collection markup.
- Custom wrappers are allowed only for repeated project conventions or semantic boundaries. A wrapper must delegate to Astryx primitives rather than reimplementing their layout, spacing, scrolling, or accessibility behavior.
- Use CSS variables such as `var(--color-text-primary)` and `var(--color-background-surface)`.
- Use `stylex.create` for custom layout and visual rules.
- Do not add Tailwind.
- Do not write hard-coded theme colors unless the value is intentionally outside the design system.
- Preserve CSS layer order: `reset < astryx-base < astryx-theme < product`.
- Support a minimum viewport width of 320px.
- Keep touch targets at least 44px in touch contexts.
- Include loading, empty, error, disabled, and success states where relevant.
- Resolve user-facing copy with `useTranslator()` and message keys instead of embedding literals in components.

The layout primitives are:

- `TemplateShell`: Astryx `AppShell` + `TopNav`
- `PageContainer`: standard max width and vertical rhythm
- `PageHeader`: page title, description, and actions

## 11. Themes And Localization

### Theme architecture

The template ships prebuilt Astryx themes plus Astryx's compiled CSS. The ordering in `src/styles/app.css` is intentional:

```text
reset < astryx component CSS < theme CSS < product CSS
```

`AppearanceProvider` owns the selected theme and color mode. It persists a compact first-party cookie named `agentdock.appearance`, whose value is `themeName.mode` (for example, `matcha.dark`). The cookie uses `Path=/`, `SameSite=Lax`, and a one-year lifetime; it is not an authentication or security boundary.

The root route reads the cookie before rendering and writes `data-astryx-theme` and `data-theme` onto `<html>`. The server-only read is isolated in `src/components/appearance/appearance-data.ts` through `createServerFn`; the client reads the same cookie through `appearance-persistence.ts`. The same initial appearance is passed to `AppearanceProvider`, so server HTML, hydration, and the first client render all agree. Keep server-only cookie access inside that server function boundary and do not add a root-level import of `@tanstack/react-start/server`, because it creates a production SSR chunk cycle in the current Rolldown pipeline. Do not replace this with a mount-time `useEffect` state copy or an unhydrated client-only store, because that causes a visible theme flash.

To add a built Astryx theme:

1. Add the official theme package to `package.json`.
2. Import its `theme.css` in the required layer order in `src/styles/app.css`.
3. Import the prebuilt theme object in `src/components/appearance/appearance.ts`.
4. Add its name to `THEME_NAMES` and `THEME_OPTIONS`.
5. Add or update the appearance configuration and cookie parsing tests.

Theme changes must not require feature components to know the active theme. Use semantic Astryx CSS variables such as `var(--color-background-surface)` and `var(--color-text-primary)`; switch themes through `Theme`.

### Localization architecture

Locales use a URL prefix. Simplified Chinese is the default:

```text
/zh-CN
/zh-CN/hello
/en
/en/hello
```

`src/routes/$locale.tsx` is the localized layout boundary. It validates the locale, provides Astryx `InternationalizationProvider`, and renders `TemplateShell`. `src/routes/index.tsx` redirects `/` to `DEFAULT_LOCALE`, which is `zh-CN`.

The locale registry lives in `src/i18n/locales.ts`. Application messages live in `src/i18n/messages.ts`; the Astryx shipped `zh-CN` catalog is merged under the application catalog so component labels are localized as well.

To add a locale:

1. Add the BCP 47 tag to `SUPPORTED_LOCALES` and its display label to `LOCALE_OPTIONS`.
2. Add the catalog to `APP_MESSAGES`.
3. Keep the catalog key set identical to `enCatalog`; `pnpm test` enforces parity.
4. Add any Astryx shipped locale catalog if one exists.
5. Verify `<html lang>` and direction behavior through `getLocaleDirection()`.

Rules:

- Use stable semantic keys such as `agentdock.hello.newGreeting`.
- Never concatenate translated fragments to form a sentence.
- Use the Astryx translator for component-provided labels as well as application labels.
- Preserve the current path, query string, and hash when switching locale.
- Keep locale-independent brand or language names in `LOCALE_OPTIONS`, not in translation catalogs.

## 12. Agent Skills

Skills live under `.github/skills/`.

- `keel`: architecture, module boundaries, migrations, and long-term evolution
- `coding-protocol`: risk-graded execution and verification discipline
- Matt Pocock engineering skills: requirements, TDD, diagnosis, implementation, review
- `impeccable`: UI critique, polish, responsiveness, accessibility, and anti-slop review

Start with the smallest relevant skill. `AGENTS.md` and this file override any conflicting skill advice.

## 13. Security And Boundaries

Never write:

- real API keys or tokens
- production database URLs
- Supabase service-role keys
- user credentials

Secret placeholders belong in `.env.example` only. `.env` files are ignored and excluded from scaffolded output.

Do not add dependencies without checking:

1. React 19 compatibility
2. Vite 8 compatibility
3. Node 22.13+ compatibility
4. client/server import safety
5. license compatibility

## 14. Common Failure Modes

### pnpm engine error

Use pnpm 12. Do not disable `engine-strict`.

### Server-only module imported into client code

Move the import behind a server function or mark it with `@tanstack/react-start/server-only`. Check that server-only code is not re-exported through a client-facing `index.ts`.

### Route tree missing

Run `pnpm generate-routes`. Do not edit `src/routeTree.gen.ts`.

### Database table missing

Run `pnpm db:migrate` for SQLite or `pnpm db:migrate:supabase` for Supabase before starting the app.

### Styles appear missing in development

Verify the root route links `/virtual:stylex.css` in development. Production build output includes StyleX CSS automatically.

### A theme is unavailable or visually incomplete

Confirm the theme package is installed, its compiled `theme.css` is imported in `src/styles/app.css`, and the theme is present in `THEME_NAMES`/`THEME_OPTIONS`.

### A page renders untranslated or falls back to English

Add the key to every catalog in `src/i18n/messages.ts`, keep the key sets in parity, and ensure the page is rendered under `src/routes/$locale.tsx`.

### Cross-feature or direct DB import

Fix the architecture. Move shared behavior to `core` or consume a repository through `infra/providers.ts`.

## 15. Definition Of Done

- Feature has `__contract__.ts`, `index.ts`, and tests.
- No direct `infra/db` import from a feature.
- SQLite and Supabase behavior remain aligned when persistence changes.
- UI uses Astryx components, tokens, and StyleX.
- New user-facing strings exist in every supported locale catalog.
- Theme and locale changes preserve the documented route, storage, and SSR contracts.
- `pnpm check` passes.
- No secrets or local database artifacts were added to source control.
- The change is documented in OpenSpec when it changes product behavior or architecture.
