## Context

The template is a standalone pnpm application whose lockfile is bundled into the
`@cogito.ai/cli` npm package. Its direct dependencies can be updated without
changing the template's public structure, but the refreshed graph must still pass
the template's complete format, lint, type, test, and production-build gate.

## Goals / Non-Goals

**Goals:**

- Resolve all direct dependencies to current stable npm releases.
- Place TanStack Start and TanStack Router on their current stable v1 releases.
- Keep the existing Node and pnpm support ranges and standalone workspace shape.
- Produce one atomic patch release containing the template, lockfile, docs, and
  changeset.

**Non-Goals:**

- Refactoring template source code merely to consume dependency majors.
- Adding or replacing libraries.
- Publishing from a developer machine; the repository publishes through
  Changesets and GitHub Actions.

## Decisions

### D1: Update direct dependencies from the `latest` dist-tag

Run pnpm's latest update mode from the template root, then regenerate the
standalone lockfile. This avoids updating to prerelease tags and keeps every
direct dependency aligned with the stable release selected by its maintainer.

### D2: Preserve compatibility boundaries

Do not change `engines`, the pnpm workspace file, or build approvals as part of
the dependency refresh. Dependency majors are accepted only if the complete
template check remains green.

### D3: Keep the release atomic

The template changes, documentation corrections, OpenSpec change, and
`@cogito.ai/cli` patch changeset stay on the same branch so the Version Packages
PR can publish the updated template contents without a timing gap.

## Risks / Trade-offs

- [A dependency major changes behavior despite a green build] → Run the complete
  template check and review the resulting package and lockfile diff.
- [Local and CI pnpm lockfile behavior differs] → Keep the existing lockfile
  version and supported pnpm range, then verify with the recommended pnpm 12
  release.
- [Documentation mentions stale versions] → Update the template stack table and
  TanStack Start documentation pages in the same change.
