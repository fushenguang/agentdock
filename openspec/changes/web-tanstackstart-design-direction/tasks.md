# Tasks — web-tanstackstart-design-direction

> Read `design.md` first; its "Stop and report" list overrides everything here. Start only after
> change `web-tanstackstart-page-from-template` is merged and the CLI is published. Branch from the
> latest `main`. Tick a box only after its check passes.

## 1. Finished changes (D7)

- [ ] 1.1 Confirm the owner approved archiving `web-tanstackstart-ui-contract-adoption` and
      `remove-web-tanstackstart-page-frame` (answer in the planning PR); if not, stop.
- [ ] 1.2 Archive both; add the `MODIFIED` delta for "Embedded App panel environment" to this
      change's specs.

## 2. Skill (D1, Appendix A)

- [ ] 2.1 `packages/astryx-web/skills/astryx-web-design/` with the four files of Appendix A. The
      page-building reference tells agents to put the page type last (`mobile settings page`, not
      `settings page on mobile`).
- [ ] 2.2 Vendored copies and `.claude/skills` symlinks in both templates.
- [ ] 2.3 `tools/check-skill.mjs` in `check`, and the `design:sync-skill` script. Prove it bites:
      editing one line of the vendored `SKILL.md` fails `pnpm check`; `pnpm design:sync-skill`
      fixes it.

## 3. Style archetypes (D2)

- [ ] 3.1 Doc `dock-style-archetypes` = Appendix B. Check: `pnpm exec astryx docs dock-style-archetypes`
      prints the table.

## 4. Contract and gate (D3, D4, Appendix C)

- [ ] 4.1 Replace `DESIGN.md` with C1; add `PRODUCT.md` from C2; update the read-first lists.
- [ ] 4.2 `page:new` refuses while not approved (exact message in D4).
- [ ] 4.3 `tools/check-design.mjs` and `tools/sample-pages.json`; `check` runs it. Prove it bites:
      a fourth page fails `pnpm check` while `draft`; an `approved` contract missing `approvedBy`
      fails; a complete approved contract passes.

## 5. Samples (D5)

- [ ] 5.1 `design:samples` script and the `.gitignore` entry. Check: renders the three sample pages
      under two themes into a temp folder.

## 6. Cleanup (D7)

- [ ] 6.1 Remove `impeccable` (files listed in D7).
- [ ] 6.2 Rewrite the environment premise in `AGENTS.md`, `LLM.md` §10, and
      `.github/copilot-instructions.md`; document where skills live.
- [ ] 6.3 `domain-packages` template: `.agent/skills` → `.agents/skills`, `.claude/skills` symlinks,
      references updated. Check: `grep -rn "\.agent/skills" templates packages/cli` returns nothing.
- [ ] 6.4 Package repository docs PR for `embedded-package-web-ux.mdx` (superseded note), merged with
      a merge commit; link it in this PR.

## 7. Dry run (D6, Appendix A)

- [ ] 7.1 In a temp project from the local CLI build, follow `references/design-direction.md` with a
      stand-in owner (you answer the questions; mark the run as a dry run): round 1 renders,
      round 2 builds two palette themes and renders them, recording makes `pnpm check` pass with
      `status: approved`. Fix the skill text wherever a step did not work as written, then delete
      the temp project.
- [ ] 7.2 In the same kind of temp project, `pnpm page:new` refuses while `draft` and works after
      approval.

## 8. Close

- [ ] 8.1 `openspec validate web-tanstackstart-design-direction --strict`, `pnpm check-types`,
      `pnpm lint`, and `pnpm format` all clean; changesets for `@cogito.ai/astryx-web` and
      `@cogito.ai/cli`.

After the PR merges (not a checkbox): publish both packages from `main` per D8, then open a closing
PR that records the releases and archives this change.
