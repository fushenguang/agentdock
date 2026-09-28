---
roadmap-id: mastra-tanstackstart-integration
---

## Why

The two TanStack Start templates currently stop at application and data-layer scaffolding; teams that want an agent or deterministic workflow runtime must manually discover and wire Mastra without breaking the templates' SSR, Astryx, Drizzle, workspace, or release contracts. The integration must be opt-in so the existing default output remains byte-for-byte compatible.

## What Changes

- Add a repeatable `--integrations <id>` selection to `agentdock init`, defaulting to no integrations. Support repeated and comma-separated values, including in agent/JSON mode.
- Extend the template registry with a root-level integration catalog and a shared, versioned overlay source for Mastra.
- Add a shared `mastra` integration overlay compatible with both `web-tanstackstart` and `web-tanstackstart-kids`; the two templates must reuse the same runtime files rather than fork agent/workflow code.
- Generate a minimal Mastra runtime with one agent, one deterministic tool, one deterministic workflow, a TanStack Start catch-all server route, an optional auth extension point, and a no-key startup test.
- Add only the runtime dependencies required by the official TanStack Start adapter (`@mastra/core`, `@mastra/tanstack-start`, `hono`, and `zod`) plus generated-project lockfiles. Do not add Memory, LibSQL, DuckDB, observability storage, Studio, or file-based discovery.
- Keep Mastra runtime-only: Astryx remains the UI and interaction kernel, and the `web-tanstackstart-kids` integration must not introduce `animal-island-ui`, `naive-icons`, or any child-facing UI dependency.
- Repair `scaffold_project` MCP parity by exposing and forwarding `dataLayer`, `schema`, `displayName`, and `integrations`, and by reporting supported integrations consistently with `agentdock init --json`.
- Preserve the current behavior when no integrations are selected: no Mastra files, dependencies, scripts, environment variables, lockfile changes, or JSON result fields.
- Add English and Chinese CLI/template documentation, a minor `@cogito.ai/cli` changeset, registry regeneration, and generated-project verification.

## Capabilities

### New Capabilities

- `cli-integration-selection`: Defines the generic init integration contract, registry catalog, overlay application, default-off behavior, validation, lockfile handling, and rollback semantics.
- `mastra-tanstackstart-integration`: Defines the shared Mastra runtime generated into either TanStack Start template, including server routing, Vite compatibility, optional auth extension point, no-key startup, and template-specific safety boundaries.

### Modified Capabilities

- `cli-init-command`: Adds integration selection to the human, agent, and JSON init paths while preserving the default flow.
- `cli-template-registry`: Adds the integration catalog and generation/validation rules for shared overlay assets and variant lockfiles.
- `cli-mcp-server`: Makes `scaffold_project` accept the same scaffold inputs as the CLI and exposes integration metadata and validation errors.

## Impact

- `packages/cli`: init command, adapters, scaffold core, registry types/generation, MCP tool schema, tests, and release metadata.
- `templates/_integrations/mastra`: shared runtime overlay, package/script/env merge metadata, optional auth extension point, tests, and template-specific lockfiles.
- `templates/web-tanstackstart` and `templates/web-tanstackstart-kids`: metadata or version compatibility changes only as required; Mastra runtime files remain opt-in.
- `apps/docs`: CLI and template documentation in English and Chinese.
- `.changeset` and `packages/cli/src/registry.json`: release and generated registry artifacts.

## Non-goals

- Making Mastra a default dependency or changing the default generated project behavior.
- Adding Memory, LibSQL, DuckDB, observability storage, Studio, `mastra dev`, or file-based discovery.
- Implementing a specific identity provider or a production-ready application auth system; this change only generates a documented, optional extension point.
- Replacing Astryx, changing either template's UI system, or adding child-facing Mastra UI.
- Changing Drizzle SQLite/Supabase schemas, migrations, repositories, or provider selection.
- Guaranteeing serverless persistence or cross-instance A2A state; the generated runtime remains oriented to the templates' long-lived Node server.
