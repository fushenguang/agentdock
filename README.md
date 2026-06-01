# AgentDock

**AgentDock** is an open-source scaffold platform for building AI coding agent–ready projects. It provides opinionated, well-governed project templates that are designed from day one for collaboration with AI coding agents (GitHub Copilot, and more).

---

## What AgentDock Is

- A **monorepo platform** that ships scaffolding templates for real-world projects.
- A **governance layer** — each template encodes conventions (directory contracts, architectural rules, commit standards) that both humans and AI agents follow.
- A foundation built on **TypeScript 5.9, turborepo, pnpm, and Next.js**, with Supabase as the default data layer.
- **OpenSpec-driven**: all platform decisions live in `openspec/` as the single source of truth.

## What AgentDock Is Not

- Not a finished application — it generates starting points for your own projects.
- Not an AI model or LLM service.
- Not a replacement for your own architecture decisions — it provides a governed baseline, not a cage.
- Not a multi-tool AI framework — MVP targets GitHub Copilot + Copilot CLI only.

## Repository Structure

```
templates/    # Scaffolding templates (e.g., web-nextjs)
packages/     # Platform tooling (shared utilities)
apps/
  docs/       # This platform's documentation site (Fumadocs / Next.js)
openspec/     # Planning SSOT — proposals, specs, design, tasks
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm 9 (`npm install -g pnpm@9`)

### Install & Build

```bash
pnpm install
pnpm build
```

### Development

```bash
# Run all dev servers in watch mode
pnpm dev

# Type-check the entire workspace
pnpm check-types

# Format all files
pnpm format
```

### Documentation

The platform docs are at `apps/docs`. Run them locally:

```bash
pnpm --filter docs dev
# Open http://localhost:3000
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for commit conventions and workflow.

## License

[MIT](./LICENSE) — see file for details.

<!-- TODO: confirm license choice before first public release -->
