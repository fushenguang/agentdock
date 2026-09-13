## Context

The released template already has a working TanStack Start application, Astryx/StyleX integration, Drizzle SQLite default, Supabase alternate provider, and CLI integration. This change focuses on adoption quality rather than changing the runtime stack.

## Goals / Non-Goals

**Goals:**

- Prevent pnpm 10 from entering the known broken auto-switch path.
- Make project knowledge retrievable from one agent-oriented file.
- Establish a default enterprise AppShell and page composition contract.
- Provide extensible multi-theme and multilingual foundations using native Astryx APIs.
- Preserve the hello feature as the end-to-end reference implementation.

**Non-Goals:**

- Auto-installing or globally changing pnpm.
- Adding application features beyond the shell reference.
- Replacing Astryx with another design system.
- Shipping the ecommerce example verbatim.
- Building a custom design system or translation runtime outside Astryx.

## Decisions

### D1: Fail-fast pnpm configuration

Keep `packageManager: pnpm@12.4.1` and `engines.pnpm: >=12 <13`. Add `.npmrc` settings:

```dotenv
manage-package-manager-versions=false
engine-strict=true
```

This avoids pnpm 10's broken `@pnpm/exe` self-switch and produces a clear engine error. Recovery remains an explicit user/agent action through `pnpm self-update 12.4.1` or `npx pnpm@12.4.1`.

Alternative rejected: remove `packageManager` so pnpm 10 can install. That would silently violate the declared toolchain.

### D2: One agent guide with layered entrypoints

`LLM.md` is the deep project guide. `AGENTS.md` remains the execution-boundary contract, and Copilot instructions remain a concise routing layer. Both point to `LLM.md` first.

The guide contains rationale, architecture, import rules, exact feature recipes, commands, and troubleshooting. It avoids duplicating every API; component-specific details still come from the Astryx CLI.

### D3: AppShell as the route root

`src/components/layout/TemplateShell.tsx` wraps `<Outlet />` in the root route. It uses Astryx `AppShell` and `TopNav`, with working links for Overview and Hello. The shell is presentation infrastructure, so it lives under `components/layout`, not `features` or `core`.

Shared `PageContainer` and `PageHeader` components define content width, vertical rhythm, and page title semantics.

### D4: Adapt, do not copy, the Astryx template

The `shell-top-nav` reference supplies the structural pattern: AppShell, TopNav, heading, items, and content area. Ecommerce data, mega menus, cart badge, fake search, and placeholder tiles are removed. The resulting shell is smaller and focused on enterprise internal applications.

### D5: Astryx-first composition

Template pages compose native Astryx primitives before adding local wrappers. `PageContainer` and `PageHeader` remain thin conventions over `Stack`; overview collections use `Grid` and `List`; greeting content uses `TextInput` status, `List`/`ListItem`, `Timestamp`, `EmptyState`, and `Section`; 404 uses `Center` and `Stack`. Raw HTML remains only where the element is semantically required and Astryx has no owning component, such as the form element.

Alternative rejected: hand-rolled grid, list, empty-state, timestamp, and header markup. That duplicates Astryx behavior and creates unnecessary drift in spacing, accessibility, theming, and i18n.

### D6: Keep hello as the business reference

The `/$locale/hello` route remains the only complete business feature. It demonstrates the route → server function → feature contract → repository → SQLite/Supabase flow. Overview cards link to it and explain the architecture, but do not introduce new business behavior.

### D7: Prebuilt themes with an external appearance store

The template ships Neutral, Butter, Matcha, and Stone as prebuilt Astryx themes and imports their compiled CSS. The root route reads a compact `agentdock.appearance` cookie before rendering, passes the parsed state to `AppearanceProvider`, and writes the same attributes onto `<html>`. This keeps the UI simple, avoids route-specific theme state, and gives SSR, hydration, and first paint one consistent source of truth.

Alternative rejected: runtime theme injection. Astryx documents that runtime themes can flash component overrides during hydration; prebuilt `/built` themes plus CSS are the SSR-safe path.

### D8: Locale-prefixed routes with official Astryx i18n

Locales use a `/$locale` route boundary and the official `InternationalizationProvider`. The template ships `zh-CN` as the default locale and `en` as the alternate, merges Astryx's shipped `zh-CN` catalog with application messages, and keeps the locale registry typed. A locale switcher enumerates supported locales and preserves pathname, query string, and hash.

Alternative rejected: client-only locale state. URL-prefixed locales provide stable deep links, SSR language, document `lang`/`dir`, and a straightforward extension path.

## Risks / Trade-offs

- [pnpm 12 is required] → The engine failure is intentional and documented with two recovery paths.
- [Astryx releases may change shell APIs] → Use documented components and keep the shell small; CI builds the exact supported versions.
- [`LLM.md` can drift from code] → Keep recipes tied to current paths and ensure template tests/checks exercise the referenced files.
- [No sidebar shell] → Top navigation is the approved default for this iteration; a sidebar can be added later as a separate architectural change.
- [Appearance is stored in a first-party cookie] → The cookie is readable by the app so SSR can render the saved state; it is not an authentication boundary. A future account-backed preference can replace persistence without changing feature components.
- [Locale catalog parity is manual at authoring time] → Tests reject missing or extra application keys before merge.

## Migration Plan

1. Add pnpm guard configuration.
2. Add `LLM.md` and update agent entrypoints.
3. Add shared layout components and wrap the root route.
4. Convert overview and hello pages to the shared shell.
5. Add typed themes, appearance controls, locale routing, catalogs, and switchers.
6. Update agent, design, template, and platform documentation.
7. Run formatting, lint, types, tests, build, and dev preview.
8. Stop before publication and wait for local preview approval.
