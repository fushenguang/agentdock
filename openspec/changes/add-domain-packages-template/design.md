# Design: add-domain-packages-template

## Template shape

```text
domain-packages/
  package.json
  pnpm-workspace.yaml
  openspec/
    config.yaml
    changes/
    specs/
  standards-lock.json
  catalog.json
  AGENTS.md
  README.md
  schemas/
  apps/
    docs/
    web/
  tools/
    create-package.mjs
    check-workspace.mjs
    build-package.mjs
  .agent/
    practice/
    skills/
```

The template has no `apps/<package-id>/` directory and no generated Web output. `apps/web/` contains
only a Git reservation marker until package creation replaces it with the `web-tanstackstart`
workspace member.

## Deterministic creation

`package-spec.json` is the non-interactive input contract. It intentionally uses explicit lifecycle
and repository class fields rather than prompts, so package creation is reproducible in CI and agent
workflows. In an interactive terminal, the generator can instead prompt for the package id and
intent and apply deterministic defaults for display name and owner; this path is for humans and is
never selected merely because a file is missing in agent mode.

`agentdock init` performs the same split: human mode asks for package id/intent after template
selection, while agent/JSON mode accepts explicit package arguments, a spec path, or no package input
to preserve the empty workspace. After the workspace template is copied, the CLI invokes the copied
generator directly. No package input is accepted for unrelated templates.

The generator invokes the exact AgentDock CLI version recorded in `standards-lock.json`. The initial
tested baseline is 0.27.1.

## Workspace layout

OpenSpec remains a root directory with only its lightweight configuration and directory contract;
the template does not add an OpenSpec dependency. Domain package roots and their ignored `web/`
staging live under `apps/<id>/`. Documentation is a dependency-free package under `apps/docs/`.
The package Web is the fixed `apps/web/` workspace member and uses package name `web`; this is a
standard `web-tanstackstart` workspace-mode target and does not require deriving a new path in the
template. The generator safely removes only the initial `apps/web/.gitkeep` reservation before
scaffolding that member.

## Public/private boundary

This public template does not include the private TheFoolAI hosted runtime. It uses the public
`web-tanstackstart` template and emits package/Web Agent Surface contracts. A downstream platform may
add its private runtime assembly separately.

## Generated output

The generic build tool creates `apps/<id>/web/` from the Web project build output and writes
`build.json`.
The source `.gitignore` excludes this directory and generated seed databases. The tool is for local
staging; immutable release artifacts remain a release-pipeline responsibility.
