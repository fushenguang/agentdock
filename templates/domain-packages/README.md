# Domain Packages Workspace

An empty, standards-driven workspace for creating formal domain packages. The template ships no
business package by design; it carries the generator, schemas, practice pack, and agent skills needed
to create one correctly.

## Create the first package

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

The generator creates the package declarations, package-local agent context, machine-readable package
and Web surfaces, capability catalog, roadmap, and a `web-tanstackstart` Web project.

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

## Source and artifact boundary

The source repository contains package content and Web source only. `<package-id>/web/` and generated
seed databases are ignored build staging. A release pipeline must build them from a clean source clone
and include them in an immutable artifact with checksum and metadata.

## AgentDock version

This template records the tested AgentDock CLI version in `standards-lock.json`. Package creation uses
that exact version rather than floating to `latest`.
