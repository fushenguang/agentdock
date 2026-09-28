## 1. Integration Contract And Scaffold Core

- [x] 1.1 Define registry integration metadata types and add the optional root-level `integrations` catalog to registry loading.
- [x] 1.2 Add `integrations` to scaffold options and validate IDs, compatibility, duplicates, and conflicts before creating the target directory.
- [x] 1.3 Add deterministic integration normalization for repeated and comma-separated CLI values.
- [x] 1.4 Implement declarative overlay application for files, package dependencies, explicit script replacements, managed text appends, and standalone variant lockfiles.
- [x] 1.5 Preserve workspace-member lockfile and package-manager ownership semantics when an integration is selected.
- [x] 1.6 Keep default scaffold output byte-compatible by omitting integration fields and assets when the selection is empty.
- [x] 1.7 Add stable structured errors for unknown, incompatible, and conflicting integrations.

## 2. Registry And Shared Asset Packaging

- [x] 2.1 Update `generate-registry` to read and validate integration descriptors and skip reserved `_` support directories.
- [x] 2.2 Add the shared `templates/_integrations/mastra` asset tree with descriptor, runtime files, docs, auth hook, and template-specific lockfiles.
- [x] 2.3 Declare Mastra compatibility for both TanStack Start templates in the integration descriptor.
- [x] 2.4 Generate and commit matching standalone `pnpm-lock.yaml` variants for both templates.
- [x] 2.5 Verify the CLI build packages `_integrations` assets and the packed registry does not expose the support directory as a template.

## 3. Mastra Runtime Overlay

- [x] 3.1 Add the Mastra dependencies and script replacements required by the TanStack Start adapter and Vite wrapper.
- [x] 3.2 Add the shared Mastra instance with one registered agent, one deterministic tool, and one deterministic workflow.
- [x] 3.3 Add the official catch-all `/api` TanStack Start adapter route.
- [x] 3.4 Add the typed optional authentication hook and wrap every adapter handler before delegation.
- [x] 3.5 Add `vite.config.mastra.ts` with the required optimizer exclusions without modifying the base Vite config.
- [x] 3.6 Add managed environment and documentation updates without introducing real credentials.
- [x] 3.7 Add runtime tests for no-key initialization, agent listing, workflow listing/execution, and auth-hook enforcement.
- [x] 3.8 Verify no Mastra Memory, LibSQL, DuckDB, observability storage, or UI package is introduced.

## 4. CLI And MCP Parity

- [x] 4.1 Add `--integrations` to the init command and forward it through agent and human adapters.
- [x] 4.2 Include `integrations` in successful JSON output only when at least one integration is selected.
- [x] 4.3 Extend `scaffold_project` MCP schema and handler with `displayName`, `dataLayer`, `schema`, `integrations`, and the existing placement inputs.
- [x] 4.4 Expose supported integrations through `list_templates` and the complete init parameter schema through `get_template_schema`.
- [x] 4.5 Reuse the same scaffold validation path so CLI JSON and MCP return stable equivalent errors.

## 5. Automated Verification

- [x] 5.1 Add CLI unit tests for normalization, default-off behavior, unknown integrations, incompatible templates, conflicts, and workspace/standalone lockfiles.
- [x] 5.2 Add scaffold tests for both templates with and without Mastra and for both SQLite and Supabase data-layer selections.
- [x] 5.3 Add tests asserting the reserved integration support directory is not listed as a template.
- [x] 5.4 Build generated standalone projects with frozen installation, typecheck, tests, and production build.
- [x] 5.5 Start generated production servers and smoke-test the localized SSR route plus Mastra agent/workflow list endpoints without a model key.
- [x] 5.6 Assert the client bundle excludes Mastra instructions, tools, and runtime code.
- [x] 5.7 Run kids-specific asset, Astryx boundary, accessibility, and bundle-budget gates with Mastra selected.
- [x] 5.8 Verify enabling the auth hook blocks an unauthorized request and leaves the default development hook runnable.

## 6. Documentation And Release Artifacts

- [x] 6.1 Update English and Chinese CLI documentation for `--integrations`, structured errors, JSON output, and MCP parity.
- [x] 6.2 Update English and Chinese documentation for both TanStack Start templates with opt-in commands, endpoints, environment variables, auth hardening, data-layer independence, and production boundaries.
- [x] 6.3 Add generated-project Mastra guidance covering agent/tool/workflow extension and the prohibition on a second UI or persistence kernel.
- [x] 6.4 Add a minor `@cogito.ai/cli` changeset describing the optional integration and MCP parity fixes.
- [x] 6.5 Regenerate the ignored `packages/cli/src/registry.json` build artifact and verify the packaged registry contains the integration catalog.

## 7. Repository Acceptance And Release Readiness

- [x] 7.1 Run `pnpm install` and confirm no workspace member is missing.
- [x] 7.2 Run `pnpm check-types`.
- [x] 7.3 Run `pnpm build` for all affected packages and templates.
- [x] 7.4 Run `pnpm format` and confirm no diff remains.
- [x] 7.5 Run `openspec validate add-mastra-tanstackstart-integration` and resolve every validation issue.
- [x] 7.6 Run secret and banned-dependency checks and confirm no real credentials are present.
- [x] 7.7 Inspect the built npm package contents and generated projects before marking the change release-ready.
