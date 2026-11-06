# Design — web-tanstackstart-design-direction

Facts come from the audit and spikes recorded with thefoolai PRD `dp-web-design-system`. Appendix
A–C are exact text written by the planning layer; implement them as written.
Paths are inside `templates/web-tanstackstart/` unless they say otherwise.

## D1 · Skill packaging and discovery

- Source of truth: `packages/astryx-web/skills/astryx-web-design/` (`SKILL.md` plus
  `references/design-direction.md`, `references/page-building.md`, `references/acceptance.md`).
  Text in Appendix A. It ships in the package (`files` already lists `skills/`).
- Vendored copies:
  - `templates/web-tanstackstart/.agents/skills/astryx-web-design/` and a relative symlink
    `.claude/skills/astryx-web-design` → `../../.agents/skills/astryx-web-design`;
  - `templates/domain-packages/.agents/skills/astryx-web-design/` with the same symlink at the
    `domain-packages` repository root (the Web lives in `apps/web`, agents start at the root).
- `tools/check-skill.mjs`, run in `check`: walk up from the project directory to the git root, find
  `.agents/skills/astryx-web-design/`, and compare every file's sha256 with
  `node_modules/@cogito.ai/astryx-web/skills/astryx-web-design/`. Fail on a missing or different
  file, and print the fix: `pnpm design:sync-skill`, which copies the package version over the
  vendored one. Also fail when `.claude/skills/astryx-web-design` does not resolve to the vendored
  directory; on Windows the message says to enable `git config core.symlinks true`.
- Why vendored and checked rather than read from `node_modules`: agents only discover skills at the
  repository root, and the check keeps one source of truth.

## D2 · Style archetypes

Add Appendix B to the package as the Astryx doc `dock-style-archetypes`. The design discussion may
only propose directions from it. Reference brands describe a look; never copy their fonts, logos,
or assets.

## D3 · Design contract and product skeleton

- Replace `DESIGN.md` with the skeleton in Appendix C (front matter `status: draft`). Every shared
  rule now lives in `astryx docs dock-design-base`; `DESIGN.md` keeps only what is specific to the
  project.
- Add `PRODUCT.md` from Appendix C.
- Update `AGENTS.md`, `LLM.md`, and `.github/copilot-instructions.md` "read first" lists: `PRODUCT.md`,
  then `DESIGN.md`, then the skill.

## D4 · Design gate

- `page:new` refuses while `DESIGN.md` front matter `status` is not `approved`:
  `Design direction is not approved. Run the astryx-web-design skill (references/design-direction.md) and wait for the owner.`
- `tools/check-design.mjs`, run in `check`:
  - front matter must parse; `status` is `draft` or `approved`;
  - when `approved`: `approvedBy`, `approvedAt`, `theme.base` (an Astryx theme id), and
    `theme.brandColor` are set, and the `## Decisions` section has at least one dated entry;
  - when not `approved`: fail if any route page exists beyond those listed in
    `tools/sample-pages.json` (the three samples from change `web-tanstackstart-page-from-template`).
- Parse the front matter with a dependency the template already has; if there is none, write a
  small parser for these flat fields. Do not add a dependency.
- Only the design-direction procedure sets `approved`, and only after the owner approves in the
  conversation; the agent quotes the owner's words in `## Decisions`.

## D5 · `pnpm design:samples`

A template script that calls `astryx-web samples` with the app's appearance storage keys filled in,
so callers pass only routes, themes, modes, sizes, and `--out`. It does not start the dev server;
the caller runs `pnpm dev` first. Add `design-samples/` to `.gitignore` as the default output.

## D6 · Brand theme

After the owner picks a brand color (Appendix A, round 2), create the theme by following
`pnpm exec astryx docs author-a-theme`: start from the chosen base theme (`astryx theme eject`),
apply the palette from `astryx theme palette generate`, build it (`astryx theme build`), and make
it the default in `AppearanceProvider`'s theme options without removing the built-in themes.
Body text keeps at least 4.5:1 contrast in both modes. Prove the procedure once on a temporary
project (task 7.1) so the skill's instructions are known to work.

## D7 · Cleanup

- **Remove `impeccable`** (files listed for owner approval, AgentDock `.claude/CLAUDE.md`):
  `.github/skills/impeccable/` (whole directory), its row in `.github/skills/THIRD_PARTY_SKILLS.md`,
  its license file under `.github/skills/licenses/` if no other skill uses it, and every mention in
  `AGENTS.md`, `LLM.md`, `.github/copilot-instructions.md`, and `.github/skills/README.md`.
- **Environment premise**: replace "Width is the scarcest resource … right-hand panel (~380px, hard
  minimum 360px)" in `AGENTS.md` and `LLM.md` §10, and the matching text in
  `.github/copilot-instructions.md`, with: "Phone and desktop are both first-class: the same Web
  runs in the mobile App, the desktop App (as the main surface), and a browser. Read
  `astryx docs dock-environment`." Keep the container-query and no-horizontal-scroll rules.
- **Where skills live**: in `AGENTS.md` and `LLM.md` §12 say that Codex reads `.agents/skills` and
  Claude Code reads `.claude/skills` at the repository root; skills under `.github/skills` are for
  Copilot and are read by path when needed.
- **`domain-packages` template**: `git mv templates/domain-packages/.agent/skills
templates/domain-packages/.agents/skills`; add a `.claude/skills/<name>` symlink for every skill;
  update every reference to `.agent/skills` in `templates/domain-packages/**` and `packages/cli/**`
  (`grep -rn "\.agent/skills"` must return nothing afterwards).
- **Finished changes**: `web-tanstackstart-ui-contract-adoption` (code merged; only "wait for owner
  preview approval" unticked) and `remove-web-tanstackstart-page-frame` (all tasks done) are still
  active and carry the old premise. Archive both **only after the owner confirms** (asked in the
  planning PR). Then add a `MODIFIED` delta to this change for the `web-tanstackstart-ui-language`
  requirement "Embedded App panel environment", replacing it with the environment of Appendix A of
  change `astryx-web-integration` (A2).
- **Package repository** (`domain-packages`, Gitee): a docs PR that puts a "superseded" note at the
  top of `apps/docs/content/docs/web-practice/embedded-package-web-ux.mdx`, pointing to
  `astryx docs dock-design-base` and thefoolai PRD `dp-web-design-system`. Merge commit.

## D8 · Release

Changesets: `minor` for `@cogito.ai/astryx-web` (skill and style doc), and one for
`@cogito.ai/cli` (template changes). Publish from `main` after merge; record version → commit →
sha512 and tag each package.

## Stop and report

- The owner has not confirmed archiving the two finished changes.
- A theme cannot be built from a generated palette by following Astryx's docs.
- Symlinks cannot be committed or resolved in the CI environment.
- Any step would add a dependency, or change the root `pnpm-workspace.yaml` or root dependencies.

## Appendix A · Skill text

### A1 · `SKILL.md`

```markdown
---
name: astryx-web-design
description: Use before any UI work in a web-tanstackstart project or a domain package Web. If DESIGN.md is not approved, hold the design-direction discussion with the owner (brand, UI style, UX, color system) and stop until they decide; otherwise create pages only with pnpm page:new and accept them at phone and desktop sizes.
---

# Astryx web design

| Situation                                                              | Read                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `DESIGN.md` says `status: draft` (new project, or no direction agreed) | `references/design-direction.md`, before any feature work |
| Adding or changing a page                                              | `references/page-building.md`                             |
| About to call UI work done                                             | `references/acceptance.md`                                |

Rules that never bend:

- No feature page before the owner approves the design direction. Never choose for the owner, never
  set a deadline, never fall back to a default.
- Every page comes from `pnpm page:new`. Never lay a page out from scratch.
- The shared rules are in `pnpm exec astryx docs dock-design-base`. Read the section you need
  instead of guessing.
- Screenshots are for judging what the user sees. Never use them to watch CI or progress.
```

### A2 · `references/design-direction.md`

```markdown
# Design direction (before any feature work)

Outcome: the owner decides the brand, UI style, UX model, and color system. You record them in
`PRODUCT.md` and `DESIGN.md` and set `DESIGN.md` to `approved`.

## 1 · Understand the product (no visuals yet)

Read the product's intent first (`README.md`; in a domain package also `contract.json` and
`roadmap.yaml`). Then ask the owner at most three questions per message until `PRODUCT.md` can be
filled:

- who uses it, where (phone, desktop App, browser), and how often;
- the one or two core tasks, and what "done" looks like for the user;
- the brand's personality in three adjectives, and one or two products it must not feel like.

Write `PRODUCT.md`, show it, and correct what the owner corrects.

## 2 · Round 1: three directions

1. Read `pnpm exec astryx docs dock-style-archetypes`. Choose three rows that fit `PRODUCT.md` and
   differ along one named axis (for example calm ↔ energetic). Never propose a direction that is
   not in the table.
2. For each direction write five lines: the archetype and its base theme; type, density, and
   radius; navigation on phone and on desktop; the first screen; the core task in three steps.
3. Render the three sample pages (landing, settings, workbench) under each direction's base theme:
   `pnpm dev`, then
   `pnpm design:samples --route /zh-CN --route /zh-CN/settings --route /zh-CN/hello --theme <base> --mode light --mode dark --size 390x844 --size 1440x900 --out <dir>/round1/<direction>`.
   Use the output directory the owner gave you; if none, `design-samples/` at the repository root.
   If a base theme is not installed yet, add it first with `pnpm exec astryx theme add <slug>`;
   after the decision, remove the themes that were added only for this round.
4. Send the owner the five lines and the render folder for each direction. **Stop and wait.** No
   deadline, no default. If the owner mixes directions or asks for changes, adjust and render again.

## 3 · Round 2: brand color

1. For the chosen direction, generate two or three palette candidates with
   `pnpm exec astryx theme palette generate <config>` (`pnpm exec astryx docs cli/commands/theme-palette`).
2. Build each candidate as a theme (`pnpm exec astryx docs author-a-theme`) and render the landing
   page with each one, light and dark, phone and desktop, into `<dir>/round2/<candidate>`.
3. Send the candidates with their contrast ratios for body text. **Stop and wait.**

## 4 · Record

1. Keep the chosen brand theme as the project's default theme; remove the other candidates.
2. Fill `DESIGN.md`: front matter, then Overview, Colors, Typography, Layout and navigation, Pages
   (planned routes with their archetypes), Do and don't.
3. Add a dated entry to `## Decisions`: what was chosen, what else was shown, and the owner's words.
4. Set `status: approved`, `approvedBy`, and `approvedAt` only now. Run `pnpm check`.
```

### A3 · `references/page-building.md`

```markdown
# Building a page

1. Name the page by type and purpose: "<type> page for <purpose>" (types: landing, workbench,
   list, form, settings, editor). Run `pnpm page:new "<intent>" --route <path>`. If it rejects the
   intent, pick a template from the list it prints and pass `--template <id>`.
2. Replace the `SAMPLE_*` data with feature data through the feature's public API (`LLM.md` §7).
3. Write the page's copy in `src/i18n/pages/<page>.ts` for every locale.
4. Change the page only inside its sections; keep its frame, gaps, and padding. For a part the
   archetype lacks, `pnpm exec astryx build "<part>"` lists blocks; print one with
   `pnpm exec astryx template <Block>`, then move its strings to the catalog and drop any `style`
   attribute.
5. A domain component (a canvas, a player) goes into the archetype's slot; never replace the frame.
6. Follow `DESIGN.md` and `pnpm exec astryx docs dock-design-base`. Run `pnpm check`, then
   `references/acceptance.md`.

Never: lay a page out from scratch; use a Core template without `--allow-core`; add a package to
satisfy a template's import.
```

### A4 · `references/acceptance.md`

```markdown
# Visual acceptance

1. `pnpm dev`, then `pnpm design:samples` for every changed route with the project theme, light and
   dark, 390x844 and 1440x900.
2. Open every image and check it against `pnpm exec astryx docs dock-visual-acceptance` and
   `pnpm exec astryx docs dock-refuse-list`, plus `DESIGN.md`.
3. Also check: no horizontal scroll at 360px; touch targets at least 44px; keyboard path and visible
   focus; both locales.
4. Fix everything you found in one batch and render again. At most two rounds; then report the
   image folder to the owner.

Screenshots are only for judging the UI. Never use them to watch CI, a pipeline, or progress.
```

## Appendix B · `dock-style-archetypes`

| Id               | Base theme                        | Temperament                  | Color strategy                                                      | Type, density, radius                          | Suits                                  | Look reference                   |
| ---------------- | --------------------------------- | ---------------------------- | ------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- | -------------------------------- |
| `quiet-tool`     | `neutral`                         | calm, focused, efficient     | about 90% neutral; one accent for the primary action and focus only | system sans; compact; small radii              | editors, studios, productivity tools   | Linear, Figma                    |
| `warm-learning`  | `butter`                          | friendly, encouraging, light | warm surfaces, one blue accent; clear success and error states      | rounded sans; comfortable; medium radii        | learning and practice, habits          | Duolingo (restrained), Headspace |
| `calm-content`   | `matcha`                          | natural, steady, trustworthy | low-saturation green and neutrals; few accents                      | readable body type; generous spacing           | wellness, reading, content-first       | Calm, Notion                     |
| `crafted-record` | `stone`                           | plain, reliable, warm        | warm grey and slate; a low-saturation accent                        | sans; comfortable; medium radii                | records, archives, personal management | Things, Bear                     |
| `editorial`      | `gothic`                          | serious, memorable           | deep blue-grey; display serif headings                              | serif display with sans body; spacious         | reports, portfolios, long-form         | Medium, The Atlantic             |
| `warm-premium`   | `chocolate`                       | rich, refined                | brown palette; serif headings                                       | the theme's Fraunces and Albert Sans; spacious | lifestyle, premium content             | Aesop, Kinfolk                   |
| `playful`        | `y2k`                             | bubbly, young                | saturated pink and lime, used sparingly                             | the theme's Poppins; comfortable; large radii  | kids, entertainment, community         | —                                |
| `precise-data`   | `neutral` with a blue brand color | exact, credible              | neutrals plus a data-visualization palette                          | tabular figures; compact                       | dashboards, evaluation, admin          | Vercel, Stripe                   |

## Appendix C · Skeletons

### C1 · `DESIGN.md`

```markdown
---
status: draft # draft | approved
approvedBy: # the owner's name, set only on approval
approvedAt: # YYYY-MM-DD
archetype: # a row id from `astryx docs dock-style-archetypes`
theme:
  base: # an Astryx theme id
  brandColor: # for example oklch(0.62 0.12 160)
  modes: [light, dark]
---

# Design contract — <product name>

Shared rules: `pnpm exec astryx docs dock-design-base`. Product facts: `PRODUCT.md`. This file holds
only what is specific to this product.

## Overview

Personality (three adjectives), audience, primary surfaces.

## Colors

The brand color and where it is used; any status colors beyond the theme's.

## Typography

Theme fonts kept or changed; scale adjustments.

## Layout and navigation

Phone: navigation, first screen, where the primary action sits.
Desktop: navigation, content width.

## Pages

| Route | Archetype | Purpose |
| ----- | --------- | ------- |

## Do and don't

Rules specific to this product.

## Decisions

Dated entries: what was chosen, what else was shown, and the owner's words.
```

### C2 · `PRODUCT.md`

```markdown
# Product — <name>

## Who and where

Users, the surfaces they use (phone, desktop App, browser), and how often.

## Core tasks

The one or two tasks the product exists for, and what "done" looks like for the user.

## Brand personality

Three adjectives. Feels like: … Must not feel like: …

## Constraints

Accessibility, locales, regulatory or content limits.
```
