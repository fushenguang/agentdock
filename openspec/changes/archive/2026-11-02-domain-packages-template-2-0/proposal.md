---
roadmap-id: domain-packages-template
---

## Why

The `domain-packages` AgentDock template still generated a domain-package-spec 0.6.0
contract and 1.x declaration shapes. A package created from the template therefore failed
the TheFoolAI devkit 2.0 profile: it used `identity.audience`, `authorization.audience`, and
message-bearing errors, omitted the required Web/context-tier surface, and lacked the
mandatory system capabilities and package standards lock.

## What Changes

- Generate contracts for spec `>=2.0.0-rc.2 <3.0.0` and protocol `=2.0.0`.
- Emit the v2 agent surface with Web availability and L0/L1/L2 context tiers.
- Emit caller-based Web authorization, sourced runtime state, and structured capability errors.
- Add the mandatory `system.health`, `system.selfCheck`, and host-only `system.deleteAllData`
  capability templates.
- Add the FORMAT-025 multi-skill index and a starter workbench skill.
- Pre-pin the package standards lock to the current 2.0 standards.
- Extend generator, workspace, CLI, and generated-package checks with the 2.0 assertions.

## Capabilities

### New Capabilities

- `domain-packages-template-v2`: deterministic generation of a package that passes the
  domain-package devkit 2.0 profile.

### Modified Capabilities

- `cli-template-registry`: the domain-packages template advertises version 0.3.0 and the
  current tested CLI version.

## Non-goals

- Publishing the CLI to npm.
- Migrating existing generated packages automatically.
- Revalidating the six external package migrations owned by issue #574.
- Changing domain-package-spec itself.

## Impact

- `templates/domain-packages/**`
- `packages/cli/src/core/__tests__/domainPackages.test.ts`
- CLI template distribution after the next build
- One minor changeset for `@cogito.ai/cli`
