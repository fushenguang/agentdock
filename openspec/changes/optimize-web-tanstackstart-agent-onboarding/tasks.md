## 1. Planning

- [x] 1.1 Create OpenSpec proposal, specs, design, and tasks
- [ ] 1.2 Archive the completed first web-tanstackstart change after this follow-up is verified

## 2. pnpm Bootstrap

- [x] 2.1 Add `manage-package-manager-versions=false` and `engine-strict=true` to the template `.npmrc`
- [x] 2.2 Tighten the pnpm engine range to `>=12 <13`
- [x] 2.3 Add configuration tests for the pnpm guard
- [x] 2.4 Document pnpm recovery commands in README and LLM.md

## 3. Agent Documentation

- [x] 3.1 Create root `LLM.md` with stack rationale, architecture, dependency rules, and commands
- [x] 3.2 Add feature, route, data-layer, migration, and UI implementation recipes to `LLM.md`
- [x] 3.3 Update AGENTS.md and Copilot instructions to require LLM.md as the first context file
- [x] 3.4 Update README.md to link the agent guide

## 4. Default App Shell

- [x] 4.1 Add PageContainer and PageHeader layout components
- [x] 4.2 Add TemplateShell using Astryx AppShell and TopNav
- [x] 4.3 Wrap the root route outlet in TemplateShell
- [x] 4.4 Convert the overview route to an enterprise dashboard page
- [x] 4.5 Convert the hello feature page to use shared page composition
- [x] 4.6 Remove ecommerce mega-menu, cart, fake search, and placeholder content
- [x] 4.7 Audit all template UI and replace hand-rolled equivalents with native Astryx primitives or thin Astryx-backed wrappers

## 5. Themes And Localization

- [x] 5.1 Add prebuilt Neutral, Butter, Matcha, and Stone theme packages and CSS imports
- [x] 5.2 Add a typed appearance provider with persisted theme/mode selection
- [x] 5.3 Add SSR-safe cookie hydration attributes and appearance configuration/cookie tests
- [x] 5.4 Add official Astryx i18n provider, typed locales, Simplified Chinese default, and English catalog
- [x] 5.5 Add localized `/$locale` route layout and move reference routes behind it
- [x] 5.6 Add language switcher with path/query/hash preservation and catalog parity tests
- [x] 5.7 Document theme and locale extension rules in LLM.md, DESIGN.md, agent entrypoints, README, and platform docs

## 6. Verification

- [x] 6.1 Run template format, lint, type, test, and build gates
- [x] 6.2 Verify pnpm 10 fails cleanly and pnpm 12 succeeds
- [x] 6.3 Verify locale routes, locale switching, theme modes, persistence, and hydration
- [x] 6.4 Validate OpenSpec and secret checks
- [ ] 6.5 Stop before commit/push/publish and wait for user preview approval
