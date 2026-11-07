# Tasks — astryx-web-integration

> Read `design.md` first. Appendix A–C are exact text; implement them as written. The "Stop and
> report" list at the end of `design.md` overrides everything here.
> Branch from the latest `main`. Tick a box only after its check passes.

## 1. Package skeleton (D1)

- [x] 1.1 Read `pnpm exec astryx docs authoring/quick-start` and
      `pnpm exec astryx docs authoring/building-blocks/templates/build-the-template`, then create
      `packages/astryx-web` per D1 (name, version `0.0.0`, `publishConfig`, `files` whitelist,
      peers).
- [x] 1.2 Add the TypeScript 6 compiler as a devDependency of this package only. Check:
      `pnpm --filter @cogito.ai/astryx-web exec astryx integration check --strict` exits 0 on the
      empty integration.
- [x] 1.3 Add the package `check` script (`integration check --strict`, `integration verify`,
      `scripts/check-templates.mjs`, `scripts/golden-intents.mjs`) and run it in CI the same way the
      other packages' checks run.

## 2. Design base docs (Appendix A, D4)

- [x] 2.1 Add `dock-design-base` and the ten section docs with the ids in D4, wording from Appendix
      A.
- [x] 2.2 Check: `pnpm exec astryx docs dock-design-base` lists the ten docs;
      `pnpm exec astryx search "touch targets"` and `pnpm exec astryx search "refuse list"` return
      them.

## 3. Archetypes (Appendix B, D2–D3)

- [x] 3.1 `dock-landing` (B1)
- [x] 3.2 `dock-workbench` (B2)
- [x] 3.3 `dock-list` (B3, replaces `library`)
- [x] 3.4 `dock-form-flow` (B4, replaces `form-wizard`)
- [x] 3.5 `dock-settings` (B5, replaces `settings`)
- [x] 3.6 `dock-editor-frame` (B6, replaces `canvas-editor`)
- [x] 3.7 Check: `pnpm exec astryx template --list --package @cogito.ai/astryx-web` lists the six;
      the four Core templates show as replaced.

## 4. Checks (D7, D8)

- [x] 4.1 `scripts/check-templates.mjs` per D7 (static scan and fixture compile). Prove it bites: a
      temporary template with an icon-package import, a `style` attribute, `useMediaQuery`, a layout
      `<div>`, and English JSX text fails with one finding per violation; then delete it.
- [x] 4.2 `test/golden-intents.json` = Appendix C; `scripts/golden-intents.mjs` passes all 12 direct
      cases and all 5 rejected cases. Rejected cases assert Core `shell-top-nav` plus the expected
      archetype in the first three `@cogito.ai/astryx-web` entries of `data.pages`; print the
      Astryx version.

## 5. Agent guidance (D5)

- [x] 5.1 Add the five lines. Check: in the fixture, `pnpm exec astryx init --features agents`
      writes them under `@cogito.ai/astryx-web` in the `AGENTS.md` managed block, including the
      rule to put the page type last.

## 6. Sample renderer (D6)

- [x] 6.1 `bin/astryx-web.mjs samples` per D6, with a unit test for argument parsing and file
      naming. Check: without `CHROME_PATH` it exits non-zero and names the variable.

## 7. Owner visual gate (D9, blocking)

- [x] 7.1 Render all six archetypes (theme `neutral`; light and dark; 390×844 and 1440×900) into the
      D9 directory. Check them against Appendix A and fix everything in one batch, at most two
      rounds.
- [ ] 7.2 **Stop and wait for the owner.** Report the directory and its `index.json`. Continue only
      after approval, and quote the approval (date and words) in the PR description.

## 8. Docs

- [ ] 8.1 An `apps/docs` page in English and Chinese: what the integration contains, the six
      archetypes, and how a project uses them.

## 9. Close

- [ ] 9.1 `openspec validate astryx-web-integration --strict`, `pnpm check-types`, `pnpm lint`,
      and `pnpm format` all clean; add a `minor` changeset for `@cogito.ai/astryx-web`.

After the implementation PR merges (not a checkbox): publish from `main` per D10, then open a
closing PR that commits the release record (version → commit → sha512, render directory, owner
approval), tags `@cogito.ai/astryx-web@<version>`, and archives this change.
