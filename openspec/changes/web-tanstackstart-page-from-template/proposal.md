---
roadmap-id: web-design-system
---

# web-tanstackstart-page-from-template — Every page starts from an Astryx template, enforced by check and build

## Why

The owner's ruling (thefoolai PRD `dp-web-design-system` W3): every page must start from an Astryx
page template, all AI coding agents must follow this strictly, and it must be enforced
programmatically — building a page means running `astryx build`. Today nothing enforces it:

- The agents that built TheFoolAI's `lean-flowkit` Web never ran `astryx build`.
- The template's docs mention `astryx template` once, as a reference to read, not as the way pages
  are made.
- A raw `astryx template` output dropped into `src/routes/` has no `Route` export. `tsr generate`
  only warns and exits 0, so the page silently 404s. Keeping its `export default` breaks
  route-level code splitting (the main chunk grew from 428.89 kB to 511.04 kB in the spike).

Change `astryx-web-integration` provides archetypes written to this template's conventions. This
change makes them the only way a page gets created.

## What Changes

- Add `@cogito.ai/astryx-web` to the template as a devDependency, run
  `astryx init --features agents`, commit the managed block, and reconcile it with the template's
  own rules.
- New entry `pnpm page:new "<intent>" --route <path> [--template <id>] [--allow-core]`: runs
  `astryx build`, scaffolds the start template, turns it into a file route, writes a provenance
  marker, moves the archetype's strings into a per-page catalog, formats, and regenerates routes.
- A provenance check that runs in both `check` and `build`: every route page needs the marker or an
  explicit exemption with a reason.
- Lint rules: no `style` attributes, no color literals, no viewport media queries in pages and
  components.
- The template's three sample pages are recreated through `page:new` from `dock-landing`,
  `dock-settings`, and `dock-workbench`.
- `AGENTS.md`, `LLM.md`, `.github/copilot-instructions.md`, and the `domain-packages` template's
  `add-web-route` skill point to the entry; `add-web-route` drops the obsolete "left agent / right
  workbench" premise.

## Non-goals

- The design-direction skill, the `DESIGN.md` contract, and the design gate (change
  `web-tanstackstart-design-direction`).
- Rewriting the template's obsolete environment premise and removing `impeccable` (same change).
- Updating projects that were generated before this change.
