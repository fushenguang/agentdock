---
roadmap-id: domain-packages-template
---

## Why

Coding agents need one non-interactive command to turn a package spec into a verified independent source repository.

## What Changes

- Add `agentdock create-domain-package` for local JSON and HTTPS specs.
- Reuse the existing domain-packages scaffold, run its checks, and optionally create and push to a Gitee enterprise repository.
- Carry localized display names and an optional short description through package generation.

## Capabilities

### New Capabilities

- `create-domain-package`: verified standalone generation and Gitee delivery.

### Modified Capabilities

## Impact

AgentDock CLI, domain-packages generator and docs. Young Design Master exercises the command in a separate product repository.

## Non-goals

- Inferring product features from natural language in the generator.
- Publishing App binaries or configuring Git server review rules.
