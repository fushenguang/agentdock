# Contributing to AgentDock

Thanks for your interest in contributing!

## Prerequisites

- Node.js ≥ 18
- pnpm 9
- Familiarity with [Conventional Commits](https://www.conventionalcommits.org/)

## Getting Started

```bash
pnpm install
pnpm build
pnpm check-types
```

## Commit Convention

We use **Conventional Commits**. Every commit message must follow:

```
<type>(<scope>): <short summary>
```

**Types:**

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature or capability                               |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `chore`    | Tooling, config, dependency updates                     |
| `test`     | Adding or updating tests                                |
| `ci`       | CI/CD pipeline changes                                  |

**Examples:**

```
feat(templates): scaffold web-nextjs base layout
fix(docs): broken link in getting-started page
chore(root): update turbo to 2.9.16
```

**Scope** is optional but encouraged — use the affected package or area (e.g. `docs`, `templates`, `packages/cli`, `openspec`).

## Workflow

1. Fork & clone the repo.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make changes scoped to one concern per commit.
4. Run `pnpm check-types && pnpm lint && pnpm format` before pushing.
5. Open a pull request against `main` with a clear description.

## Repository Structure

```
templates/    # Scaffolding templates (e.g., web-nextjs)
packages/     # Platform tooling packages
apps/
  docs/       # AgentDock platform documentation site
openspec/     # Source of truth for platform planning (OpenSpec)
```

## Code Style

- TypeScript strict mode — no `any`, no implicit returns.
- Prettier (auto-applied via `pnpm format`).
- No real secrets or API keys — use placeholder values like `YOUR_KEY_HERE`.

## Questions?

Open an issue or start a discussion.
