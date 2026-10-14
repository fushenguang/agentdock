# Tasks: add-domain-packages-template

## 1. Template

- [x] 1.1 Add an empty standalone `domain-packages` template.
- [x] 1.2 Add package-spec, standards-lock, and workspace-catalog schemas.
- [x] 1.3 Add the agent practice pack and six golden-path skills.
- [x] 1.4 Add workspace check and generic package build staging tools.
- [x] 1.5 Ignore generated package Web output and generated seed databases.

## 2. Package generator

- [x] 2.1 Add non-interactive `pnpm create:package --spec package-spec.json`.
- [x] 2.2 Generate package declarations, roadmap, system prompt, and package-local agent context.
- [x] 2.3 Generate package Agent Surface, Web Surface, and capability catalog.
- [x] 2.4 Default formal packages to Web and require an approved no-Web exception.
- [x] 2.5 Create Web source through the pinned AgentDock CLI and `web-tanstackstart`.
- [x] 2.6 Generate root package-specific dev/check/build commands.
- [x] 2.7 Add template tests for empty initialization, valid creation, no-Web failure, and duplicate failure.

## 3. CLI registry and docs

- [x] 3.1 Register the template and expose its standalone metadata.
- [x] 3.2 Add CLI registry and scaffold tests.
- [x] 3.3 Add bilingual template documentation and template index entries.
- [x] 3.4 Add an AgentDock CLI minor changeset for 0.27.0.

## 4. Verification and release boundary

- [x] 4.1 Run template checks and tests.
- [x] 4.2 Run CLI tests, type check, lint, format check, and build.
- [x] 4.3 Run docs checks and OpenSpec validation.
- [x] 4.4 Verify the built CLI package contains the template after the CLI build.
- [ ] 4.5 Complete the normal 0.27.0 release gate.

## Verification log

- `node --test templates/domain-packages/test/*.test.mjs` — 4/4 passed.
- `node templates/domain-packages/tools/check-workspace.mjs --repo-root templates/domain-packages` — passed for the empty workspace.
- Local built-CLI smoke: `node packages/cli/dist/index.js init ... --template domain-packages` — succeeded and generated an empty conforming workspace.
- `pnpm --filter @cogito.ai/cli test` — 9 files / 187 tests passed.
- `pnpm check-types` — passed for all workspace packages.
- `pnpm build` — passed for all workspace packages.
- `pnpm lint` — passed with one existing warning in generated `packages/cli/dist/templates/web-nextjs/.../server.ts`.
- `pnpm --filter docs lint`, `check-types`, and `build` — passed.
- `pnpm exec openspec validate add-domain-packages-template` — valid.
- `pnpm changeset:check`, `pnpm arch:check`, and `pnpm secrets:check` — passed (`arch:check` reported two existing template warnings).
- Prettier check passed for all new/edited files except intentionally unformatted `roadmap.yaml`, which follows its existing hand-authored style.
- Built `packages/cli/dist/templates/domain-packages/` contains the template and `_gitignore`; built registry exposes `domain-packages`.
