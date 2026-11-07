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
2. Build each candidate as a theme (`pnpm exec astryx docs author-a-theme`). An ejected theme's
   local icon file may import packages the app does not have; use the base theme package's exported
   icon registry instead of adding a dependency. Render the landing page with each candidate, light
   and dark, phone and desktop, into `<dir>/round2/<candidate>`.
3. Send the candidates with their contrast ratios for body text. **Stop and wait.**

## 4 · Record

1. Keep the chosen brand theme as the project's default theme; add its built module and CSS to
   `AppearanceProvider`'s theme options, update its explicit theme-list test, and remove the other
   candidates.
2. Fill `DESIGN.md`: front matter, then Overview, Colors, Typography, Layout and navigation, Pages
   (planned routes with their archetypes), Do and don't.
3. Add a dated entry to `## Decisions`: what was chosen, what else was shown, and the owner's words.
4. Set `status: approved`, `approvedBy`, and `approvedAt` only now. Run `pnpm check`.
