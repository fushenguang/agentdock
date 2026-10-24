# Domain Packages Workspace

An empty, standards-driven workspace for creating formal domain packages. The template ships no
business package by design; it carries the generator, schemas, OpenSpec directory, documentation
workspace, practice pack, and agent skills needed to create one correctly.

## Repository layout

```text
openspec/               # root specification workspace (no runtime dependency)
apps/<package-id>/      # generated domain package root
apps/<package-id>/web/  # ignored build staging
apps/docs/              # documentation workspace
apps/web/               # generated package Web source
tools/                  # generators and workspace checks
```

## Create the first package

Interactive humans can run the generator directly:

```bash
pnpm create:package
```

The generator asks for the package id and intent, offers a display-name default derived from the id,
and defaults owner to `@product-team`. Agent and CI workflows keep the deterministic file contract:

```bash
cat > package-spec.json <<'JSON'
{
  "id": "example-domain",
  "displayName": "Example Domain",
  "intent": "Help the user complete one concrete domain outcome with a reviewable artifact.",
  "owner": "@team",
  "lifecycle": "active",
  "repositoryClass": "product",
  "hasWeb": true
}
JSON

pnpm create:package --spec package-spec.json
pnpm install
pnpm check
```

The generator creates the package declarations under `apps/<package-id>/`, package-local agent
context, machine-readable package and Web surfaces, capability catalog, roadmap, and the fixed
`apps/web/` `web-tanstackstart` workspace member.

## Commands

```bash
pnpm create:package --spec package-spec.json
pnpm check
pnpm test
```

After a package exists, the generator also adds:

```bash
pnpm dev:<package-id>
pnpm check:<package-id>
pnpm build:<package-id>-package
```

The generated package Web commands target the fixed workspace member by its standard name:

```bash
pnpm --filter web dev
pnpm --filter web check
```

A generated package also exposes `start:web`, which launches the installed `apps/web` production server. The public template's `apps/<package-id>/web/` directory is release staging; TheFoolAI's private hosted-runtime assembly remains the packaging boundary for distributable OSS runtime artifacts.

## Source and artifact boundary

The source repository contains package content and Web source only. `apps/<package-id>/web/` and generated
seed databases are ignored build staging. The build tool rewrites known build-machine paths and fails if
packaged text still contains an absolute build path. A release pipeline must build them from a clean source clone
and include them in an immutable artifact with checksum and metadata.

## AgentDock version

This template records the tested AgentDock CLI version in `standards-lock.json`. Package creation uses
that exact version rather than floating to `latest`.
