# web-tanstackstart-pages Specification

## Purpose
Make an Astryx page template the only starting point for a page in projects generated from
`web-tanstackstart`, and enforce it in `check` and `build`.

## Requirements

### Requirement: Page creation entry

The template MUST provide `pnpm page:new "<intent>" --route <path>` that selects a template with
`astryx build`, scaffolds it with `astryx template`, turns it into a TanStack Start file route, and
writes a provenance marker on line 1. By default it MUST accept only templates from
`@cogito.ai/astryx-web`.

#### Scenario: An intent creates a route

- **WHEN** an agent runs `pnpm page:new "settings page with sections" --route settings`
- **THEN** `src/routes/$locale/settings.tsx` exists with the marker on line 1, no default export, and
  an exported `Route`
- **AND** the page's strings are in a catalog under `src/i18n/pages/`

#### Scenario: An unmatched intent is rejected

- **WHEN** `astryx build` returns `basis: fallback`, or a Core start without `--allow-core`
- **THEN** the entry exits non-zero and lists the closest `@cogito.ai/astryx-web` templates
- **AND** a fallback rejection says:
  `Put the page type last: write "mobile settings page", not "settings page on mobile".`

#### Scenario: An existing page is never overwritten

- **WHEN** the target file already exists
- **THEN** the entry exits non-zero and the file is unchanged

### Requirement: Provenance is enforced in check and build

Every route page MUST carry the provenance marker or an `astryx-exempt` line with a reason of at
least ten characters; root, layout, and component-less routes are exempt automatically. Both
`pnpm check` and `pnpm build` MUST fail otherwise.

#### Scenario: A hand-made page cannot be built

- **WHEN** a route page has neither the marker nor an exemption
- **THEN** `pnpm build` fails and names the file

#### Scenario: A raw template is caught

- **WHEN** a file under `src/routes/` has no `Route` export
- **THEN** the check fails because the file is missing from the route tree

### Requirement: No inline styles, color literals, or viewport media queries

Pages and components MUST NOT use `style` attributes, the `CSSProperties` type, color literals, or
viewport media queries; lint MUST fail on them.

#### Scenario: Lint rejects an inline style

- **WHEN** a component under `src/components/` sets a `style` attribute
- **THEN** `pnpm lint` fails with `agentdock-ui/no-inline-style`

### Requirement: Sample pages come from archetypes

The template's sample pages MUST be created through the entry from `dock-landing`,
`dock-settings`, and `dock-workbench`.

#### Scenario: A fresh project passes its own checks

- **WHEN** a project is generated from the template and `pnpm check` runs
- **THEN** the provenance check passes for the three sample pages

### Requirement: Agent docs point to the entry

`AGENTS.md`, `LLM.md`, `.github/copilot-instructions.md`, and the `domain-packages` template's
`add-web-route` skill MUST name `pnpm page:new` as the way to create a page.

#### Scenario: An agent looks up how to add a page

- **WHEN** an agent reads any of those files
- **THEN** it is told to run `pnpm page:new` and not to lay a page out from scratch
