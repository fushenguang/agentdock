## Context

See `proposal.md` for motivation and `specs/` for the behavior contract.

The current CLI copies exactly one template directory and applies a small set of fixed rewrites. The current TanStack Start templates use Vite's environment build, a custom `server.mjs`, Drizzle provider wiring, and Astryx as the UI kernel. The official Mastra TanStack Start guide assumes an explicit Nitro plugin, which these templates do not currently use, so the integration must adapt the official adapter contract to the existing Vite/SSR pipeline rather than copying the guide literally.

## Goals / Non-Goals

**Goals:**

- Compose one shared Mastra runtime into either TanStack Start template through an explicit integration selection.
- Keep the default generated project unchanged, including files, dependencies, scripts, environment, lockfile behavior, and JSON shape.
- Keep Mastra server-only and keep both templates' UI and persistence kernels authoritative.
- Make MCP `scaffold_project` equivalent to the CLI headless path.
- Generate a real, documented authentication extension point without choosing an identity provider.

**Non-Goals:**

- A general-purpose package manager or arbitrary patch language.
- Persisted Mastra memory, observability, Studio, or file-based discovery.
- A production authentication provider implementation.
- Changes to Drizzle schemas, data access contracts, Astryx themes, or child experience behavior.

## Decisions

### D1: Root-level integration catalog with one shared Mastra asset tree

The registry will gain an optional root `integrations` array. Each entry declares an ID, display metadata, compatible template IDs, a reserved asset source under `templates/_integrations/<id>`, package additions or explicit script replacements, and optional template-specific lockfiles.

`templates/_integrations/mastra/files` will contain the shared runtime and documentation. The two application templates will not contain duplicate Mastra source. `generate-registry` will skip reserved `_` directories when scanning templates.

Alternative rejected: two complete Mastra template variants. That would multiply code, lockfiles, tests, documentation, and release risk for a runtime that is identical across both templates.

### D2: `--integrations <id>` is the only public selector

The CLI will accept repeated flags and comma-separated values, normalize them to an ordered unique array, and keep the default empty. A dedicated `--mastra` flag is intentionally avoided because it creates a vendor-specific public contract and would need another flag for each future integration.

The human adapter will honor an explicitly supplied integration flag but will not add a new prompt when no flag is supplied. This preserves the existing interactive flow.

### D3: Integration application is a small typed pipeline, not a patch engine

`scaffoldProject` will receive the normalized integration IDs and resolve registry metadata before creating the target directory. After the base template copy, it will apply each integration in selection order:

1. Copy declared files without silently replacing base files unless replacement is explicitly declared.
2. Merge package dependencies and explicitly allowed script replacements.
3. Apply managed text appends for environment examples and documentation.
4. In standalone mode, copy the matching variant lockfile; in workspace mode, copy nothing lockfile-related.
5. Continue the existing package rewrite, placeholder substitution, and workspace context steps.

Unknown integrations, incompatible templates, undeclared file conflicts, dependency conflicts, and script conflicts fail before writes. The integration metadata is trusted repository content, but conflict handling remains explicit so future contributors do not inherit silent overwrite behavior.

### D4: The Mastra package manifest is narrow

The generated runtime adds:

- `@mastra/core`
- `@mastra/tanstack-start`
- `hono`
- `zod`

It does not add `@mastra/memory`, `@mastra/libsql`, `@mastra/duckdb`, `@mastra/observability`, Playwright, or a separate UI package. This keeps Mastra orthogonal to the existing SQLite/Supabase selection and prevents a second storage or UI kernel from entering either template.

The generated runtime contains one model-backed agent, one deterministic local tool, and one deterministic workflow. The workflow and list endpoints provide no-key smoke coverage; generation and streaming require the configured provider key.

### D5: Vite uses a thin wrapper config selected by package scripts

The base `vite.config.ts` remains untouched. The overlay adds `vite.config.mastra.ts`, which merges the base configuration with the Mastra optimizer exclusions. Package script replacements point `dev`, `build`, and `preview` at that wrapper.

The initial wrapper excludes `execa`, matching the official guidance for Mastra's server-only process dependency. Because the templates do not currently install DuckDB and do not use Nitro, the DuckDB and Nitro external rules are omitted. Build verification must prove that the SSR bundle starts and that Mastra code does not enter the client bundle. If the installed Mastra version requires additional optimizer or SSR externalization settings, the wrapper is the single place to add them.

Alternative rejected: editing the base Vite config. That would make the default project reference Mastra even when the integration is off.

### D6: Standalone lockfiles are variant assets

Each compatible template has a generated Mastra variant `pnpm-lock.yaml` under the integration asset tree. During standalone generation, this replaces the base lockfile so `pnpm install --frozen-lockfile` remains valid. Workspace-member generation skips the variant lockfile because the workspace root owns dependency resolution.

The variant lockfiles are generated with pnpm and must be regenerated whenever base template dependencies or Mastra dependency ranges change. Keeping a mismatched base lockfile is not acceptable.

### D7: Authentication is a route-level optional hook

The overlay generates `src/mastra/auth.ts` with a typed async decision function and `src/routes/api/$.ts` wraps every adapter handler through that function before delegation. The default hook allows requests so the scaffold is immediately runnable in development, while the generated documentation and comments make clear that this is not production authorization. A project can replace the hook body without adding an identity-provider dependency or changing the Mastra route.

Alternative rejected: a Mastra server middleware implementation as the primary extension point. A framework-level wrapper is easier to understand, is exercised by route tests, and can reject before any Mastra initialization work.

### D8: MCP reuses the same scaffold contract

The `scaffold_project` input schema will expose `displayName`, `dataLayer`, `schema`, `integrations`, `mode`, `packageManager`, and `targetDir`, and forward them to `scaffoldProject`. `list_templates` and `get_template_schema` will expose supported integration metadata and the complete `initParams` schema. This closes the existing drift where MCP could not express inputs already supported by `agentdock init --json`.

### D9: Compatibility and release policy

The templates' existing `minCliVersion` remains `0.21.0`. Default generation does not depend on the integration pipeline, and keeping the floor avoids blocking default scaffolding for older compatible CLIs. The CLI behavior itself is released as a minor `@cogito.ai/cli` change; documentation will state which CLI release introduced `--integrations`.

The registry is regenerated during build and committed as a generated artifact. Rollback is a CLI release rollback: generated projects are self-contained and require no migration.

## Risks / Trade-offs

- [Variant lockfile drift] → Regenerate both lockfiles whenever base template dependencies or Mastra package ranges change; generated-project frozen-install tests must fail on drift.
- [Vite optimizer behavior changes across Mastra or Vite releases] → Keep the compatibility wrapper isolated, pin through lockfiles, and run both build and client-bundle exclusion checks.
- [An unauthenticated generated API is exposed accidentally] → Generate a route-level auth hook, document the development-only default prominently, and test that enabling the hook blocks unauthorized requests.
- [MCP input parity expands the change surface] → Use one shared `scaffoldProject` call and validation path rather than duplicating MCP-specific logic.
- [A shared overlay can drift from template assumptions] → Keep the overlay limited to server/runtime files, avoid UI and data imports, and verify both templates with the same generated-project test matrix.
- [Integration assets accidentally ship as a template] → Reserve `_integrations` during registry generation and test that it is absent from `list_templates`.
- [A partial scaffold can fail after files are copied] → Resolve all integration metadata and conflicts before creating the target directory; retain the existing failure semantics for unexpected filesystem errors.

## Migration Plan

1. Add the registry/integration contract and CLI selection support with Mastra still disabled by default.
2. Add the shared Mastra assets, auth hook, Vite wrapper, package metadata, and variant lockfiles.
3. Add generated-project tests for both templates, both data layers, standalone/workspace placement, and no-key startup.
4. Update CLI and template documentation, add the changeset, regenerate the registry, build the CLI package, and inspect the packed assets.
5. Publish with the normal changeset flow. Roll back by reverting the CLI version if a compatibility issue is found; existing generated projects remain independent.
