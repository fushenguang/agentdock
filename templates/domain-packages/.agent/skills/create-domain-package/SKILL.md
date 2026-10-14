---
name: create-domain-package
description: Create the first conforming domain package in this empty workspace.
---

# Create a domain package

1. Draft `package-spec.json` against `schemas/package-spec.schema.json`.
2. Require `hasWeb: true` unless the user has already approved a no-Web exception.
3. Run `pnpm create:package --spec package-spec.json`.
4. Do not manually create package directories before the generator succeeds.
5. Run `pnpm install` and `pnpm check` after generation.

Human decisions required: package id, one-sentence outcome, display name, owner, and the approved
no-Web reason if applicable.
