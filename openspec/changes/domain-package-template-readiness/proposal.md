---
roadmap-id: web-design-system
---

# domain-package-template-readiness

## Why

The published design-direction and page-provenance work is not fully propagated
into the `domain-packages` generator: its internal CLI pin remains `0.32.0`,
while `@cogito.ai/cli@0.32.1` adds the provenance gate proven during
lean-flowkit acceptance.

The template also needs to teach the delivery lessons that caused the largest
rework in the pilot: source reuse still requires parity work, dev success is not
artifact success, and UI quality must be measured through real interactions and
visible output.

## What Changes

- Pin `domain-packages` to the published CLI `0.32.1`.
- Require the current design-direction and template-provenance workflow.
- Add concise source-reuse, dev/build-parity and UI acceptance rules to the
  generated workspace and Web guidance.
- Add a patch changeset and publish the next CLI patch from merged main.

## Non-Goals

- No product-specific canvas code or new runtime dependency.
- No new page archetype or design-system visual language.
- No domain-package spec change.
