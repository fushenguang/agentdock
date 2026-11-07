---
name: add-package-capability
description: Add a package business capability without inventing a host capability.
---

# Add a package capability

1. Read the target package's `capabilities/index.json`.
2. Add a descriptor with stable id, kind, input/output schemas, effects, idempotency, cancellation,
   errors, access, risk, and examples.
3. Keep host dependencies registry-native; do not invent `host.*`.
4. Update `agent/surface.json` only with a small stable summary.
5. Run `pnpm check:<package-id>`.
