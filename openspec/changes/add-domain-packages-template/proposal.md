---
roadmap-id: domain-packages-template
---

# Proposal: add-domain-packages-template

## Why

Domain-package product repositories need an official AgentDock starting point that is empty of
business packages but not empty of engineering knowledge. Copying an existing product repository
carries unrelated history, roadmap, source, and generated output; asking an AI coding agent to
reconstruct paths from memory produces drift.

The platform needs a public `domain-packages` template that initializes a clean workspace, then lets
an agent create a conforming package through a deterministic, non-interactive generator.

## What Changes

1. Add the `domain-packages` standalone template:
   - no business package at initialization;
   - workspace catalog;
   - standards lock with `agentdockCliVersion`;
   - package creation spec schemas;
   - practice pack and six golden-path agent skills;
   - workspace checks.
2. Add `pnpm create:package --spec package-spec.json`:
   - validates id, intent, owner, lifecycle, residency, and no-Web exception;
   - generates package declarations, system prompt, roadmap, package-local agent context, Agent
     Surface, Web Surface, and capability catalog;
   - invokes the pinned AgentDock CLI to create `apps/<id>-web` with `web-tanstackstart`;
   - adds package-specific dev/check/build commands.
3. Make formal packages default to `hasWeb: true`; no-Web requires an approved exception.
4. Add a generic package build staging script that builds Web output into ignored `<id>/web/`.
5. Register the template in the CLI registry and test standalone scaffolding.
6. Add bilingual template documentation.
7. Add a minor changeset so the CLI releases as 0.27.0.

## Capabilities

### New Capabilities

- `domain-packages-template`: empty workspace initialization, deterministic package creation,
  practice-pack distribution, and package Web scaffolding.

### Modified Capabilities

- `cli-template-registry`: exposes the new standalone template and its `none` data-layer default.

## Non-goals

- Do not bundle a business domain package.
- Do not distribute private TheFoolAI hosted-runtime source in the public npm package.
- Do not implement a package-owned LLM, agent loop, conversation memory, or tool policy.
- Do not move or migrate existing domain-packages repositories.
- Do not publish the release from this proposal without the normal release gate.

## Impact

- Adds `templates/domain-packages`.
- Regenerates `packages/cli/src/registry.json`.
- Extends CLI registry/scaffold tests.
- Adds English and Chinese template documentation.
- Adds a `@cogito.ai/cli` minor changeset.
