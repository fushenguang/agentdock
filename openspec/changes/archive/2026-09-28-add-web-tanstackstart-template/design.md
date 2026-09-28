## Context

See `proposal.md` for motivation. The repository currently has a Next.js monorepo template, a standalone Phaser template, and a registry-driven CLI whose data-layer prompts assume every template uses Supabase or Drizzle SQL. The new template must be a standalone application while reusing AgentDock's platform-level contracts: registry registration, placeholder scaffolding, OpenSpec, generated-project instructions, docs, changesets, and CI gates.

Version probes performed before this change established the compatible baseline:

- `pnpm@12.4.1` can install the proposed dependency graph.
- `vite@8.3.0`, `@tanstack/react-start@1.168.52`, React 19.3, Astryx 0.6 and Drizzle 0.45 build together.
- TypeScript 7.0.2 passes after TanStack routes are generated.
- Oxlint 1.82 plus `oxlint-tsgolint@7` provides type-aware linting.
- Oxfmt 0.67 must ignore generated route files and lockfiles.
- pnpm 12 no longer reads `package.json.pnpm`; build approval belongs in `pnpm-workspace.yaml.allowBuilds`.

## Goals / Non-Goals

**Goals:**

- Produce a runnable standalone TanStack Start application with a minimal end-to-end feature.
- Preserve AgentDock's four-layer architecture and AI execution boundaries without a monorepo.
- Make SQLite the zero-service default and Supabase Postgres a repository-compatible alternate source.
- Use custom StyleX in addition to Astryx's precompiled component styles.
- Make CLI data-layer prompts derive from template metadata rather than a hard-coded global choice.
- Gate the template with the exact runtime and tool versions it claims to support.

**Non-Goals:**

- Feature parity with web-nextjs.
- Supabase Auth, Storage, Realtime or hosted database provisioning.
- Stateless/edge deployment persistence for SQLite.
- Replacing web-nextjs or migrating its agents/config packages.
- Building a second copy of the platform docs site inside the template.

## Decisions

### D1: Standalone source layout, shared semantic layers

The template root is the application package. It keeps `src/routes` for TanStack file routes and `src/{core,features,infra}` for business boundaries. There is no `apps/web`, `packages`, Turborepo, or workspace package graph.

Alternative rejected: reuse the web-nextjs monorepo skeleton. It would add deployment and dependency indirection without an internal consumer for shared packages.

### D2: Pin the template runtime independently of the CLI runtime

The template declares `packageManager: pnpm@12.4.1`, Node `>=22.13.0`, Vite 8, TypeScript 7 and TanStack Start 1.x. The CLI may run on an older pnpm because platform CI still uses the repository's existing pnpm baseline. During scaffolding, an explicit template `packageManager` wins and is enforced; only templates without one receive the CLI host's detected version and the existing package-manager choice.

Alternative rejected: update the entire repository to pnpm 12. That would couple an optional template to the platform build and exceed the template's current compatibility need.

### D3: pnpm settings live in pnpm-workspace.yaml

The standalone template includes `pnpm-workspace.yaml` with `packages: []` and `allowBuilds` for Astryx, better-sqlite3, esbuild and lightningcss. This is configuration, not a workspace hierarchy.

Alternative rejected: keep `pnpm.onlyBuiltDependencies` in `package.json`. pnpm 12 ignores it and would fail strict dependency-build checks.

### D4: Astryx prebuilt CSS plus application StyleX build

Astryx prebuilt CSS is imported in layer order (`reset`, `astryx-base`, `theme`) and wrapped by Astryx `Theme` and `LinkProvider`. The application adds the official Astryx Vite StyleX plugin so first-party components can use `stylex.create`. The plugin is configured before the React/TanStack transform chain and the generated CSS participates in both client and SSR builds.

Alternative rejected: use prebuilt CSS only. It would not satisfy the requirement that the template demonstrate first-party StyleX authoring.

### D5: Repository interface with dialect-specific Drizzle schemas

`core/repositories` owns the greeting contract. `infra/db` owns provider selection, dialect schemas and concrete repositories. SQLite and Postgres have separate Drizzle schemas because Drizzle table builders are dialect-specific. The feature consumes only the repository interface.

The runtime provider is selected by `DATA_PROVIDER` with `sqlite` as the default. SQLite uses `better-sqlite3`; Supabase uses the Postgres driver with `prepare: false` for Supabase transaction pooler compatibility.

Alternatives rejected:

- `node:sqlite`: Drizzle's stable release does not expose the expected `drizzle-orm/node-sqlite` integration in this dependency line.
- Supabase PostgREST for the second adapter: it would not exercise Drizzle or the shared schema contract.
- One source schema reused for both dialects: Drizzle cannot share SQLite and Postgres table builders directly.

### D6: Template capability metadata drives CLI prompts

The registry entry adds `packageManager`, `dataLayers`, `defaultDataLayer`, and `supportsSchema`. Defaults preserve existing templates. `web-tanstackstart` declares `["sqlite", "supabase"]` with `sqlite` first and disables schema prompting. The selected layer is passed to scaffolding and substituted into the template's environment template.

Alternative rejected: add template-id conditionals in both human and agent adapters. Metadata-driven behavior is reusable for future templates and keeps prompt logic generic.

### D7: Generated files remain generated

TanStack's route tree is regenerated by `tsr generate` before type-aware lint and type checking. Oxlint and Oxfmt ignore the generated route tree to avoid formatting churn. Drizzle migrations remain explicit repository artifacts generated by Drizzle Kit and are committed when the schema changes.

Alternative rejected: require a prior build before `pnpm check-types`. The check command must be self-contained on a clean checkout.

### D8: Skills are pinned and attributable

The template includes compatible Agent Skills for architecture governance, coding protocol, TDD/diagnosis/review workflow and UI quality. Any copied third-party skill includes its source URL, upstream revision, and license. Skills that require incompatible runtimes or a non-React framework are not copied.

The template's `AGENTS.md` remains the execution contract; skills provide deeper task-specific guidance rather than replacing the platform boundaries.

## Risks / Trade-offs

- [TypeScript 7 is a native compiler with a new distribution shape] → Pin 7.x, keep `tsc --noEmit` as the type-check source of truth, and run it in CI on Node 24.
- [Oxlint JS plugins are alpha] → Keep custom architecture rules small, test their failure cases, and keep the rules limited to the four-layer contract.
- [Oxfmt is pre-1.0] → Pin the tested minor, ignore generated files, and run `format:check` in CI.
- [StyleX + TanStack Vite plugin ordering can change] → Add a build gate that imports both Astryx and a local StyleX rule; keep the plugin setup documented and version-pinned.
- [SQLite native builds need a toolchain] → Use pnpm's `allowBuilds`, test on Linux CI and macOS, and document better-sqlite3 prerequisites.
- [Postgres and SQLite schema drift] → Keep the repository contract dialect-neutral and add tests that instantiate both schema modules through shared contract cases.
- [Third-party Skills can become stale or license-incompatible] → Record provenance and revision in the template and validate during template tests.
- [CLI changes can regress web-nextjs scaffolding] → Add compatibility tests for legacy default `supabase`, Drizzle schema skipping, and workspace dependency rewriting.

## Migration Plan

1. Add the standalone template and lockfile without changing existing generated-project behavior.
2. Extend registry metadata with defaults that preserve current templates.
3. Update scaffold package-manager and placeholder behavior, then add regression tests for web-nextjs and game-web-phaser.
4. Update human and agent prompts to use template metadata.
5. Add docs, changeset, and CI.
6. Verify source templates, scaffolded output, root checks, OpenSpec validation, and secret scanning.

Rollback is a branch revert; existing templates are not migrated automatically, and generated projects remain independent copies.
