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

Everything below was confirmed by actually running `skill publish` against disposable local git fixtures while writing this section (never against the real hosted registry — the local `--registry` checkout has no bearing on that; see the indexing step below for why that matters).

**Both arguments are required** — omit either one and `publish` exits immediately, before touching anything:

- **`<skill-dir>`** (positional) — path to the directory containing the skill's `SKILL.md`. Relative or absolute both work. Omitted → `Error: <dir> is required` (`--json`: `{"ok":false,"error":"MISSING_ARG","field":"dir"}`).
- **`--registry <registry-checkout>`** — the **root directory of a local git checkout of a skills registry**: the directory that contains (or will contain) a `skills.json` manifest. It is **not** a place your skill's files get copied into (see "What publish does" below), and it does **not** have to be a checkout of *this* repo — any local clone of a registry-shaped repo works. Omitted → `Error: --registry is required` (`--json`: `{"ok":false,"error":"MISSING_ARG","field":"registry"}`). Points at a path that doesn't exist → `✗ Registry checkout not found: "<path>"` (`--json`: `{"ok":false,"error":"REGISTRY_NOT_FOUND","message":"..."}`).

**Prerequisites** — each one maps to a real, confirmed error if unmet:

| Requirement | Error if unmet |
| --- | --- |
| `<skill-dir>` is inside a git repository | `"<dir>" is not inside a git repository` (`SKILL_SOURCE_UNRESOLVED`) |
| that repository has an `origin` remote | `no git remote "origin" configured for the repository containing "<dir>"` (`SKILL_SOURCE_UNRESOLVED`) |
| `SKILL.md` passes Agent Skills spec validation | `"<dir>" failed skill validation` + an `errors` list, e.g. `Missing required field in frontmatter: description` (`SKILL_INVALID`) |
| `metadata.version`, if present, is valid semver | `Invalid version "<v>" in "<dir>": expected semver (major.minor.patch, e.g. "1.2.3", optionally with a "-prerelease" and/or "+build" suffix, ...) — got "<v>"` (`SKILL_VERSION_INVALID`) |

A **missing** version is allowed (see `versionMissing` below) — only a **malformed** one is rejected outright.

**What `publish` actually does, and does not do:**

- ✅ Validates the skill, then writes or updates its entry in `<registry-checkout>/skills.json`. This step has no network dependency and works even signed out — a deliberate design choice for portability.
- ✅ If you're signed in (`agentdock auth login`), also POSTs the entry to the hosted registry ("indexing" — see "Verifying a publish" below). Skipped entirely, with no request sent, if you're signed out.
- ❌ Does **not** copy the skill's files into the `--registry` checkout. Only `skills.json` gains a new (or updated) entry; the skill itself is never touched or moved.
- ❌ Does **not** `git add`, `commit`, or `push` anything, in either the registry checkout or the skill's own repo — confirmed by running it and checking `git status` afterward, which shows the manifest as a plain uncommitted working-tree change. Committing and pushing `skills.json` is on you.
- **`entry.source` and `entry.path` come from the skill's OWN git repo** (its `origin` remote, normalized to a clonable, credential-free URL, plus its path inside that repo) — **not** from `--registry`. This is the one field derivation that is easy to get backwards, because the two ❌ items above make it tempting to assume `publish` "collects the skill into the registry repo." It never does. Practical consequence: the skill's own repo must be one a stranger can actually `git clone`, because that repo's URL — not the `--registry` checkout's — is what ends up in the manifest everyone else installs from.

**The CLI now always says where the entry points, and warns loudly when that's not where you'd expect.** Real output, captured from a run where the skill's own repo and the `--registry` checkout had different `origin` remotes:

```
✓ Added "demo-skill" in /path/to/registry-checkout/skills.json
  source: https://github.com/acme-private-org/private-skills-repo (path: skills/demo-skill)
⚠⚠ This entry points at https://github.com/acme-private-org/private-skills-repo — NOT your --registry checkout (https://github.com/acme-public-org/public-skills-registry). Anyone installing this skill must be able to `git clone` that repository — make sure it is public. Publishing from a private repo on purpose is fine, just know that is what happened here.
```

The `source:` line is **always** printed, whether or not it matches the registry checkout. The `⚠⚠` line fires only when it doesn't. **It's a warning, not a block** — publishing a skill that lives in a different (including a private) repo than your registry checkout is a legitimate thing to do, e.g. for a personal skill you don't intend anyone else to install; the warning exists so that stays visible instead of silent, not so it's disallowed. The CLI deliberately does not try to detect "is this repo actually private" — that would need a network call and credentials it doesn't have, so it prints the resolved `source` and leaves the judgment to you.

**Why this exists:** a real `skill publish <dir-inside-a-private-repo> --registry <checkout-of-a-public-content-repo>` run wrote a manifest entry whose `source` pointed at the private repo, with zero indication anywhere — output or docs — that `source`/`path` come from the skill's own repo rather than `--registry`. Anyone who tried to install that entry would fail at the `git clone` step, and the private repo's address was now sitting in a public file.

**Side effects, in full — this is the complete list, nothing else is touched:**
- `<registry-checkout>/skills.json` is created (if absent) or updated: a new entry is appended, or — if an entry with the same `id` (the skill's `name`) already exists — that entire entry is replaced (fields are never merged across publishes).
- The written/replaced entry's fields: `id`/`name` (from `SKILL.md`'s `name`), `description`, `source`, `path` (omitted if the skill sits at its repo's root), `license` (if present in frontmatter), `version` (if resolvable), `nonSpecFields` (if `skills-ref` downgraded any non-spec top-level frontmatter keys), `author` (if signed in), and `publishedAt` — always refreshed to the current timestamp, even on a re-publish where nothing else changed.
- Nothing is committed or pushed (see the ❌ items above).

**`--silent` and `--json`:** `--json` prints the machine-readable result (below) instead of the interactive/plain-text output. `--silent` currently behaves **identically** to `--json` — both make `publish` print that same JSON line to stdout, confirmed by running `--silent` alone (no `--json`) and observing JSON output. The output format is otherwise chosen by whether stdout is a TTY: an interactive terminal with neither flag gets the prompts-based UI (`@clack/prompts` — spinner, colored `✓`/`⚠`/`✗`); anything else (either flag, or stdout piped/redirected) gets plain-text `console.log`/`console.warn` lines unless `--json` or `--silent` is also set, in which case it's the JSON line instead. Use `--json` (or `--silent`, equivalently today) from scripts and agents that need to branch on the result programmatically; use neither when publishing by hand from a terminal.

### Verifying a publish (`--json`)

The reliable way to check whether indexing actually happened is to read the JSON `skill publish --json` prints — not to guess from the human-readable text. Shape of a successful call (fields confirmed by running publish with `--json`, against disposable local fixtures):

```json
{
  "ok": true,
  "entry": { "...": "the manifest entry that was written" },
  "manifestPath": "/path/to/registry-checkout/skills.json",
  "updated": false,
  "anonymous": false,
  "versionMissing": false,
  "indexed": true,
  "registrySource": "https://github.com/acme-public-org/public-skills-registry",
  "sourceRepoDiffersFromRegistry": false
}
```

- **`indexed`** — whether the entry was also POSTed into the hosted registry, i.e. the field that answers "is this skill actually in the shared registry, not just my local `--registry` checkout." `indexed: false` **never** means the manifest write failed — `entry`/`manifestPath` are always written first and are never rolled back because indexing failed.
- **`indexed: false` + `anonymous: true`** — you weren't signed in, so no indexing request was even sent. This is the designed local-only path (see "Publishing a skill" above), not an error.
- **`indexed: false` + `anonymous: false`** — you were signed in, but the indexing request itself failed; the result also carries an `indexError` string with the reason. In practice the most common cause is the 24h-credential-expiry gap documented above (debt `cli-auth-token-expires-silently`): `auth status` still reports you as signed in, but the token has actually expired server-side. Re-run `auth login`, then publish again.
- **`updated`** — `true` when an existing manifest entry with the same skill id was replaced (a re-publish); `false` when a new entry was appended.
- **`versionMissing`** — `true` only when `SKILL.md` has no resolvable version at all (`metadata.version`, falling back to `metadata['thefool.version']`). This does not block publish, it's a warning — an actually-invalid (non-semver) version string is a different, harder failure: `skill publish` rejects it outright before anything is written (see above).
- **`registrySource`** — the `--registry` checkout's own `origin` remote (normalized the same way `entry.source` is). **Present only when it could be resolved** — i.e. `--registry` itself points at a git checkout with a clonable `origin`. Absent for an ad hoc registry directory that isn't a git repo (common when experimenting locally); its absence is not an error.
- **`sourceRepoDiffersFromRegistry`** — `true` when `entry.source` (the skill's own repo) does not match `registrySource` (the `--registry` checkout's own repo) — the human/plain-text output's `⚠⚠` warning above is driven by this field. **Present only alongside `registrySource`** — when that can't be resolved, no comparison was made, so this field is omitted rather than defaulting to `false` (which would misleadingly read as "confirmed same").

**Common `--json` failure shapes**, each confirmed by running the corresponding failure live:

| Situation | `--json` output |
| --- | --- |
| `<dir>` omitted | `{"ok":false,"error":"MISSING_ARG","field":"dir"}` |
| `--registry` omitted | `{"ok":false,"error":"MISSING_ARG","field":"registry"}` |
| `--registry` path doesn't exist | `{"ok":false,"error":"REGISTRY_NOT_FOUND","message":"Registry checkout not found: \"<path>\""}` |
| `<dir>` not in a git repo | `{"ok":false,"error":"SKILL_SOURCE_UNRESOLVED","message":"\"<dir>\" is not inside a git repository"}` |
| that repo has no `origin` remote | `{"ok":false,"error":"SKILL_SOURCE_UNRESOLVED","message":"no git remote \"origin\" configured for the repository containing \"<dir>\""}` |
| `SKILL.md` fails spec validation | `{"ok":false,"error":"SKILL_INVALID","message":"\"<dir>\" failed skill validation","errors":["..."]}` |
| `metadata.version` is not valid semver | `{"ok":false,"error":"SKILL_VERSION_INVALID","message":"Invalid version \"<v>\" in \"<dir>\": ..."}` |
| published ok, but indexing failed (signed in, request failed) | `{"ok":true, ..., "indexed":false,"indexError":"<reason>"}` |
| published ok, not signed in (indexing never attempted) | `{"ok":true, ..., "indexed":false,"anonymous":true}` (no `indexError` — nothing was attempted) |

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
