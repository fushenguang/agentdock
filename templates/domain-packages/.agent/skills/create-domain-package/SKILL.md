---
name: create-domain-package
description: Create the first conforming domain package in this empty workspace.
---

# Create a domain package

1. In agent/CI mode, draft `package-spec.json` against `schemas/package-spec.schema.json`; in an
   interactive human session, run `pnpm create:package` and let the generator prompt for id/intent.
2. Require `hasWeb: true` unless the user has already approved a no-Web exception.
3. Run the selected generator mode; do not manually create package directories first.
4. Verify that the package root is `apps/<package-id>/` and Web source is `apps/web/`.
5. Run `pnpm install` and `pnpm check` after generation.

Human decisions required: package id, one-sentence outcome, display name, owner, and the approved
no-Web reason if applicable.
