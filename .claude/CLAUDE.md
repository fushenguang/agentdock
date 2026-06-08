# AgentDock — Claude Code Instructions

> For: Claude Code. Supplements `.github/copilot-instructions.md` and `AGENTS.md`.

## Project Context

AgentDock is an open-source scaffold platform for AI coding agent–ready projects.
Tech stack: TypeScript 5.9 (strict), turborepo 2.9, pnpm 9, Node ≥18.
Templates: Next.js 16, React 19, Tailwind CSS, Supabase.
Docs: Fumadocs / Next.js at `apps/docs`.

## Directory Contract

| Path         | Purpose                                                              |
| ------------ | -------------------------------------------------------------------- |
| `templates/` | Scaffolding templates (e.g. `web-nextjs`). One dir per template.     |
| `packages/`  | Platform tooling packages (shared utilities, CLI).                   |
| `apps/docs`  | **AgentDock platform** docs site (Fumadocs/Next.js). NOT a template. |
| `openspec/`  | Single source of truth for platform planning.                        |

**Before placing code**, confirm which directory it belongs to above.

## Hard Rules

1. **No secrets** — never write real API keys, tokens, or passwords. Use placeholders: `YOUR_KEY_HERE`, `<your-token>`.
2. **TypeScript strict** — `strict: true` is enforced at the root. No `any`, no `// @ts-ignore` without a comment explaining why.
3. **Conventional commits** — all commit messages follow `type(scope): summary`.
4. **pnpm only** — do not use `npm install` or `yarn`. Always `pnpm add`.
5. **Meta-repo exemption** — this repo _is_ the platform, not a template. Rules targeting templates (e.g. anti-drift invariants for `web-nextjs`) do not apply here unless explicitly stated.
6. **OpenSpec = SSOT** — feature decisions live in `openspec/`. Code reflects specs, not the other way around.

## Task Scope

- Platform docs → `apps/docs`
- Shared utilities → `packages/<name>`
- Template code → `templates/<name>`
- Governance / AI config → `.github/` or `AGENTS.md`

## Autonomy Boundaries

### May execute autonomously

- `pnpm install`, `pnpm build`, `pnpm check-types`, `pnpm lint`, `pnpm format`
- Creating / editing files inside the current working change scope
- Running `openspec` CLI commands (read-only: `list`, `status`, `instructions`, `validate`)
- Writing tests for existing functionality
- Updating docs in `apps/docs`

### Must pause and confirm

- Any `git push`, `git push --force`, or publishing to a registry
- Deleting files not created in this session
- Adding new `devDependencies` or `dependencies` at the workspace root
- Introducing a new top-level directory outside the four defined in the directory contract
- Any change to `openspec/config.yaml` schema fields
- Modifying `.github/` files other than during a governance-related change

### Prohibited

- Writing real secrets, API keys, or credentials anywhere in the repo
- Running `rm -rf` on tracked directories
- Amending or force-pushing already-shared commits
- Bypassing git hooks with `--no-verify`
- Modifying `pnpm-lock.yaml` directly (always via `pnpm` commands)

## Before Making Changes

- Read `openspec/config.yaml` for context.
- Check active changes in `openspec/changes/` before introducing new concepts.
- Prefer updating existing files over creating new ones.

## Acceptance Criteria (for any change)

Before marking a change done, verify:

1. `pnpm install` — exits 0, no workspace member missing.
2. `pnpm check-types` — exits 0.
3. `pnpm build` — exits 0 for all affected packages.
4. `pnpm format` — no diff after running (files already formatted).
5. `openspec validate <change-name>` — exits 0.
6. No real secrets detected (grep for common key patterns).
