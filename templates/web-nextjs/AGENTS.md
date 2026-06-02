# AgentDock Web-Next.js Template — Agent Execution Boundaries

> For AI coding agents (GitHub Copilot CLI, etc.) running in projects generated from this template.

## Generation Assumption

- Template source may contain monorepo-only dependency specifiers (for example, workspace links).
- Scaffold generation MUST rewrite these dependencies to installable versions for the generated standalone project.

## Autonomy Boundaries

### May execute autonomously

- `pnpm install`, `pnpm build`, `pnpm check-types`, `pnpm lint`, `pnpm test`
- Creating / editing files within the current task scope
- Adding new features inside `src/features/` (following the contract pattern)
- Adding repository interfaces to `src/core/repositories/`
- Updating translations in `messages/`
- Writing or updating tests in `src/**/*.test.ts`
- Running `openspec` CLI commands (read-only: `list`, `status`, `instructions`, `validate`)

### Must pause and confirm

- Any `git push`, `git push --force`, or publishing to a registry
- Deleting files (including tracked files)
- Adding new **top-level** directories outside the four-layer contract (`core/`, `features/`, `infra/`, `app/`)
- Adding new `dependencies` or `devDependencies` to `package.json`
- Any change to `openspec/config.yaml`
- Modifying `middleware.ts` (affects routing for all locales)

### Prohibited

- Writing real secrets, API keys, or credentials anywhere
- Running `rm -rf` on tracked directories
- Bypassing git hooks with `--no-verify`
- Importing from `src/infra/db/` inside `src/features/**` (violates Layer 2 rules)
- Creating features without `__contract__.ts` (violates require-feature-contract)

## Acceptance Criteria (before marking a task done)

1. `pnpm lint` — exits 0, no Layer 2 violations in `src/features/`
2. ESLint ignores build artifacts (at minimum `.next/**`) so generated files are never linted.
3. `pnpm build && pnpm lint` — both exit 0 (lint remains stable after a build).
4. `pnpm test` — all unit tests pass
5. `pnpm check-types` — TypeScript strict mode, no errors
6. New features include `__contract__.ts`, `index.ts`, and at least one test
