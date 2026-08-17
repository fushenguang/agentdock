# {{PROJECT_NAME}}

> Generated from the [AgentDock](https://github.com/CogitoTech/agentdock) `skills-registry` template.

A public **Agent Skills content registry**: a git repo of `skills/<name>/SKILL.md` canon, a
generated `skills.json` manifest anyone can consume, a Fumadocs documentation site, and three
CI gates that catch the two ways this kind of repo actually breaks — a stale manifest and a
leaked private detail — from day one.

## Tech Stack

| Layer            | Technology                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Skill validation | [`skills-ref`](https://www.npmjs.com/package/skills-ref) via `@cogito.ai/cli` (Agent Skills spec) |
| Docs             | [Fumadocs](https://fumadocs.dev) on [Next.js 16](https://nextjs.org)                              |
| Language         | [TypeScript 5+](https://www.typescriptlang.org) (strict mode)                                     |
| Gates            | Plain Node.js ESM scripts (`scripts/gates/*.mjs`) — zero build step                               |
| Package manager  | [pnpm](https://pnpm.io) ≥ 9                                                                       |
| Governance       | [OpenSpec](https://github.com/fission-ai/openspec), scoped to infra changes only                  |
| Monorepo         | [Turborepo](https://turbo.build/repo) + pnpm workspaces                                           |

## Directory Structure

```text
skills/
└── <name>/SKILL.md    # Canonical skill content — this is what gets published
skills.json             # Generated manifest, committed to git
apps/
└── docs/               # Fumadocs site; content/docs/skills/* is generated from skills.json
packages/                # Shared tooling packages (eslint-config, tsconfig)
scripts/
├── gates/               # The three CI gates
└── gen-skill-docs.mjs   # skills.json → docs pages
boundary-rules.json      # Gate ③'s configurable pattern table
openspec/                # Governance — infra/contract changes ONLY, not "add a skill"
```

## Getting Started

### 1. Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9 — `npm install -g pnpm`
- A git remote for this repo (public — `skill publish` derives each manifest entry's `source`
  from it)

### 2. Install dependencies

```bash
pnpm install
```

### 3. ★ Run the bootstrap command — do this first

`skill publish` derives each manifest entry's `source` from **this repo's own git remote**, so
this template cannot ship a correct `skills.json` — it has no way to know where you'll host the
repo. The shipped `skills.json` has a placeholder `source`. Populate the real one:

```bash
pnpm skills:sync
```

This republishes every skill under `skills/` into `skills.json` (using your repo's real git
remote) and regenerates the docs pages in `apps/docs/content/docs/skills/`. Gate ② fails until
you run this, and its failure message tells you to.

### 4. Start development

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) for the docs site.

## Adding a Skill

Adding a skill is a content contribution, not an infrastructure change — **it does not need an
OpenSpec proposal**. See `AGENTS.md` for the full "what needs openspec vs. what doesn't" table.

```bash
mkdir -p skills/my-skill
cat > skills/my-skill/SKILL.md <<'EOF'
---
name: my-skill
description: One sentence, in English — this is the field consumers read from the manifest.
license: MIT
---

# My Skill

Body content here.
EOF

agentdock skill validate skills/my-skill   # gate ① locally
pnpm skills:sync                            # regenerate skills.json + docs
git add skills/my-skill skills.json apps/docs/content/docs/skills
git commit -m "feat(skills): add my-skill"
```

Open a PR. The only gates are `agentdock skill validate` passing and review.

## The Three Gates

Run them all locally with:

```bash
pnpm gates
```

| Gate                      | Checks                                                                          | Fails on                                                                                |
| ------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| ① Full validation         | Every `skills/*` against the Agent Skills spec (`agentdock skill validate`)     | Any skill invalid — not just changed ones, so "A's change broke B" doesn't slip through |
| ② Manifest freshness      | `skills.json` vs. a fresh republish of `skills/*`; docs pages vs. `skills.json` | Any field mismatch except `publishedAt` (which changes every publish by design)         |
| ③ Public/private boundary | All git-tracked files vs. `boundary-rules.json` patterns                        | Private repo paths, internal domains, personally identifiable patterns                  |

Full detail on each gate, including how to read a failure: `apps/docs/content/docs/gates.mdx`.

## Development

### Common commands

```bash
pnpm dev              # Start the docs site dev server
pnpm build            # Build all workspace packages/apps
pnpm check-types      # TypeScript check
pnpm lint             # ESLint
pnpm skills:sync      # Regenerate skills.json + docs from skills/
pnpm gates            # Run all three CI gates locally
```

## Governance (OpenSpec)

This project uses [OpenSpec](https://github.com/fission-ai/openspec), but **only for
infrastructure/contract changes** — manifest schema, gate rules, docs structure. Adding a skill
does not go through it. See `openspec/config.yaml`'s `context` block and `AGENTS.md`.

```bash
openspec list                                  # List all changes
openspec status --change <name>                # Check change artifact status
openspec instructions apply --change <name>    # Get implementation instructions
```

## FAQs

**Q: Gate ② fails right after I ran `agentdock init` — before I've touched anything.**
A: Expected. Run `pnpm skills:sync` first (see step 3 above) — the shipped `skills.json` has a
placeholder `source` because the template can't know your repo's git remote in advance.

**Q: I edited a skill's `description` — why does gate ② fail?**
A: `skills.json` is generated, not hand-maintained. Run `pnpm skills:sync` to regenerate it,
then commit the updated `skills.json` alongside your skill change.

**Q: Why doesn't adding a skill need an OpenSpec proposal?**
A: OpenSpec is scoped to changes that alter the manifest schema, gate rules, or docs structure.
Adding a skill is a content contribution within an existing contract — see `AGENTS.md`'s table.

**Q: Can AI agents work in this project?**
A: Yes — see `AGENTS.md` for the autonomy boundary contract.

## Contributing

This project follows [Conventional Commits](https://www.conventionalcommits.org):

```
feat(skills): add pdf-extraction skill
fix(gates): correct manifest-fresh diff for optional fields
chore: update dependencies
```

## License

MIT
