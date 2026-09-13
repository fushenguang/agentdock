## Purpose

Provide first-class, extensible appearance and localization foundations so generated internal applications are ready for multiple themes, color modes, and languages without route-local state or hard-coded copy.

## ADDED Requirements

### Requirement: Multi-theme application shell

The template MUST expose a typed theme registry using prebuilt Astryx themes and render the application through the active theme. It MUST support Neutral, Butter, Matcha, and Stone themes plus system, light, and dark color modes.

#### Scenario: User changes the theme

- **WHEN** the user selects a theme or color mode from the appearance switcher
- **THEN** the application updates without a full page reload and preserves the current route

#### Scenario: User reloads the application

- **WHEN** the application loads after a previous appearance selection
- **THEN** server-rendered HTML and hydration use the saved theme and mode without a visible flash

### Requirement: Theme extension contract

Theme configuration MUST be centralized so adding a supported prebuilt theme does not require changes to feature components.

#### Scenario: Developer adds an Astryx theme

- **WHEN** a developer adds a prebuilt Astryx theme
- **THEN** the compiled theme CSS, typed theme registry, switcher options, and appearance tests are the only required integration points

#### Scenario: Feature component renders across themes

- **WHEN** a feature component uses Astryx semantic tokens
- **THEN** it adapts to every supported theme and color mode without theme-name conditionals

### Requirement: Locale-prefixed routing

The template MUST support multiple locales through a validated `/$locale` route layout. The initial implementation MUST provide Simplified Chinese (`/zh-CN`) and English (`/en`), with `/` redirecting to the default `zh-CN` locale.

#### Scenario: User opens a localized route

- **WHEN** the user opens `/en` or `/zh-CN`
- **THEN** the document language, direction, application copy, and Astryx component copy resolve from the active locale

#### Scenario: User opens an unsupported locale

- **WHEN** the first path segment is not a supported locale
- **THEN** the router redirects to the default localized route instead of rendering an invalid locale

### Requirement: Locale extension and switching

The template MUST use Astryx `InternationalizationProvider`, a typed locale registry, and application catalogs with matching key sets. The language switcher MUST enumerate supported locales and preserve pathname, query string, and hash when switching.

#### Scenario: User switches language

- **WHEN** the user selects another supported locale
- **THEN** the equivalent page opens under the selected locale with the same query string and hash

#### Scenario: Developer adds a locale

- **WHEN** a developer adds a locale
- **THEN** the locale registry, catalog, optional Astryx shipped catalog, and parity test define the complete integration

### Requirement: Appearance and locale guidance for agents

The template's `LLM.md`, `DESIGN.md`, agent entrypoints, and project documentation MUST describe theme and locale extension rules, the appearance cookie contract, localization boundaries, and verification expectations.

#### Scenario: Agent adds localized UI

- **WHEN** an agent adds a page or component
- **THEN** the project guidance directs it to use `useTranslator()`, update every catalog, preserve the `/$locale` route boundary, and use Astryx tokens rather than theme-specific styles
