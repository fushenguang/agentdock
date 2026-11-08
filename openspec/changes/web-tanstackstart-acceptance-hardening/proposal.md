---
roadmap-id: web-design-system
---

# web-tanstackstart-acceptance-hardening

## Why

The lean-flowkit migration upgraded Astryx from 0.7.5 to 0.7.8 while keeping page provenance
markers and the generated template lock on the previous version. The mismatch was found by manual
cross-checking instead of the template gate. The current template also declares the design-direction
integration from `@cogito.ai/astryx-web@0.2.0` while its standalone lock still installs 0.1.0.

## What Changes

- Move the template to the Astryx versions proven by lean-flowkit and the published design-direction
  integration.
- Require every page provenance marker's `astryx:` value to equal the installed Astryx CLI version.
- Add a negative test for stale provenance and refresh the generated sample markers.
- Publish one `@cogito.ai/cli` patch release from the merged main commit.

## Non-Goals

- No page-layout redesign, new runtime dependency, or product-specific canvas code.
- No change to the design-direction approval workflow or package publish policy.
