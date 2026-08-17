# AgentDock Skills-Registry Template — Copilot Instructions

> Applies to: GitHub Copilot (chat + completions) in any project generated from this template.

## What this repository is

A public **Agent Skills content registry**: skill canon in `skills/<name>/SKILL.md`, a
generated `skills.json` manifest, and a Fumadocs docs site. It is a content repo, not a
product codebase.

## Monorepo Structure

| Directory                | Purpose                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `skills/<name>/SKILL.md` | Canonical skill content — this is what `skill publish` reads             |
| `skills.json`            | Generated manifest (id/name/description/source/path/license/publishedAt) |
| `apps/docs/`             | Fumadocs documentation site; `content/docs/skills/*` is generated        |
| `scripts/gates/`         | The three CI gates (see `apps/docs/content/docs/gates.mdx`)              |
| `packages/`              | Shared tooling packages (eslint-config, tsconfig)                        |

Run all commands from the monorepo root: `pnpm build`, `pnpm check-types`, `pnpm gates`.

## Adding a skill (the common case — no OpenSpec needed)

1. Create `skills/<name>/SKILL.md` with YAML frontmatter: `name` (must match the directory
   name) and `description` (English — it's the field consumers read from the manifest) are
   required by the Agent Skills spec.
2. Run `agentdock skill validate skills/<name>` locally, or `pnpm gate:validate` for all skills.
3. Run `pnpm skills:sync` to regenerate `skills.json` and the docs pages.
4. Open a PR. That's the only gate — no OpenSpec proposal.

## Changing the manifest schema, a gate, or the docs structure (needs OpenSpec)

These are infrastructure changes and go through `openspec/`: `manifest schema fields`,
`scripts/gates/*.mjs` rules, `boundary-rules.json` categories, docs site structure. See
`AGENTS.md`'s decision table and `openspec/config.yaml`'s `context` block.

## The Three Gates

1. **Gate ① — full validation**: `agentdock skill validate` against **every** `skills/*`
   directory, not just changed ones (catches "A's change silently broke B").
2. **Gate ② — manifest freshness**: republishes all skills into a temp registry and diffs
   against the committed `skills.json` (ignoring `publishedAt`, which changes every publish by
   design). Also diffs the generated docs pages against `skills.json`.
3. **Gate ③ — public/private boundary**: scans all git-tracked files against
   `boundary-rules.json`'s regex patterns (private repo paths, internal domains, personally
   identifiable patterns). This repo is public — nothing host-internal belongs here.

## Hard Rules

1. **No secrets** — Never write real API keys, tokens, or passwords. Use placeholders.
2. **pnpm only** — Do not use `npm install` or `yarn`.
3. **Conventional commits** — `type(scope): summary` format required.
4. **Don't hand-edit generated files** — `skills.json` and `apps/docs/content/docs/skills/*`
   are outputs of `pnpm skills:sync`. Edit the source `SKILL.md` instead.
5. **Skill directory name must match `name` frontmatter** — gate ① enforces this.
