---
roadmap-id: web-tanstackstart-template
---

## Why

Generated domain-package Web pages can pass structural, style, and screenshot checks while still
being poor products. Agents commonly start from a generic page request, do not know the audience or
business hierarchy, expose every capability on the first screen, repeat information through cards,
and vary the page grammar between routes. More post-generation validation does not repair those
decisions.

The missing control is a design preflight: collect product context once per package, collect a core
job and information hierarchy for every page, then map the approved result to Astryx templates and
components before writing UI.

## What Changes

- Add a domain-package-only `domain-package-web-design` skill to the `domain-packages` template.
- Copy that skill into `apps/web/.agents/skills/` when a package Web is generated so Codex and Claude
  discover it automatically.
- Expand the generated `DESIGN.md` with audience, information hierarchy, visual direction, page
  grammar, content-shape/component policy, hidden-by-default policy, interaction, and page-brief
  sections.
- Require a page brief row in `DESIGN.md` before `page:new` creates a new page. The row records the
  page's core function, primary action, above-the-fold content, hidden-by-default content, and
  Astryx archetype.
- Position the external design references by role: Stitch for greenfield exploration, Taste Skill
  for aesthetic constraints, UI UX Pro Max for design rules, Impeccable for existing-page critique,
  and Astryx as the implementation authority.
- Update template and domain-package agent guidance so the design conversation happens before page
  implementation.
- Keep screenshots, visual regressions, and App-host acceptance as delivery evidence when needed;
  they are not a substitute for the preflight.

## Capabilities

### New Capabilities

- `domain-package-web-design-preflight`: package-level design intake, per-page briefs, external
  reference routing, Astryx mapping, and the enforced transition from design intent to page creation.

### Modified Capabilities

## Impact

- `templates/domain-packages/.agents/skills/domain-package-web-design/**`
- `templates/domain-packages/.claude/skills/domain-package-web-design`
- `templates/domain-packages/tools/create-package.mjs`
- `templates/domain-packages/AGENTS.md`, `README.md`, and generator tests
- `templates/web-tanstackstart/DESIGN.md`, `AGENTS.md`, `LLM.md`, `tools/page-new.mjs`, and tests
- `apps/docs/content/docs/{en,zh}/templates/web-tanstackstart/**`

## Non-goals

- Installing Stitch, Taste Skill, UI UX Pro Max, or Impeccable as runtime dependencies.
- Importing a second design system or changing Astryx tokens and components.
- Adding a heavy screenshot platform or making screenshot baselines mandatory for every page.
- Implementing a podcast audio editor or any package business surface in this change.
- Redesigning existing package pages without an owner-approved page brief.
- Committing, pushing, publishing, or releasing from this change.
