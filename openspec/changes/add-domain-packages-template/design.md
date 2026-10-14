# Design: add-domain-packages-template

## Template shape

```text
domain-packages/
  package.json
  pnpm-workspace.yaml
  standards-lock.json
  catalog.json
  AGENTS.md
  README.md
  schemas/
  tools/
    create-package.mjs
    check-workspace.mjs
    build-package.mjs
  .agent/
    practice/
    skills/
```

The template has no `<package-id>/` directory and no generated Web output.

## Deterministic creation

`package-spec.json` is the only human/agent input. It intentionally uses explicit lifecycle and
repository class fields rather than prompts, so package creation is reproducible in CI and agent
workflows.

The generator invokes the exact AgentDock CLI version recorded in `standards-lock.json`. The initial
release baseline is 0.27.0.

## Public/private boundary

This public template does not include the private TheFoolAI hosted runtime. It uses the public
`web-tanstackstart` template and emits package/Web Agent Surface contracts. A downstream platform may
add its private runtime assembly separately.

## Generated output

The generic build tool creates `<id>/web/` from the Web project build output and writes `build.json`.
The source `.gitignore` excludes this directory and generated seed databases. The tool is for local
staging; immutable release artifacts remain a release-pipeline responsibility.
