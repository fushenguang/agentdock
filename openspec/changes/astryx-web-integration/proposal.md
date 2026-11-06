---
roadmap-id: web-design-system
---

# astryx-web-integration — Ship mobile-first page archetypes and the design base as an Astryx integration

## Why

Projects generated from `web-tanstackstart` are mostly written by AI coding agents, including weak
models (Codex + deepseek-flash). Left alone, they lay pages out from scratch and stack components
without a plan; the owner judged the first such Web (TheFoolAI `lean-flowkit`) unusable. An audit
and three spikes on 2026-11-06 (thefoolai PRD `dp-web-design-system` §1, W1–W11) found:

- In 13 agent sessions that built `lean-flowkit`, `astryx build` ran 0 times; every page was
  assembled from component APIs.
- Astryx's own page templates cannot be used as-is in this template. Each one brings its own shell
  (`AppShell`, a local `Theme` with its own appearance state), viewport media queries, icon packages
  the template does not have (`@heroicons/react`, `lucide-react`), and 30–170 hard-coded English
  strings. A weak model has to rewrite most of the page, which is how pages end up arbitrary.
- Astryx 0.7.5 has no mobile-first page template. Intents such as "step-by-step practice session on
  mobile" fall back to `shell-top-nav`. Mobile is a primary surface for these Webs.

Astryx integrations can add page templates, replace built-in ones, ship searchable docs, and append
agent guidance to `AGENTS.md`. A spike on 0.7.5 confirmed all four work from a local package.

## What Changes

- New workspace package `packages/astryx-web`, published as `@cogito.ai/astryx-web`, an Astryx
  integration that contains:
  - six page archetypes written to this template's conventions (mobile-first, `PageShell` and
    `TemplateShell`, i18n keys, Astryx tokens, no packages beyond the template's own):
    `dock-landing`, `dock-workbench`, `dock-list`, `dock-form-flow`, `dock-settings`,
    `dock-editor-frame`. Four of them replace the Core template of the same intent (`library`,
    `form-wizard`, `settings`, `canvas-editor`), so a Core version with foreign dependencies is
    never the default;
  - the design base as Astryx docs: product stance, environment (phone, desktop App, standalone
    browser), layout, touch and mobile, components, copy, states, accessibility, a refuse list, and
    visual acceptance;
  - at most eight lines of agent guidance for `astryx init`;
  - a sample renderer (`astryx-web samples`) that renders routes under chosen themes, color modes,
    and widths with the system Chrome;
  - its own template-source checks (Astryx does not check template source) and a golden
    "intent → start template" suite.
- An owner visual gate: before the first publish, every archetype is rendered at 390×844 and
  1440×900, light and dark, and the owner approves the renders.

## Non-goals

- Wiring the package into `web-tanstackstart`, the `page:new` entry, and provenance checks (change
  `web-tanstackstart-page-from-template`).
- The design-direction skill, the `DESIGN.md` contract, and the design gate (change
  `web-tanstackstart-design-direction`).
- Moving `TemplateShell`, `PageShell`, and the other layout primitives into the package as
  components. Deferred until a shell change has to reach projects that already exist.
- Detail-page and mobile task-flow (practice session) archetypes. Deferred until a project needs
  them.
- Custom themes. Projects use Astryx built-in themes plus a brand palette generated per project.
- The `web-tanstackstart-kids` template.
