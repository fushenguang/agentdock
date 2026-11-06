# Design — web-tanstackstart-page-from-template

Facts come from spike Q1 (thefoolai `.materials/dp-web-design/2026-11-06-direction-research.md`
§5; prototype scripts were in that session's scratchpad). Paths below are inside
`templates/web-tanstackstart/` unless they say otherwise.

## D1 · Dependency and the Astryx agent block

- Add `@cogito.ai/astryx-web` (`^0.1.0`, published by change `astryx-web-integration`) to
  `devDependencies`. The integration only provides templates, docs, guidance, and a dev tool;
  nothing is imported at runtime.
- Run `pnpm exec astryx init --features agents` in the template and commit the managed block it
  appends to `AGENTS.md` (and the `GEMINI.md` it creates). The block is fixed Astryx text (about 35
  lines: "start every page from a template", "no `<div>`", "no raw hex/px", …) followed by our
  package's lines.
- Reconcile: read the block and the rest of `AGENTS.md` side by side; delete our own sentences that
  only repeat the block; where they conflict, keep ours and make the conflict explicit in one
  sentence above the block. Do not edit inside the markers; `init` rewrites them.

## D2 · `pnpm page:new`

`tools/page-new.mjs` (Node, no new dependency), script `"page:new": "node tools/page-new.mjs"`.

```
pnpm page:new "<page intent>" --route <path> [--template <id>] [--allow-core]
```

1. **Pick the template.** With `--template`, use it. Otherwise run
   `astryx build "<intent>" --json` and read `data.start` (`name`, `package`, `basis`). Never use
   `data.pages[0]`. Reject and print the top three `@cogito.ai/astryx-web` entries from
   `data.pages` when:
   - `basis` is `fallback`;
   - the template is not ready (`isReady: false`);
   - `start.package` is not `@cogito.ai/astryx-web` and `--allow-core` is absent.
2. **Target file.** `--route settings` → `src/routes/$locale/settings.tsx`;
   `--route documents/$documentId` → `src/routes/$locale/documents/$documentId.tsx`. Refuse when
   the file exists.
3. **Scaffold.** `astryx template <name> <file> --package <package> --json`, invoked with
   `execFile` and an argument array (paths contain `$`). On `ERR_FILE_EXISTS` or
   `ERR_UNKNOWN_TEMPLATE` (exit 1), print the error and stop.
4. **Turn it into a route.**
   - line 1: `// astryx-template: <name> | package: <package> | intent: "<intent>" | astryx: <cli version>`
     (version from `meta.answeredBy.cli` of the build output, or `astryx --version`);
   - `export default function X(` → `function X(` (handle `export default X;` too; if neither is
     found, stop);
   - add `import { createFileRoute } from "@tanstack/react-router";`;
   - append `export const Route = createFileRoute("/$locale/<route>")({ component: X });`. The
     path string does not have to be exact: `tsr generate` rewrites it.
5. **Strings.** Page id = the route without the locale segment, `$` removed, `/` → `.`
   (`settings`, `documents.documentId`). Replace `__PAGE__` with it. Move the `astryx-messages`
   block to `src/i18n/pages/<page id with . → __>.ts` exporting `{ en, "zh-CN" }` as `Catalog`s,
   register the file in `src/i18n/pages/index.ts`, and delete the block from the page.
   `src/i18n/messages.ts` merges `src/i18n/pages/index.ts` into `enCatalog` and `zhCNCatalog` (a
   one-time change in this change). The existing parity test keeps both locales aligned.
6. **Format and generate.** `oxfmt --write` on every file touched, then `pnpm generate-routes`.
7. **Report.** Print the file, the template, `missingPackages` (expected empty; never install
   anything), and the next steps: replace `SAMPLE_*` data, adapt inside the template's sections,
   write real copy in both locales, run `pnpm check`.

## D3 · Provenance check

`tools/check-pages.mjs`, run after `tsr generate`:

- Enumerate `src/routes/**/*.{ts,tsx}`, skipping names that start with `-` (the router ignores
  them).
- Cross-check with the imports in `src/routeTree.gen.ts`. A file that is enumerated but not in the
  tree fails: it has no `Route` export and would silently 404.
- Exempt automatically: `__root.tsx`, layout files that render `<Outlet`, and routes without a
  `component` (redirects, server handlers).
- Every other file needs, on line 1, either the D2 marker naming a template that exists in
  `astryx template --list --json`, or `// astryx-exempt: <reason>` with a reason of at least ten
  characters.
- Scripts: `"check:pages": "pnpm generate-routes && node tools/check-pages.mjs"`; `check` runs it;
  `build` becomes `pnpm generate-routes && node tools/check-pages.mjs && vite build`, so a page
  without provenance cannot be built.

A hand-written marker can fool the check. Accept that: the marker plus code review is the
contract; hashing template sources is not worth it now.

## D4 · Lint rules

Extend `tools/oxlint-agentdock.mjs` (it already has three `agentdock-arch/*` rules) with:

- `agentdock-ui/no-inline-style`: a JSX `style` attribute (any value, not only `style={{`) and any
  use of the `CSSProperties` type. `xstyle` is fine.
- `agentdock-ui/no-color-literal`: string literals matching hex, `rgb(`, `hsl(`, or `oklch(`.
- `agentdock-ui/no-viewport-media-query`: calls to `useMediaQuery` or `matchMedia`.

Scope: `src/routes/**` and `src/components/**`, excluding tests and the appearance/theme files.
Severity: error. If an oxlint JS plugin cannot express a rule, implement that rule in
`tools/check-pages.mjs` instead; if neither works, stop and report.

## D5 · Sample pages

Recreate the three sample pages with the entry, then port their behaviour:

| Route              | Command                                                                    | Port                                                                                  |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `$locale/index`    | `pnpm page:new "landing page with module entries" --route index`           | the module entries the current landing shows                                          |
| `$locale/settings` | `pnpm page:new "settings page with sections" --route settings`             | appearance (theme, color mode) and language rows, reusing `src/components/settings/*` |
| `$locale/hello`    | `pnpm page:new "workbench page with a top bar and sections" --route hello` | the current sample workbench content                                                  |

Move each old route file out of the way before running the entry. The old components become
unused; delete them (listed here for owner approval, AgentDock `.claude/CLAUDE.md`):
`src/components/OverviewLanding.tsx`, `src/components/HelloWorkspace.tsx`. Keep
`src/components/settings/*` and `src/components/layout/*`.

## D6 · Agent docs

- `AGENTS.md` UI Rules: add "Create every page with `pnpm page:new`; never lay a page out from
  scratch; change an existing page inside its sections" and "`build` fails on a route without
  provenance".
- `LLM.md` §9 Add A Route: rewrite around `page:new` (keep the first-level / second-level
  guidance). §10 UI Development: list the archetypes and `astryx docs dock-design-base`.
- `.github/copilot-instructions.md`: the same one-line rule.
- `templates/domain-packages/.agent/skills/add-web-route/SKILL.md`: declare the route in
  `agent/web-surface.json` → `pnpm --filter <web package> page:new "<intent>" --route <path>` →
  adapt inside the sections → package and Web checks. Remove "Preserve a left-agent /
  right-workbench interaction model" (obsolete since the package Web became the main surface).

The environment premise in these files ("right-hand panel, ~380px") is rewritten by change
`web-tanstackstart-design-direction`; leave it alone here to keep the two diffs apart.

## D7 · Release

A changeset for `@cogito.ai/cli` (the template ships inside it). Publish from `main` after merge
and record version → commit → sha512 with a tag, as the CLI is released today.

## Stop and report

- `astryx build` or `astryx template` behaves differently from D2 (for example `--package` is
  ignored).
- A sample page cannot keep its current behaviour on its archetype.
- A lint rule cannot be implemented either in oxlint or in the check script.
- The `astryx init` block contradicts a template rule in a way one sentence cannot settle.
