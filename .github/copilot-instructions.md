# AgentDock — Copilot Instructions

> Applies to: GitHub Copilot (chat + completions). Not for Claude Code / Cursor / Codex.

## Directory Contract

| Path         | Purpose                                                          |
| ------------ | ---------------------------------------------------------------- |
| `templates/` | Scaffolding templates (e.g. `web-nextjs`). One dir per template. |
| `packages/`  | Platform tooling packages (shared utilities, CLI future).        |
| `apps/docs`  | **AgentDock platform** documentation site (Fumadocs/Next.js).    |
| `openspec/`  | Single source of truth for platform planning.                    |

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

## Before Making Changes

- Read `openspec/config.yaml` for context.
- Check active changes in `openspec/changes/` before introducing new concepts.
- Prefer updating existing files over creating new ones.
