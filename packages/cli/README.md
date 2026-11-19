# AgentDock CLI

**`@cogito.ai/cli`** — Scaffold production-ready AI coding agent projects for humans, CI pipelines, and AI agents.

[![npm version](https://img.shields.io/npm/v/@cogito.ai/cli)](https://www.npmjs.com/package/@cogito.ai/cli)

---

## Quick Start

```bash
# Interactive mode (for humans)
npx @cogito.ai/cli init

# Headless mode (for CI / AI agents)
npx @cogito.ai/cli init --name my-app --template web-nextjs --pm pnpm --json

# Workspace-member mode (existing pnpm workspace)
npx @cogito.ai/cli init --name my-app --template web-tanstackstart --dir apps/my-app --mode workspace --json

# Start MCP Stdio server (for AI agents via Model Context Protocol)
npx @cogito.ai/cli mcp
```

## Installation

```bash
# Run without installing (recommended)
npx @cogito.ai/cli <command>

# Global install
npm install -g @cogito.ai/cli
pnpm add -g @cogito.ai/cli
```

---

## Commands

`auth login|status|logout` manages sign-in for hosted skill indexing. `skill validate <dir>` checks a skill. `skill publish <dir> --registry <checkout> --json` writes a local manifest and reports whether hosted indexing succeeded.

### Create and verify a domain package

Save this as `package-spec.json`. Web is enabled by default. For an intentionally headless package, set `hasWeb` to `false` and supply `noWebException.reason` and `noWebException.approvedBy`. The [spec schema](https://github.com/fushenguang/agentdock/blob/main/templates/domain-packages/schemas/package-spec.schema.json) also covers bilingual names, descriptions and versions.

```json
{
  "id": "design-studio",
  "displayName": "Design Studio",
  "intent": "Create and export a design from a workspace conversation.",
  "owner": "@design",
  "lifecycle": "active",
  "repositoryClass": "product"
}
```

```sh
npx @cogito.ai/cli@latest create-domain-package --spec package-spec.json --dry-run --json
npx @cogito.ai/cli@latest create-domain-package --spec package-spec.json --json
```

Use Node and pnpm compatible with the generated template, a Git identity for the initial commit, and an unused target directory (`--dir` overrides `dp-<id>`). The dry run returns the plan. Creation runs the generated workspace checks and tests. For Web packages, it builds the package and starts the packaged runtime to check its health. App installation and editor interaction need separate acceptance.

For Gitee delivery, add `--provider gitee --namespace enterprise:<namespace>` and optionally `--visibility internal` (default `private`). Configure `GITEE_TOKEN` and SSH access. Retrying with the same spec bytes and directory resumes a recorded creation. In `--json` mode, inspect `ok`, the failed `phase`, or the successful `initialCommitSha` and `checks`.

### `agentdock init`

Scaffold a new project from a template. Auto-detects the environment:

- **TTY** → interactive prompts (human mode)
- **Non-TTY / `--silent` / `--json`** → headless execution (agent/CI mode)

| Flag             | Type    | Default    | Description                                                                    |
| ---------------- | ------- | ---------- | ------------------------------------------------------------------------------ |
| `--name`         | string  | required   | Project name and target directory name                                         |
| `--template`     | string  | required   | Template ID (e.g. `web-nextjs`)                                                |
| `--pm`           | string  | `pnpm`     | Package manager: `pnpm` / `npm` / `yarn` / `bun`                               |
| `--dir`          | string  | `./<name>` | Target directory (absolute or relative to cwd)                                 |
| `--mode`         | string  | `auto`     | Placement mode: `auto` / `workspace` / `standalone`                            |
| `--integrations` | string  | empty      | Optional integration ID; repeat or comma-separate. Currently supports `mastra` |
| `--json`         | boolean | `false`    | Output NDJSON result to stdout                                                 |
| `--silent`       | boolean | `false`    | Suppress all output                                                            |

`--mode auto` detects the nearest pnpm workspace and checks whether the target matches its `packages` globs. Workspace-member output does not copy `pnpm-workspace.yaml`, `pnpm-lock.yaml`, or `.npmrc`, and removes the member `packageManager` / `engines.pnpm` fields. Root `allowBuilds` changes are returned in `requiredRootChanges`; the CLI does not modify the root configuration.

**JSON output (success):**

```json
{
  "ok": true,
  "targetDir": "/path/to/my-app",
  "name": "my-app",
  "template": "web-nextjs",
  "mode": "standalone",
  "integrations": ["mastra"],
  "lockfileOwner": "/path/to/my-app/pnpm-lock.yaml",
  "requiredRootChanges": [],
  "rootConfigConflicts": []
}
```

**JSON output (failure):**

```json
{
  "ok": false,
  "error": "TARGET_DIR_EXISTS",
  "message": "Directory already exists: /path/to/my-app"
}
```

**Error codes:** `MISSING_ARG` · `TEMPLATE_NOT_FOUND` · `TARGET_DIR_EXISTS` · `CLI_VERSION_OUTDATED` · `SCAFFOLD_FAILED` · `INVALID_MODE` · `WORKSPACE_MODE_UNSUPPORTED` · `WORKSPACE_NOT_MATCHED` · `WORKSPACE_STANDALONE_CONFLICT` · `WORKSPACE_CONFIG_INVALID` · `WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE` · `WORKSPACE_NODE_INCOMPATIBLE` · `INVALID_INTEGRATION` · `INTEGRATION_NOT_SUPPORTED` · `INTEGRATION_CONFLICT`

---

### `agentdock mcp`

Start an MCP (Model Context Protocol) Stdio server. Exposes CLI capabilities as tools directly callable by AI agents.

```bash
agentdock mcp
```

**Available tools:**

| Tool               | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `list_templates`   | List project templates and supported integration IDs |
| `scaffold_project` | Scaffold with the same inputs as headless init       |

**VS Code Copilot MCP config (`.vscode/mcp.json`):**

```json
{
  "servers": {
    "agentdock": {
      "type": "stdio",
      "command": "npx",
      "args": ["@cogito.ai/cli", "mcp"]
    }
  }
}
```

---

## Available Templates

| Template ID  | Description                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `web-nextjs` | Next.js 16 + Supabase + next-intl + Tailwind CSS v4 + Vitest + Fumadocs — full-stack monorepo starter |

---

## Architecture

The CLI uses an **Adapter pattern** — a single executor core serves three consumer surfaces:

```
agentdock init
      │
      ├── TTY detected ──→ Human Adapter  (Clack interactive UI)
      └── Non-TTY / flags ──→ Agent Adapter (structured JSON output)

agentdock mcp ──→ MCP Adapter (MCP Stdio Server)

All adapters share the same Core Executor (scaffold + registry)
```

**Design principles:**

1. **Headless-first** — the executor core has no TTY dependency; the human UI is a thin shell on top.
2. **Structured output as protocol** — `--json` mode produces stable machine-parseable NDJSON, not natural language.
3. **One capability, three surfaces** — `scaffold_project` is implemented once and projected to CLI flags, JSON mode, and MCP tool automatically.

**Tech stack:**

| Component                                                                    | Role                                                      |
| ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Bun](https://github.com/oven-sh/bun)                                        | Build: single-file Node.js executable                     |
| [Citty](https://github.com/unjs/citty)                                       | Command modeling: sub-commands, flag schema, lazy loading |
| [Clack](https://github.com/bombshell-dev/clack)                              | Human interaction: TTY prompts                            |
| [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | Agent protocol: MCP Stdio server                          |
| [Changesets](https://github.com/changesets/changesets)                       | Release governance: semantic versioning + changelog       |

---

## Development

```bash
# Install dependencies
pnpm install

# Regenerate template registry
pnpm --filter @cogito.ai/cli generate-registry

# Run from source (no build needed)
npx tsx packages/cli/bin/agentdock.ts init

# Run tests
pnpm --filter @cogito.ai/cli test

# Build
pnpm --filter @cogito.ai/cli build
```

### Adding a template

1. Create `templates/<id>/` with a complete project structure.
2. Add `package.json` with `"agentdock": { "minCliVersion": "x.y.z" }`.
3. Run `pnpm --filter @cogito.ai/cli generate-registry`.
4. Publish a new CLI version — templates are bundled inside the npm package.

Single-package templates that should support embedding in a pnpm workspace can add `agentdock.workspaceMember.rootAllowBuilds`. Monorepo templates should remain standalone-only.

Templates that support a pnpm range without an exact `packageManager` pin can set `agentdock.packageManagerEnforced: true` and declare `engines.pnpm`. This keeps init pnpm-only while avoiding automatic package-manager switching.

### Publishing a new version

Record the release with `pnpm changeset`. After the change reaches `main`, the Release workflow opens a version PR. Merging that PR builds the package, publishes it and checks the public npm registry.

---

## License

MIT

---

[中文文档 →](./README-zh.md)
