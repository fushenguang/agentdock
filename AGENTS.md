# AgentDock — Agent Execution Boundaries

> For: Copilot CLI (`gh copilot`). Supplements `.github/copilot-instructions.md`.

## Meta-Repo Self-Exception

AgentDock is an **AI Coding Agent scaffold platform** — it cannot fully bootstrap itself from its own templates. Rules that exist to govern _generated projects_ (e.g. anti-drift invariants, Layer 2 constraint gates) apply to `templates/` output, **not** to this repository unless explicitly declared.

Exempted from template-oriented rules:

- Orphan-feature detection (platform tooling may predate a template).
- Layer 2 architectural constraint gates (governed by change `add-layer2-constraint-gates`).
- Any rule prefixed with "template-only" in specs.

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

## Acceptance Criteria (for any change)

Before marking a change done, verify:

1. `pnpm install` — exits 0, no workspace member missing.
2. `pnpm check-types` — exits 0.
3. `pnpm build` — exits 0 for all affected packages.
4. `pnpm format` — no diff after running (files already formatted).
5. `openspec validate <change-name>` — exits 0.
6. No real secrets detected (grep for common key patterns).
