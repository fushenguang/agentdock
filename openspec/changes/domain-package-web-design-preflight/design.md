## Context

`web-tanstackstart` already has a strong implementation contract: Astryx components, one-screen
skeletons, provenance markers, responsive rules, and design samples. It still assumes a page brief
exists before `page:new`. Generated domain packages often do not have one, so an agent guesses the
core job and turns every available capability into a visible section.

The `domain-packages` template is the right integration point. It already scaffolds a package and
invokes the pinned AgentDock Web template. It can add a domain-specific design skill without making
standalone `web-tanstackstart` projects depend on domain-package concepts.

## Goals / Non-Goals

**Goals:**

- Make the audience, style, hierarchy, and page grammar explicit before implementation.
- Make each page answer "what is the one job?" before `page:new`.
- Keep Astryx as the only implementation authority.
- Put the reusable workflow in a discoverable skill.
- Make the page brief durable in `DESIGN.md` so later agents do not re-derive it.
- Prevent the same product failures from being treated as post-generation lint issues.

**Non-Goals:**

- Building a universal design tutorial.
- Making the external design skills mandatory.
- Replacing `astryx-web-design`.
- Automatically generating visual design directions in every session.
- Adding dependencies or a new runtime.

## Decisions

### D1: Two-level intake, not one generic design prompt

**Decision.** The skill separates package intake from page intake. Package intake establishes the
audience, product posture, visual direction, density, typography/color/spacing, page grammar, and
component policy. Page intake establishes only the core job, primary action, above-the-fold
information, hidden-by-default information, and Astryx archetype.

**Why.** Re-asking package-level questions for every page wastes context; skipping page-level
questions causes agents to expose every feature. The two levels match the decisions that actually
change at each boundary.

### D2: The page brief lives in `DESIGN.md`

**Decision.** Add `## Page briefs` as a table in `DESIGN.md`. A new page cannot be scaffolded until
its normalized route has a complete row.

**Why.** `DESIGN.md` is already the approved contract and the source `page:new` reads. A Markdown row
is cheap for humans, durable for agents, and avoids another configuration system.

### D3: Information hierarchy precedes component choice

**Decision.** The brief classifies content as primary, secondary, auxiliary, and hidden by default
before mapping any control to Astryx. Repeated homogeneous records use rows; cards are reserved for
independently enterable/actionable units, one level deep.

**Why.** A global "no cards" rule is easy to evade. Deciding the content shape first makes the
component choice a consequence of the product model.

### D4: External references have narrow roles

**Decision.** Use Stitch for zero-to-one direction exploration, Taste Skill for aesthetic
constraints, UI UX Pro Max for design knowledge/rules, and Impeccable for critique and polish of an
existing surface. Astryx remains the final component, token, template, and acceptance authority.

**Why.** Each project contributes a different kind of evidence. Loading all of them as equal
authority produces conflicting styles and generic advice.

### D5: Place the skill in the domain-package template

**Decision.** Store the canonical skill under
`templates/domain-packages/.agents/skills/domain-package-web-design`, link it for Claude, and copy it
into each generated `apps/web/.agents/skills/` directory.

**Why.** The workflow is specific to domain packages. Keeping it out of the standalone Web template
avoids claiming that every TanStack Start project must use the domain-package design process.

### D6: Minimal preflight enforcement, minimal post-generation expansion

**Decision.** Extend `page:new` only to require a complete page-brief row. Keep the existing project
checks and existing Astryx visual acceptance. Do not add a new screenshot harness or mandatory
baseline in this change.

**Why.** The failure starts before code. One preflight condition prevents the missing product
decision without turning the workflow into a verification-heavy platform.

## Risks / Trade-offs

- Existing generated projects will not have the new Page brief section automatically. The skill
  instructs agents to add it before the next page; `page:new` fails closed with a concrete fix.
- The Markdown table parser can reject hand-edited rows with incorrect columns. The error names the
  missing row and required fields.
- Stitch and external skills may be unavailable. The workflow allows local Astryx samples and
  documented references instead; external tools never block the package from building.

## Migration Plan

1. Add the skill and references to the domain-packages template.
2. Copy the skill into newly scaffolded Web projects and link Claude discovery.
3. Expand `DESIGN.md`, `AGENTS.md`, and `LLM.md`.
4. Add the `page:new` brief requirement and tests.
5. Update bilingual template docs.
6. Validate OpenSpec, template tests, type checks, build, and an end-to-end package scaffold.

## Open Questions

- None blocking. Existing package pages receive their brief when next intentionally changed; no
  retroactive design rewrite is implied by this change.
