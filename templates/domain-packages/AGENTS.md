# Domain Packages Workspace — Agent Execution Boundaries

This repository is intentionally empty of business packages. It is a standards-driven workspace
where an AI coding agent creates one formal domain package through a deterministic generator.

## Required order

1. Read `README.md`, `standards-lock.json`, and the relevant skill under `.agent/skills/`.
2. Write a non-interactive `package-spec.json` matching `schemas/package-spec.schema.json`.
3. Run `pnpm create:package --spec package-spec.json`.
4. Read the generated `<package-id>/AGENTS.md` before changing package content.
5. Finish with `pnpm check` and the generated package-specific commands.

## Hard boundaries

- The App Agent owns LLM calls, agent loops, conversation context, memory, and tool policy.
- A package MUST NOT call an LLM or implement a second agent runtime.
- Package Web interaction MUST use intent-level routes, actions, elements, and capabilities.
- Do not automate a Web through DOM selectors or coordinates.
- `<package-id>/web/` and generated seed databases are build staging, never source.
- Product roadmaps belong under `<package-id>/roadmap.yaml`, not the workspace root.
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
