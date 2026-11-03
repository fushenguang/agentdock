---
roadmap-id: web-tanstackstart-template
---

# Update web-tanstackstart dependencies to current stable releases

## Why

The `web-tanstackstart` template has fallen behind the current stable releases of
TanStack Start, TanStack Router, Astryx, StyleX, React, Vite, Vitest, and the
supporting build and database tools. TanStack Start has reached stable v1, so new
projects should start from a current v1 dependency graph rather than an older
1.x patch baseline.

## What Changes

- Refresh every direct runtime and development dependency to the npm `latest`
  stable release available when the update is applied.
- Upgrade TanStack Start and TanStack Router to the current stable v1 releases.
- Regenerate the standalone pnpm 12 lockfile with the supported package-manager
  baseline unchanged.
- Update template and user-facing documentation to identify TanStack Start v1 and
  the current Astryx major/minor line.
- Publish the template refresh as a patch release of `@cogito.ai/cli`.

## Non-goals

- Changing application architecture, routes, features, data contracts, or UI
  behavior.
- Changing the supported Node or pnpm engine ranges.
- Updating other templates or unrelated workspace dependencies.
- Adopting prerelease, alpha, beta, or canary package versions.

## Impact

- `templates/web-tanstackstart/package.json`
- `templates/web-tanstackstart/pnpm-lock.yaml`
- `templates/web-tanstackstart/README.md`
- TanStack Start documentation index pages
- `@cogito.ai/cli` patch changeset
