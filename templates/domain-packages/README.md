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
`apps/web/` `web-tanstackstart` workspace member. Generated declarations target domain-package
spec `>=2.0.0 <3.0.0` and protocol `=2.0.0`, including the v2 surface, caller-based Web
authorization, structured capability errors, and the multi-skill index.

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
pnpm smoke:<package-id>-package
```

The generated package Web commands target the fixed workspace member by its standard name:

```bash
pnpm --filter web dev
pnpm --filter web check
```

A generated package also exposes `start:web`, which launches the installed `apps/web` production server. The public template's `apps/<package-id>/web/` directory is release staging, and the build command automatically assembles the hosted runtime (`server.mjs`, protocol runtime, vault supply, and capability service) before running the startup smoke. Call `pnpm smoke:<package-id>-package` when the staged artifact needs an independent readiness check.

## Source and artifact boundary

The source repository contains package content and Web source only. `apps/<package-id>/web/` and generated
seed databases are ignored build staging. The build tool rewrites known build-machine paths and fails if
packaged text still contains an absolute build path. A release pipeline must build them from a clean source clone
and include them in an immutable artifact with checksum and metadata. The build fails unless the staged runtime
starts and `/_thefoolai/v1/health` returns `200` with `status: ready`.

## Readiness and delivery truths

Before creating or migrating a package, confirm the released AgentDock CLI and the template pin
include the current design-direction and page-provenance workflow. Then keep these independent
proof layers:

1. **Source and contract** — template checks, package tests and the consumer contract pass.
2. **Built artifact** — the production build starts from its extracted directory; never infer this
   from `pnpm dev`.
3. **App host** — the isolated App can perform the core task under its CSP, download, permission,
   persistence and Agent boundaries.
4. **Visible UX** — controls and canvas output are visible and operable at phone and desktop sizes,
   not merely present in the DOM.

For recreations, a fixed upstream commit plus copied source is still only the starting point. Keep
a source-parity matrix and record every host, visual and runtime adaptation. For migrations,
inventory existing pages and decide whether each is preserved or rebuilt from an Astryx archetype;
changing the theme alone is not a migration.

## AgentDock version

This template records the tested AgentDock CLI version in `standards-lock.json`. Package creation uses
that exact version rather than floating to `latest`.
