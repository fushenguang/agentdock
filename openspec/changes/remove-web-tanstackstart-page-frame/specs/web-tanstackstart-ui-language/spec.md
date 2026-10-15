## Purpose

Remove the page-level card frame from the `web-tanstackstart` second-level page skeleton.

## ADDED Requirements

### Requirement: No page-level card frame

`PageShell` MUST NOT draw a rounded, bordered, card-background surface around page content and MUST
NOT expose a prop that enables one. Second-level pages MUST be structured with headings, spacing,
dividers, tabs and tables. A card MUST be used only for a genuinely independent interactive unit and
MUST NOT wrap a whole page or a section. `DESIGN.md`, `LLM.md`, `AGENTS.md` and the template docs
MUST NOT prescribe a content frame.

#### Scenario: Generated second-level page

- **WHEN** a project is scaffolded and its second-level demo page is rendered
- **THEN** the page content sits directly on the page background with no border, radius or card
  surface around it, the page itself does not scroll, and only the inner content region scrolls

#### Scenario: Agent reads the design guidance

- **WHEN** an agent reads `DESIGN.md`, `LLM.md` or `AGENTS.md`
- **THEN** none of them instruct wrapping a page or section in a card or frame, and the Skeleton
  rule states that cards are reserved for independent interactive units
