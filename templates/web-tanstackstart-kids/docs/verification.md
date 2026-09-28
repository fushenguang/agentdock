# Verification Evidence

## 2026-09-28

### Standard Gate

`pnpm check` passed, including:

- Oxfmt format check
- type-aware Oxlint
- route generation and TypeScript check
- unit/contract tests
- axe accessibility tests
- generated Astryx theme freshness
- semantic color contrast
- asset/dependency provenance
- Astryx boundary check
- production client and SSR build

### Browser And Visual Gate

`playwright test` passed 52/52 checks:

- 36 full-page visual snapshots
- 3 age profiles × 2 locales × 2 color modes × 3 viewports
- 192 per-component snapshots
- 32 component categories × 3 age profiles × 2 color modes
- SSR profile resolution with JavaScript disabled
- SSR component-showcase rendering with localized copy
- SSR advanced-component showcase rendering
- reduced-motion computed-style checks for transitions, skeleton animation, and carousel scrolling

Viewports:

- mobile: 320 × 720
- tablet: 768 × 1024
- desktop: 1280 × 720

Snapshots are committed under `tests/visual/kids-experience.spec.ts-snapshots/`.

### Budget Gate

`pnpm budgets:check` passed:

- client CSS: approximately 531 KiB
- client JavaScript: approximately 1.25 MiB
- emitted fonts: approximately 4.54 MiB
- each generated theme CSS: under 64 KiB
- client CSS budget: 560 KiB after phase-two component coverage

### CLI Scaffold

The CLI generated a standalone project with:

- template ID: `web-tanstackstart-kids`
- SQLite data layer
- pnpm package manager
- child shell, generated child themes, and the phase-one/phase-two component visual layers
- safety and provenance documentation
- no `animal-island-ui` or `naive-icons` dependency

### Documentation Parity

`pnpm docs:check-template-parity` passed for the English and Chinese template docs.

### Manual Flow Review

Representative screenshots were inspected at mobile, tablet, and desktop widths in light and dusk modes.

The review confirmed:

- the mobile navigation collapses behind the Astryx mobile-nav toggle
- one primary action is visually dominant on the home page
- profile and locale controls remain reachable through responsive navigation
- text and controls remain usable at 320px
- no advertising, social feed, streak pressure, public child profile, or random reward loop is present
- the generated theme remains warm and low-pressure across all three age profiles
