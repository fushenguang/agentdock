# {{PROJECT_NAME}}

A child-oriented web starter built with TanStack Start, React, Astryx/StyleX, and Drizzle. It keeps Astryx as the component and interaction kernel while adding an age-sensitive Child Experience System.

## Stack

- pnpm 10.34.5–12.x, Node 22.13+
- TypeScript 7, Vite 8, TanStack Start/Router
- React 19, Astryx 0.6 with three prebuilt child themes
- StyleX 0.19
- Drizzle ORM 0.45, SQLite by default, optional Supabase Postgres
- Oxlint + type-aware Oxlint, Oxfmt, Vitest, axe, Playwright

## Start

If `.agentdock/workspace.json` exists, this package is a workspace member. Install from the workspace root and run the filtered acceptance command. The instructions below describe standalone output.

```bash
cp .env.example .env
npx --yes pnpm@12.4.1 install
npx --yes pnpm@12.4.1 dev
```

Open `http://localhost:3000`. The root route redirects to the default Chinese application at `http://localhost:3000/zh-CN`.

## Child Experience

The template ships three developmental profiles:

- `sprout`: 3–5 preset, audio-first guidance, very large targets, airy density, one navigation level.
- `explorer`: 6–8 preset, mixed guidance, large targets, comfortable density, two navigation levels.
- `creator`: 9–12 preset, text-first guidance, more autonomy, focused density, up to three navigation levels.

Age is not stored as a precise value. The template persists only a coarse profile and resolves it to semantic capabilities such as target size, density, maximum choices, reading support, motion, guidance, confirmation, and timeout policy. Feature components consume capabilities rather than age labels.

## Visual Themes

Three prebuilt Astryx themes are generated from first-party source:

- `kids-sprout`
- `kids-explorer`
- `kids-creator`

Each theme supports light mode and a warm dusk dark mode. Fonts are self-hosted through Fontsource: Nunito Variable for Latin and Noto Sans SC Variable for Simplified Chinese, with system fallbacks.

## Astryx Boundary

Astryx owns:

- component behavior and structure;
- keyboard interaction;
- focus management;
- dialogs, validation, selection, progress, and announcements;
- semantic tokens and theme CSS;
- SSR behavior.

The template may add themes, tokens, `xstyle`, semantic wrappers, illustrations, and content. It must not fork, swizzle, or patch Astryx core.

## Child-Facing Components

- `KidShell`
- `KidPageHeader`
- `KidActionCard`
- `KidChoice`
- `KidProgress`
- `KidState`
- `KidIllustration`
- `KidReadAlong`
- `GuardianGate`
- `KidProfileSwitcher`

## Commands

```bash
pnpm dev                 # Apply SQLite migrations, then start Vite
pnpm build               # Generate routes and build client + server
pnpm start               # Run the production Node server
pnpm theme:build         # Rebuild the three Astryx child themes
pnpm theme:check         # Fail if generated theme artifacts are stale
pnpm test                # Unit and contract tests
pnpm test:a11y           # axe smoke tests for every age profile
pnpm test:visual         # Playwright visual matrix
pnpm check               # Full local production gate
pnpm check:full          # check + visual tests + bundle budgets
```

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:generate:supabase
pnpm db:migrate:supabase
```

## Safety And Privacy

The template defaults to no advertising, third-party behavioral tracking, social feeds, public child profiles, exact-age storage, streak pressure, or random reward loops. External, sensitive, or consequential actions can use `GuardianGate`. See `docs/child-safety.md`.

## Reference Provenance

`docs/reference/animal-island-ui.md` records the upstream design reference, reviewed commit, license, DMCA remediation context, adopted ideas, and rejected implementation risks. `animal-island-ui` is not a runtime dependency.

## Architecture

```text
src/routes       TanStack file routes
src/components   Child experience, appearance, locale, and shared UI
src/core         Domain types and repository contracts
src/features     Product behavior behind typed contracts
src/infra        Drizzle schemas, clients, repositories, and provider wiring
```

Data flow follows route → feature → core repository contract → infra implementation. SQLite is the default; Supabase uses the same repository contract.

## License

MIT
