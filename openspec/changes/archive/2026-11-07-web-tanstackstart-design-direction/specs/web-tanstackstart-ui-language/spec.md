## MODIFIED Requirements

### Requirement: Embedded App panel environment

The template's UI guidance MUST state that the same Web runs in three first-class places: the
TheFoolAI desktop App, where the package Web is the main surface; the mobile App's WebView on a
phone with touch; and a standalone browser. Phone (390x844), desktop (1440x900), and the narrowest
supported width (360px) MUST be explicit design targets. Widths MUST use container queries rather
than viewport queries, and layouts MUST NOT introduce horizontal scrolling at any supported width.

#### Scenario: Agent reads the environment before building UI

- **WHEN** an agent or developer reads `DESIGN.md`, `LLM.md`, or `AGENTS.md` in a generated project
- **THEN** it states that phone and desktop are first-class surfaces and points to
  `astryx docs dock-environment`

#### Scenario: Layout holds at panel widths

- **WHEN** a page renders at 390x844 and 1440x900
- **THEN** no horizontal scrolling appears, and width-dependent behavior follows container queries
