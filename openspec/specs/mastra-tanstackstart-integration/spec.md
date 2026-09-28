## Purpose

Defines the optional Mastra agent and workflow runtime generated into either TanStack Start template without changing the templates' UI or data-layer kernels.

## Requirements

### Requirement: Shared Mastra runtime is generated opt-in

When the `mastra` integration is selected, the generated project MUST contain a Mastra instance, at least one registered agent, at least one registered deterministic workflow, and a TanStack Start server route that exposes Mastra's HTTP API under `/api`. The runtime MUST be shared by both TanStack Start templates and MUST not modify Astryx or the existing Drizzle/Supabase provider contract.

#### Scenario: Mastra runtime generated for the enterprise template

- **WHEN** `web-tanstackstart` is generated with `--integrations mastra`
- **THEN** the project contains the shared Mastra runtime and remains an Astryx/StyleX application

#### Scenario: Mastra runtime generated for the kids template

- **WHEN** `web-tanstackstart-kids` is generated with `--integrations mastra`
- **THEN** the project contains the same Mastra runtime and introduces no `animal-island-ui`, `naive-icons`, or replacement UI kernel

### Requirement: Mastra route uses the official TanStack Start adapter contract

The generated server route MUST mount the Mastra adapter at a catch-all `/api` path, pass the registered Mastra instance to the adapter, and support the HTTP methods returned by the adapter. The route MUST remain separate from the localized application routes.

#### Scenario: Agent API responds without a model key

- **WHEN** the generated server starts without an OpenAI API key and a client requests the registered agent list
- **THEN** the server responds successfully without terminating the process

#### Scenario: Workflow API responds without a model key

- **WHEN** a client lists or starts the deterministic workflow without a model key
- **THEN** the workflow endpoint operates without requiring a model provider credential

### Requirement: Mastra build configuration protects Node-only dependencies

The generated project MUST provide the Vite configuration needed to keep Mastra's server-only dependency graph out of client optimization and the client bundle. The default production server entry MUST remain compatible with the generated SSR server bundle.

#### Scenario: Client bundle excludes Mastra runtime

- **WHEN** the generated project is built
- **THEN** the client bundle contains no Mastra agent instructions, tool implementations, or server-only Mastra runtime

#### Scenario: Production server starts after build

- **WHEN** the generated project is built and started with the template's production command
- **THEN** both the localized SSR page and the Mastra API list endpoint respond successfully

### Requirement: Generated authentication extension point is optional

The Mastra route MUST provide a documented, opt-in authentication extension point without enabling a production identity provider by default. The generated documentation MUST state that an unauthenticated Mastra API is development-only and MUST explain where to enforce authentication before production exposure.

#### Scenario: Default generated route remains unauthenticated

- **WHEN** Mastra is generated with default settings
- **THEN** no identity-provider dependency or production credential is required and the template documents the remaining production hardening step

#### Scenario: Authentication hook is enabled

- **WHEN** a project enables the generated authentication extension point
- **THEN** requests to the Mastra API pass through the configured authentication decision before being handled by Mastra

### Requirement: Mastra data handling is isolated from template persistence

The initial integration MUST NOT enable Mastra Memory, LibSQL, DuckDB, observability storage, file-based discovery, or a second persistence owner. Generated documentation MUST explain that application data access remains behind the template's existing repository/provider contract and that child-facing products must not persist precise age, birth dates, or other identifying child data through Mastra by default.

#### Scenario: Dependency audit sees no secondary persistence store

- **WHEN** the generated Mastra project dependencies are inspected
- **THEN** no Mastra Memory, LibSQL, DuckDB, or observability storage package is present

#### Scenario: Data-layer choice remains independent

- **WHEN** Mastra is generated with either SQLite or Supabase data-layer selection
- **THEN** the generated Mastra runtime does not import or reconfigure the template's Drizzle clients
