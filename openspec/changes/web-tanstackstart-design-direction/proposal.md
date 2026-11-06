---
roadmap-id: web-design-system
---

# web-tanstackstart-design-direction — Agree the design direction with the owner before any feature work

## Why

- **No human ever set the direction.** TheFoolAI's `lean-flowkit` Web has no `PRODUCT.md`; the
  `impeccable` skill was read in 10 sessions but its `init` never ran, so brand, style, and color
  were improvised in code. The owner's ruling (thefoolai PRD `dp-web-design-system` W4): after
  initialization and before any real requirement, the agent must hold a design discussion with the
  owner — product brand, UI, UX, color system — and settle the Web's design norms.
- **The shared rules were overwritten.** The template's `DESIGN.md` held both the shared design
  rules and the project's own contract; an agent rewrote it wholesale for its product and every
  shared rule disappeared without any check noticing.
- **The environment premise is obsolete.** `DESIGN.md`, `AGENTS.md`, and `LLM.md` still say the Web
  is "embedded in the App's right-hand panel (~380px)" with touch "rare" and an "enterprise internal"
  feel. The owner corrected this (W5): these Webs have a mobile App, mobile is a primary surface,
  and the package Web is the main surface of the desktop App.
- **Skills are not discovered.** Codex discovers `<dir>/.agents/skills` from the repository root to
  the working directory; Claude Code discovers `.claude/skills`. Neither reads
  `apps/web/.github/skills` or the `domain-packages` template's `.agent/skills` (spike Q2; in 23
  Codex sessions, `impeccable` and `add-web-route` were never in the injected skill list).

## What Changes

- Skill `astryx-web-design`, shipped in `@cogito.ai/astryx-web` and vendored into generated
  repositories at `.agents/skills/astryx-web-design` with a `.claude/skills` symlink. A check fails
  if the vendored copy differs from the installed package. It covers the design-direction
  discussion, building pages, and visual acceptance.
- Astryx doc `dock-style-archetypes`: eight style archetypes built on Astryx's built-in themes. The
  discussion may only propose directions from this table.
- `DESIGN.md` becomes the project's own design contract skeleton (`status: draft`), and a
  `PRODUCT.md` skeleton is added. Shared rules live in `astryx docs dock-design-base`.
- A design gate: while `DESIGN.md` is not `approved`, `page:new` refuses and `check` fails when
  pages beyond the template samples exist.
- `pnpm design:samples` renders pages for the discussion and for acceptance.
- Cleanup: remove `impeccable`; rewrite the environment premise; document where skills live; rename
  the `domain-packages` template's `.agent/skills` to `.agents/skills` with `.claude/skills`
  symlinks; archive two finished changes that carried the old premise; mark the package
  repository's embedded-panel discussion page as superseded.

## Non-goals

- Running the discussion for any existing project (thefoolai PRD rows 5–6 do it for
  `lean-flowkit`).
- The `build-domain-package-skill` stage in thefoolai (its row 4).
- The `web-tanstackstart-kids` template.
- Custom Astryx themes beyond the one brand theme each project creates.
