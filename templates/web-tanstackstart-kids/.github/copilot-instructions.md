# AgentDock web-tanstackstart-kids — Copilot Instructions

> Applies to GitHub Copilot and other agents working in generated projects.

## Read First

Read `LLM.md`, `DESIGN.md`, `docs/age-profiles.md`, and `docs/child-safety.md` before changing UI, interaction, content, themes, or age behavior.

## Stack

TanStack Start + Router, React 19, TypeScript 7, Vite 8, pnpm 10.34.5–12, Oxlint, Oxfmt, Vitest, Playwright, Astryx, StyleX, Drizzle ORM, SQLite, optional Supabase Postgres.

## Hard Rules

1. Astryx remains the component and interaction kernel.
2. Never fork, swizzle, patch, or copy Astryx component source.
3. Never add `animal-island-ui`, `naive-icons`, or historical reference assets.
4. Use semantic Astryx tokens; do not hard-code visual values in feature components.
5. Use child capabilities, not raw age/profile branches, in feature behavior.
6. Persist only a coarse age profile. Never store birth date or exact age by default.
7. Add every user-facing string to `enCatalog` and `zhCNCatalog`.
8. Use `GuardianGate` for external, sensitive, or consequential actions.
9. Preserve keyboard, focus, ARIA, reduced-motion, audio-off, and text fallback behavior.
10. Keep pages under `src/routes/$locale/`.
11. Features must not import `src/infra/db/**` directly.
12. Every feature directory needs `__contract__.ts`.
13. Do not edit generated routes or generated theme `.js`, `.css`, and `.d.ts` files.
14. Never commit secrets.

## Validation

Use the narrowest check while iterating, then:

```bash
pnpm test
pnpm test:a11y
pnpm theme:check
pnpm assets:check
pnpm boundaries:check
pnpm check-types
pnpm lint
pnpm format:check
pnpm build
pnpm check
```

`pnpm check:full` adds Playwright visual checks and bundle budgets.

## UI

- Compose Astryx components rather than raw HTML where Astryx owns the semantics.
- Use `KidShell`, `KidPageHeader`, `KidActionCard`, `KidChoice`, `KidProgress`, `KidState`, `KidReadAlong`, and `GuardianGate` for repeated child patterns.
- Keep one primary action per meaningful region.
- Prefer low cognitive load, clear icons plus labels, and non-blaming recovery.
- Run an `impeccable` review for non-trivial UI work.

## Skills

Start with `.github/skills/THIRD_PARTY_SKILLS.md`, then load the smallest relevant skill. `keel` and `coding-protocol` govern architecture/risk; Matt Pocock's engineering skills govern development workflow; `impeccable` governs UI quality.
