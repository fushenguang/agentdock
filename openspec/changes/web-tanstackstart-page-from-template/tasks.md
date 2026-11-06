# Tasks — web-tanstackstart-page-from-template

> Read `design.md` first; its "Stop and report" list overrides everything here. Start only after
> `@cogito.ai/astryx-web` 0.1.0 is published (change `astryx-web-integration`). Branch from the
> latest `main`. Tick a box only after its check passes.

## 1. Dependency and agent block (D1)

- [ ] 1.1 Add `@cogito.ai/astryx-web@^0.1.0` to the template's `devDependencies`; install.
- [ ] 1.2 Run `pnpm exec astryx init --features agents` in the template; commit the managed block and
      `GEMINI.md`; reconcile `AGENTS.md` per D1.

## 2. Entry (D2)

- [ ] 2.1 `tools/page-new.mjs` and the `page:new` script, steps 1–7 of D2.
- [ ] 2.2 `src/i18n/pages/index.ts` and the merge in `src/i18n/messages.ts`; the parity test still
      passes.
- [ ] 2.3 Tests (vitest, real temp directories, `astryx` calls mocked at the process boundary):
      rejects `basis: fallback`; rejects a Core start without `--allow-core`; refuses an existing
      file; writes the marker on line 1; removes `export default`; appends `Route`; moves the
      messages block into a page catalog.

## 3. Provenance check (D3)

- [ ] 3.1 `tools/check-pages.mjs` and the `check:pages` script; `check` and `build` run it.
- [ ] 3.2 Prove it bites, then revert: an unmarked page fails `pnpm build`; a raw template without a
      `Route` export fails; `// astryx-exempt: <reason>` with a 10+ character reason passes.

## 4. Lint rules (D4)

- [ ] 4.1 The three `agentdock-ui/*` rules; prove each fails on a temporary violating file, then
      delete it.

## 5. Sample pages (D5)

- [ ] 5.1 Recreate `index`, `settings`, and `hello` with the D5 commands and port their behaviour.
- [ ] 5.2 Delete `src/components/OverviewLanding.tsx` and `src/components/HelloWorkspace.tsx`.
- [ ] 5.3 `pnpm check` passes in the template; render the three pages at 390×844 and 1440×900 with
      `astryx-web samples` and confirm the settings rows still switch theme, mode, and language.

## 6. Agent docs (D6)

- [ ] 6.1 `AGENTS.md`, `LLM.md` §9–10, `.github/copilot-instructions.md`.
- [ ] 6.2 `templates/domain-packages/.agent/skills/add-web-route/SKILL.md`.

## 7. Close

- [ ] 7.1 Scaffold a fresh project with the local CLI build (`agentdock init`, template
      `web-tanstackstart`) into a temp directory; `pnpm install` and `pnpm check` pass there, and
      `pnpm page:new "list page for documents with search and recent items" --route documents`
      creates a route that builds.
- [ ] 7.2 `openspec validate web-tanstackstart-page-from-template --strict`, `pnpm check-types`,
      `pnpm lint`, `pnpm format` clean; add a changeset for `@cogito.ai/cli`.

After the PR merges (not a checkbox): publish the CLI from `main` per D7, then open a closing PR
that records the release and archives this change.
