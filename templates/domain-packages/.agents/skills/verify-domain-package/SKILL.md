---
name: verify-domain-package
description: Run the narrow generated-package acceptance gate.
---

# Verify a domain package

Run:

```bash
pnpm check
pnpm check:<package-id>
```

Also verify that no generated `apps/<package-id>/web/` or seed database appears in a source commit.
