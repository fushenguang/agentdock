# Domain Packages Workspace — Agent Execution Boundaries

This repository is intentionally empty of business packages. It is a standards-driven workspace
where a human or AI coding agent creates the first formal domain package through a deterministic
generator.

## Required order

1. Read `README.md`, `standards-lock.json`, and the relevant skill under `.agent/skills/`.
2. For agent/CI work, write a non-interactive `package-spec.json` matching
   `schemas/package-spec.schema.json`, then run `pnpm create:package --spec package-spec.json`.
3. For an interactive human session, run `pnpm create:package` and answer the package id and intent
   prompts; do not create a temporary spec only to satisfy the generator.
4. Read the generated `apps/<package-id>/AGENTS.md` before changing package content.
5. Finish with `pnpm check` and the generated package-specific commands.

## Hard boundaries

- The App Agent owns LLM calls, agent loops, conversation context, memory, and tool policy.
- A package MUST NOT call an LLM or implement a second agent runtime.
- Package Web interaction MUST use intent-level routes, actions, elements, and capabilities.
- Do not automate a Web through DOM selectors or coordinates.
- `apps/<package-id>/web/` and generated seed databases are build staging, never source.
- Product roadmaps belong under `apps/<package-id>/roadmap.yaml`, not the workspace root or `apps/docs/`.
- Do not copy another package implementation. Extract a minimal pattern into the practice pack.

## Initial task protocol

Before creating the first package, the agent must obtain explicit human decisions for:

- package id;
- one-sentence domain outcome;
- display name;
- owner;
- whether Web is intentionally omitted.

Formal packages default to `hasWeb: true`. A no-Web formal package requires an approved
`noWebException` in the package spec.
