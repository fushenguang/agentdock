---
roadmap-id: web-tanstackstart-template
---

## Why

The first web-tanstackstart release is functional, but onboarding still assumes an agent or developer already knows the stack. Older pnpm versions can also trigger a broken automatic package-manager switch, and the initial page structure does not provide a reusable enterprise application shell. This follow-up makes the template self-describing and safer to adopt.

## What Changes

- Add template-level pnpm bootstrapping guidance and prevent pnpm 10 from auto-downloading a broken pnpm 12 executable.
- Add a root `LLM.md` that gives coding agents the stack rationale, architecture, constraints, and implementation recipes without requiring repository exploration.
- Replace the landing-page-only UI with an Astryx `AppShell` + `TopNav` application skeleton adapted from `shell-top-nav`.
- Add shared page-container/header patterns and convert the overview and hello feature to use the shell.
- Add prebuilt multi-theme support with persisted light/dark/system appearance controls.
- Add URL-prefixed Simplified Chinese and English localization using Astryx i18n, default to Chinese, and keep catalogs extensible.
- Remove the ecommerce-specific navigation, mega menu, placeholder commerce data, and fake controls from the Astryx reference template.

## Capabilities

### New Capabilities

- `web-tanstackstart-pnpm-bootstrap`: predictable pnpm 12 onboarding and failure behavior.
- `web-tanstackstart-agent-docs`: a single authoritative agent-oriented project guide.
- `web-tanstackstart-app-shell`: default enterprise application shell and page composition contract.
- `web-tanstackstart-theme-i18n`: extensible Astryx themes, appearance persistence, and locale-prefixed internationalization.

### Modified Capabilities

## Impact

- Template configuration: `.npmrc`, `package.json`, `README.md`, `AGENTS.md`, `.github/copilot-instructions.md`
- New root agent document: `LLM.md`
- New layout components under `src/components/layout`
- Root route, overview route, hello feature presentation, appearance controls, locale controls
- Theme CSS imports, i18n catalogs/provider, localized route layout, and related tests
- Template tests and build verification
- No CLI source changes are required for the pnpm mitigation

## Non-goals

- Automatically upgrading the user's global pnpm installation
- Adding authentication, authorization, dashboard analytics, or new database tables
- Introducing a sidebar navigation shell
- Copying the ecommerce mega-menu and placeholder storefront content from the Astryx playground
- Publishing before local preview approval
