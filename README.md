# AgentDock

[中文](./README.zh-CN.md)

**AgentDock** is an open-source scaffold platform for building AI coding agent–ready projects. It provides opinionated, well-governed project templates that are designed from day one for collaboration with AI coding agents (GitHub Copilot, and more).

It also ships **`@cogito.ai/cli`** (bin name `agentdock`) — a CLI for scaffolding projects and for validating/publishing Agent Skills to a shared registry.

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
templates/    # Scaffolding templates (e.g., web-nextjs, skills-registry)
packages/
  cli/        # @cogito.ai/cli — the `agentdock` CLI (init, auth, skill, mcp)
openspec/     # Planning SSOT — proposals, specs, design, tasks
apps/
  docs/       # This platform's documentation site (Fumadocs / Next.js)
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

---

## CLI: `@cogito.ai/cli`

The CLI is published to npm as `@cogito.ai/cli`. Current version: **0.15.0**. Run it without installing via `npx`:

```bash
npx @cogito.ai/cli@latest <command>
```

### Command overview

Output of `npx @cogito.ai/cli@latest --help` (v0.15.0):

```
AgentDock CLI – scaffold projects for humans and AI agents (agentdock v0.15.0)

USAGE agentdock auth|init|mcp|skill

COMMANDS

   auth    Manage authentication
   init    Scaffold a new AgentDock project
    mcp    Start an MCP (Model Context Protocol) Stdio server exposing AgentDock tools
  skill    Validate and publish Agent Skills

Use agentdock <command> --help for more information about a command.
```

- **`auth login|logout|status`** — manage the credentials used by `skill publish` to index into the hosted registry.
- **`init`** — scaffold a new project from a template (`--name`, `--template`, `--pm`, `--dir`, `--data-layer`, `--schema`, plus `--silent`/`--json` for agent mode).
- **`mcp`** — starts an MCP Stdio server exposing AgentDock's tools. It is meant to be launched by an MCP-compatible client (it speaks JSON-RPC over stdio and produces no output when run standalone) — not something you run interactively yourself.
- **`skill validate|publish`** — validate an Agent Skill directory against the Agent Skills spec, and publish it into a registry checkout.

Every command and subcommand supports `--help` for its exact, current usage.

### Authentication

```bash
npx @cogito.ai/cli@latest auth status
```

`auth login` opens a browser-based device-authorization flow and stores credentials locally; `auth status` reports the signed-in identity from those stored credentials; `auth logout` removes them. Example `auth status` output when signed in (from a real run):

```json
{"event":"status","signedIn":true,"provider":"thefoolai","userId":"<uuid>","displayName":"<name>","savedAt":"<ISO timestamp>"}
```

**Known limitation — do not skip:** credentials are valid for **24 hours**. After they expire, `auth status` **still reports `signedIn: true`** — it only reads the local credential file and does not verify the token against the server. The failure only surfaces later: `skill publish`'s registry-indexing step silently degrades to a warning instead of erroring. If publish stops indexing your skill, re-run `auth login` first, even if `auth status` looks fine. This is tracked as debt `cli-auth-token-expires-silently`.

### Publishing a skill

```bash
npx @cogito.ai/cli@latest skill publish <skill-dir> --registry <registry-checkout>
```

This does two distinct things:

1. **Always**: validates the skill and writes/updates its manifest entry (`skills.json`) in the local `--registry` git checkout. This step has no network dependency — publishing to your local registry checkout works even when signed out. That's a deliberate design choice for portability.
2. **Only when signed in**: indexes the skill into the hosted registry. If you're signed out, this step is skipped entirely (no request is sent). If it's attempted but fails (e.g. an expired token, see above), the manifest write from step 1 still succeeds — indexing failure only produces a warning, and is not retried.

`SKILL.md`'s `metadata.version` field **must be a valid semver string**, or `skill publish` rejects the skill outright.

### Verifying a publish (`--json`)

The reliable way to check whether step 2 (indexing) actually happened is to read the JSON `skill publish --json` prints — not to guess from the human-readable text. Field semantics below are confirmed against the CLI's own source (`packages/cli/src/core/skillPublish.ts`, `registryIndex.ts`), not run live (publishing wasn't executed as part of writing this doc — see the note at the end of this section). Shape of a successful call:

```json
{
  "ok": true,
  "entry": { "...": "the manifest entry that was written" },
  "manifestPath": "skills.json",
  "updated": true,
  "anonymous": false,
  "versionMissing": false,
  "indexed": true
}
```

- **`indexed`** — whether the entry was also POSTed into the hosted registry, i.e. the field that answers "is this skill actually in the shared registry, not just my local `--registry` checkout." `indexed: false` **never** means the manifest write failed — `entry`/`manifestPath` are always written first and are never rolled back because indexing failed.
- **`indexed: false` + `anonymous: true`** — you weren't signed in, so no indexing request was even sent. This is the designed local-only path (see "Publishing a skill" above), not an error.
- **`indexed: false` + `anonymous: false`** — you were signed in, but the indexing request itself failed; the result also carries an `indexError` string with the reason. In practice the most common cause is the 24h-credential-expiry gap documented above (debt `cli-auth-token-expires-silently`): `auth status` still reports you as signed in, but the token has actually expired server-side. Re-run `auth login`, then publish again.
- **`updated`** — `true` when an existing manifest entry with the same skill id was replaced (a re-publish); `false` when a new entry was appended.
- **`versionMissing`** — `true` only when `SKILL.md` has no resolvable version at all (`metadata.version`, falling back to `metadata['thefool.version']`). This does not block publish, it's a warning — an actually-invalid (non-semver) version string is a different, harder failure: `skill publish` rejects it outright before anything is written (see above).

If you also want to eyeball the hosted registry's web page for the skill — `https://www.fujia.site/skills/<skill-id>`, where `<skill-id>` is the same `id` as in the manifest entry — open it in a browser and confirm the skill's content is genuinely rendered there. **Don't treat an HTTP 200 on that page as proof of anything** — it's a client-rendered route, and it returns 200 for a nonexistent id too. `indexed: true` from the CLI is the actual signal.

You can validate a skill without publishing:

```bash
npx @cogito.ai/cli@latest skill validate <skill-dir>
# ✓ <path> is a valid skill
```

### Known limitations

- **Skills at the repository root cannot currently be indexed** into the hosted registry (debt `repo-root-skill-cannot-be-indexed`). Keep skills in a subdirectory (e.g. `skills/<name>/`) if you intend to publish them.
- **CLI versions `<= 0.14.0` cannot publish** to the hosted registry — the server responds with `HTTP 426` (Upgrade Required), and those older CLI versions only surface the bare status code without an explanation. Always run publish via `npx @cogito.ai/cli@latest` to stay current.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for commit conventions and workflow.

## License

[MIT](./LICENSE) — see file for details.

<!-- TODO: confirm license choice before first public release -->
