## Context

The template is an empty standards-driven workspace whose generator creates the first package.
Its output is consumed by TheFoolAI's devkit, so "the files exist" is not enough: the generated
package must pass the same contract, system-capability, budget, Web-state, skills-index, and
standards-lock rules as a published package.

## Goals / Non-Goals

**Goals:**

- Make one `agentdock init` run produce a package that passes devkit profile 2.0.
- Keep source Web output outside Git while still allowing the real build to create `web/`.
- Keep every generated declaration machine-readable and self-sufficient.

**Non-goals:**

- Infer a domain-specific intent or Web UI beyond the starter workbench.
- Add new host capability dependencies.
- Move npm publication into this change.

## Decisions

### D1: Generated packages target the frozen 2.0 contract

The contract uses the rc.2 range and protocol 2.0.0. The surface is the v2 shape with no
identity audience, Web descriptors, and context tiers.

### D2: Required system capabilities are generated, not deferred

Any package with a Web runtime gets the spec-defined health, self-check, and delete-all-data
templates. The delete capability is host-only and critical; the other two are read-only.

### D3: Standards are pinned at generation time

The generator writes a package-local standards lock. The template carries the current
domain-package-spec, AI-First, repository, PCC, package-layout, media, and Web-scaffold
versions/digests so devkit can verify an external AgentDock workspace.

### D4: Skills use the v2 index

The starter skill has generic frontmatter only, is listed in `agent/skills-index.json`, and
references the generated intent and workbench capability.

## Risks / Trade-offs

- The standards lock is a pinned snapshot and must be refreshed when normative standards change.
- The source package has no build artifact until the package build command runs; devkit `hasWeb`
  validation is performed after the real package build.

## Migration Plan

Regenerate a package from the template. Existing packages use the package repository's 2.0
migration path instead of in-place template edits.
