## 1. Registry and CLI Foundation

- [x] 1.1 Add roadmap anchor and OpenSpec change artifacts for web-tanstackstart
- [x] 1.2 Extend template package metadata and registry generation with packageManager, dataLayers, defaultDataLayer, and supportsSchema
- [x] 1.3 Update scaffold to preserve explicit template packageManager and substitute the selected data provider
- [x] 1.4 Update human init prompts to use template data-layer metadata
- [x] 1.5 Update agent init defaults, validation, and JSON behavior for template data-layer metadata
- [x] 1.6 Add CLI regression and template-aware tests for web-nextjs, web-tanstackstart, and packageManager preservation

## 2. Standalone Template Foundation

- [x] 2.1 Create templates/web-tanstackstart root package, lockfile inputs, pnpm-workspace.yaml, tsconfig, and Vite configuration
- [x] 2.2 Configure TanStack Start file routing, generated route lifecycle, and production build scripts
- [x] 2.3 Configure Oxlint, type-aware linting, Oxfmt, and generated-file ignores
- [x] 2.4 Configure Vitest for core, feature, and data-layer tests

## 3. Astryx, StyleX, and Application Shell

- [x] 3.1 Add Astryx and StyleX dependencies plus the official Vite integration
- [x] 3.2 Implement root providers, CSS layer imports, theme integration, and router link integration
- [x] 3.3 Create the landing shell and a StyleX-authored reference component
- [x] 3.4 Implement the hello feature contract, public boundary, UI route, and tests

## 4. Drizzle Data Layer

- [x] 4.1 Implement core greeting repository contract and domain types
- [x] 4.2 Implement SQLite Drizzle schema, client, migrations, and repository
- [x] 4.3 Implement Supabase Postgres schema, client, migration config, and repository
- [x] 4.4 Implement provider selection with SQLite default and no Supabase startup requirement
- [x] 4.5 Connect hello through a TanStack server function and repository without direct feature-to-infra imports
- [x] 4.6 Add SQLite repository contract tests and Supabase schema/type coverage

## 5. Template Governance and Agent Assets

- [x] 5.1 Add template AGENTS.md, Copilot instructions, DESIGN.md, README, and environment examples
- [x] 5.2 Add template openspec configuration, roadmap, and empty change/spec structure
- [x] 5.3 Add compatible architecture, coding-protocol, TDD/diagnosis/review, and UI quality skills with provenance and license evidence
- [x] 5.4 Add local Oxlint architecture rules for feature contracts, direct DB imports, cross-feature imports, and core mutation

## 6. Documentation

- [x] 6.1 Add English web-tanstackstart template overview and usage/data/style/verification guidance
- [x] 6.2 Add Chinese web-tanstackstart template overview and usage/data/style/verification guidance
- [x] 6.3 Add template navigation entries and update the templates landing pages

## 7. Platform Integration

- [x] 7.1 Add web-tanstackstart CI workflow/job using Node 24 and pnpm 12
- [x] 7.2 Add a changeset for the CLI package and template delivery
- [x] 7.3 Update platform context/docs where they enumerate available templates or CLI data-layer behavior

## 8. Verification

- [x] 8.1 Run pnpm install and verify no workspace member is missing
- [x] 8.2 Run template format, lint, type, test, and build gates
- [x] 8.3 Scaffold web-tanstackstart with sqlite and supabase selections and verify generated output
- [x] 8.4 Run pnpm check-types, pnpm build, pnpm lint, and pnpm format at repository root
- [x] 8.5 Run openspec validate add-web-tanstackstart-template and secret checks
