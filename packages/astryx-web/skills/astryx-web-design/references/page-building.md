# Building a page

1. Name the page by type and purpose: "<type> page for <purpose>" (types: landing, workbench,
   list, form, settings, editor). Put the page type last: write `mobile settings page`, not
   `settings page on mobile`. Run `pnpm page:new "<intent>" --route <path>`. If it rejects the
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
