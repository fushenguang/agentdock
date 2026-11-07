## Purpose

Make the owner's design direction — brand, UI style, UX, and color system — a precondition for
feature work in projects generated from `web-tanstackstart` and `domain-packages`, and give agents
a discoverable skill for reaching it.

## ADDED Requirements

### Requirement: Discoverable design skill with one source of truth

Generated repositories MUST contain the `astryx-web-design` skill at `.agents/skills/` with a
`.claude/skills/` symlink at the repository root, and `pnpm check` MUST fail when the vendored copy
differs from the installed `@cogito.ai/astryx-web` package.

#### Scenario: Both agents find the skill

- **WHEN** Codex or Claude Code starts at the repository root of a generated project
- **THEN** the skill is in `.agents/skills/astryx-web-design` and resolvable through
  `.claude/skills/astryx-web-design`

#### Scenario: An edited skill is caught

- **WHEN** a line of the vendored `SKILL.md` is changed
- **THEN** `pnpm check` fails and prints `pnpm design:sync-skill` as the fix

### Requirement: Design gate before feature pages

While `DESIGN.md` front matter `status` is not `approved`, `pnpm page:new` MUST refuse, and
`pnpm check` MUST fail if route pages exist beyond the template's samples. An `approved` contract
MUST name who approved it and when, the base theme, the brand color, and at least one dated
decision.

#### Scenario: A new project cannot start feature pages

- **WHEN** an agent runs `pnpm page:new` in a project whose `DESIGN.md` is `draft`
- **THEN** the command exits non-zero and points to the design-direction procedure

#### Scenario: An incomplete approval is rejected

- **WHEN** `DESIGN.md` says `approved` but `approvedBy` is empty
- **THEN** `pnpm check` fails

### Requirement: Directions come from the style archetypes

The design-direction procedure MUST propose exactly three directions taken from
`astryx docs dock-style-archetypes`, render them on the sample pages at 390×844 and 1440×900 in
light and dark, and wait for the owner with no deadline and no default.

#### Scenario: Round 1 material

- **WHEN** the agent finishes round 1
- **THEN** the owner has three directions, each with five written lines and a folder of renders,
  and the agent has stopped

### Requirement: Project design contract

A generated project MUST start with `DESIGN.md` (status `draft`) and `PRODUCT.md` skeletons that hold
only project-specific content; shared rules MUST live in `astryx docs dock-design-base`.

#### Scenario: A fresh project's contract

- **WHEN** a project is generated
- **THEN** `DESIGN.md` has `status: draft` and points to `astryx docs dock-design-base`

### Requirement: Obsolete premise and unused skills removed

The template MUST NOT describe the Web as a narrow auxiliary panel, MUST NOT reference
`impeccable`, and the `domain-packages` template MUST keep its skills in `.agents/skills`.

#### Scenario: Searching for leftovers

- **WHEN** `grep -rn "right-hand panel\|impeccable\|\.agent/skills" templates packages/cli` runs
- **THEN** it returns nothing
