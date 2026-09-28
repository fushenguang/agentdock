# LLM Development Guide

This is the primary implementation guide for the child-oriented TanStack Start template.

## Product Intent

The template exists for products built for children. It must feel warm, safe, encouraging, playful, and calm while adapting support to developmental needs. It is inspired by the quality of the `animal-island-ui` design language, but it must not copy that project's implementation or assets.

Read:

- `DESIGN.md` for the visual and interaction contract.
- `docs/component-visuals.md` for the phase-one Astryx ownership map and wrapper boundaries.
- `docs/age-profiles.md` for the capability matrix.
- `docs/child-safety.md` for privacy, safety, and engagement rules.
- `docs/reference/animal-island-ui.md` for reference provenance and rejected risks.

## Stack

- Node 22.13+
- pnpm 10.34.5 through 12.x
- TypeScript 7 strict
- Vite 8
- React 19
- TanStack Start and TanStack Router
- Astryx 0.6 components, tokens, themes, and accessibility hooks
- StyleX 0.19 for first-party styling
- Drizzle ORM 0.45
- SQLite by default; Supabase Postgres is the alternate provider
- Oxlint / Oxfmt / Vitest / axe / Playwright

## Directory Layout

```text
src/
  components/
    appearance/       age profiles, themes, SSR profile cookie, provider
    kids/             child-facing semantic wrappers and pages
    locale/           locale switcher
  core/               domain types and repository contracts
  features/           product behavior behind typed contracts
  i18n/               locale registry and application catalogs
  infra/              Drizzle clients, schemas, repositories, provider wiring
  routes/             TanStack file routes
  styles/             Astryx layer imports and global product CSS
```

Data flow:

```text
route → feature public contract → core repository contract → infra provider → Drizzle implementation
```

Features must not import `infra/db/**` directly. Core must not import feature or infra code.

## Astryx Kernel Boundary

Astryx owns component behavior, focus, keyboard interaction, ARIA, selection, dialogs, validation, progress announcements, and component-level accessibility behavior.

Do not:

- fork or swizzle Astryx source;
- patch generated Astryx CSS;
- copy an Astryx component into this template to restyle it;
- recreate focus traps, selections, dialogs, validation, or key handling;
- use raw HTML when Astryx owns the semantic component.

Allowed extension paths:

- `defineTheme` for token and component overrides;
- `astryx theme build` for prebuilt CSS and JavaScript;
- `xstyle` for component-specific StyleX;
- semantic wrappers that add layout, child policy, content, or illustration;
- Astryx slots and compound components;
- Astryx hooks when building custom composite behavior.

## Child Experience System

### Themes

Theme source lives under `src/components/appearance/themes/`:

- `kids-base.ts`
- `kids-sprout.ts`
- `kids-explorer.ts`
- `kids-creator.ts`

Generated files share the same basename:

```text
kids-sprout.css
kids-sprout.js
kids-sprout.d.ts
kids-sprout.variants.d.ts
```

Edit source, then run:

```bash
pnpm theme:build
pnpm theme:check
```

Never edit generated files manually.

### Profiles And Capabilities

`src/components/appearance/kids-experience.ts` defines:

- `AgeBand`: `sprout`, `explorer`, `creator`;
- `KidsThemeMode`: `system`, `light`, `dark`;
- `ChildCapabilities`;
- the coarse cookie contract;
- profile presets and override resolution.

`ChildExperienceProvider` selects the prebuilt theme and exposes capabilities. Use `useChildExperience()`.

Feature components must use capability semantics such as `minTargetSize`, `maxPrimaryChoices`, `readingSupport`, `motion`, `confirmation`, and `timeoutPolicy`. Do not read a raw age or branch on `sprout`/`explorer`/`creator` inside a feature.

### SSR

The root route resolves the initial profile before render and writes:

- `data-astryx-theme`
- `data-kid-profile`
- `data-kid-reading-mode`
- `data-theme`

The profile cookie stores only `ageBand.mode`, for example `explorer.system`. Do not add a birth date or exact age. If a consuming product needs another resolver, preserve the same pre-render contract and provide the same capability shape.

## Child Components

Use the components in `src/components/kids/` for repeated child semantics:

- `KidShell`
- `KidPageHeader`
- `KidActionCard`
- `KidChoice`
- `KidProgress`
- `KidState`
- `KidIllustration`
- `KidReadAlong`
- `GuardianGate`

These are thin semantic wrappers. Preserve underlying Astryx behavior and accessible names. Add new wrappers only when a repeated product convention or semantic boundary exists.

## Page Development

Add application pages under `src/routes/$locale/`.

Recommended page pattern:

```tsx
<Stack gap={8} width="100%" maxWidth={1120}>
  <KidPageHeader title={...} description={...} illustration={...} actions={...} />
  <Grid columns={{ minWidth: 260, max: 3 }} gap={5}>
    ...
  </Grid>
</Stack>
```

Rules:

- one primary action per meaningful region;
- generous spacing for younger profiles;
- no nested cards;
- avoid dense tables and multi-level filters in child-facing primary flows;
- show the next step when a state is empty, waiting, offline, or failed;
- never block completion on audio or animation.

## Content And i18n

All user-facing copy belongs in `src/i18n/messages.ts`. Keep `enCatalog` and `zhCNCatalog` key parity.

Use `useTranslator()`:

```tsx
const t = useTranslator();
<Heading level={1}>{t("agentdock.home.title")}</Heading>
<Text>{t("agentdock.activity.step", { current: 1, total: 3 })}</Text>
```

Copy rules:

- short, concrete, active sentences;
- no blame, fear, urgency, shame, public comparison, or streak pressure;
- explain how to recover from errors;
- make the next action understandable without relying on color.

## Guardian Boundary

Use `GuardianGate` before external links, purchases, sensitive requests, major settings, or public sharing. The gate is an interaction safeguard, not a legal certification. Product teams still own consent, privacy, and jurisdiction-specific requirements.

## Visual Assets

Use original SVG/CSS or assets with recorded provenance.

Do not copy:

- historical assets from `animal-island-ui`;
- character or game-derived visuals;
- fonts or illustrations whose redistribution rights are unclear;
- emoji as a UI icon system.

Fonts currently come from Fontsource variable packages. Any new asset must pass `pnpm assets:check` and record source/license.

## Data Layer

SQLite is the default:

```dotenv
DATA_PROVIDER=sqlite
SQLITE_DATABASE_URL=./data/app.db
```

Supabase Postgres:

```dotenv
DATA_PROVIDER=supabase
SUPABASE_DATABASE_URL=postgres://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:6543/postgres
```

Keep repository contracts dialect-neutral. Update both schemas and both repositories when persistence behavior changes.

## Verification

Useful commands:

```bash
pnpm test
pnpm test:a11y
pnpm theme:check
pnpm assets:check
pnpm boundaries:check
pnpm check-types
pnpm lint
pnpm format:check
pnpm build
pnpm check
pnpm check:full
```

`pnpm check` is the standard acceptance gate.

`pnpm check:full` additionally runs visual regression and bundle budgets.

## Failure Recovery

### Theme missing or wrong

- Confirm the generated `.css`, `.js`, and `.d.ts` files exist.
- Run `pnpm theme:build`.
- Confirm `src/styles/app.css` imports all three theme CSS files.
- Confirm the root document writes `data-astryx-theme`.

### Theme flashes on reload

- Confirm the root route resolves the profile before render.
- Confirm the cookie parser is used on both server and client.
- Do not move profile initialization to a mount-only effect.

### Component behavior looks wrong

- Check whether a wrapper changed semantics or focus behavior.
- Revert to the Astryx primitive and apply `xstyle`, theme overrides, or a slot instead.
- Do not patch Astryx source.

### Audio read-along fails

- Confirm the browser supports `speechSynthesis`.
- Keep the text transcript available even when audio is unavailable.
- Never autoplay audio.
