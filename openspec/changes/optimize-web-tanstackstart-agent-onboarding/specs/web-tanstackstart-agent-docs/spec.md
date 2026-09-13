## Purpose

Provide one authoritative, AI-agent-oriented project document that explains the technology choices, architecture, constraints, and common implementation workflows.

## ADDED Requirements

### Requirement: Agent quick-start document

The template MUST include a root `LLM.md` for coding agents. It MUST explain the stack and rationale, architecture and dependency directions, commands, verification workflow, feature creation, route creation, data-layer changes, and UI development.

#### Scenario: Agent adds a feature without exploring the repository

- **WHEN** a coding agent receives a request to add a feature
- **THEN** `LLM.md` provides the file layout, import boundaries, repository flow, tests, and verification commands needed to begin implementation

#### Scenario: Agent understands technology choices

- **WHEN** an agent reads the stack section
- **THEN** it can explain why TanStack Start, TypeScript 7, Vite 8, Oxlint/Oxfmt, Astryx/StyleX, Drizzle, SQLite, and Supabase were selected

### Requirement: Agent entrypoints reference the guide

`AGENTS.md` and Copilot instructions MUST direct agents to read `LLM.md` before implementation.

#### Scenario: New agent session starts

- **WHEN** an agent loads `AGENTS.md` or Copilot instructions
- **THEN** the first required context step points to `LLM.md`
