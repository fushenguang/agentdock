# Tasks: add-domain-packages-template

## 1. Template

- [x] 1.1 Add an empty standalone `domain-packages` template.
- [x] 1.2 Add package-spec, standards-lock, and workspace-catalog schemas.
- [x] 1.3 Add the agent practice pack and six golden-path skills.
- [x] 1.4 Add workspace check and generic package build staging tools.
- [x] 1.5 Ignore generated package Web output and generated seed databases.
- [x] 1.6 Pre-approve the `web-tanstackstart` workspace-member build scripts required by the first
      generated package.

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
- [x] 4.5 Complete the normal 0.27.0 release gate.

## 5. Post-0.27.1 onboarding and layout iteration

- [x] 5.1 Add the root `openspec/`, `apps/docs/`, and `apps/web/` reservation layout without adding
      a business package.
- [x] 5.2 Add human-interactive and friendly-error handling to `create-package`, preserving `--spec`
      as the non-interactive contract.
- [x] 5.3 Move generated package roots and build staging to `apps/<id>/` and generate package Web at
      `apps/web/` through standard workspace mode.
- [x] 5.4 Extend `agentdock init` so human mode creates the first package immediately and
      agent/JSON mode accepts explicit package arguments or a spec.
- [x] 5.5 Update workspace checks, tests, registry metadata, agent guidance, README, and bilingual
      documentation for the new layout and onboarding flow.
- [x] 5.6 Add a release changeset for the CLI/template iteration without publishing or choosing the
      release version.
- [x] 5.7 Run template tests, CLI tests, workspace-mode checks, type/build/lint/docs/OpenSpec gates,
      and real init/install/check/build smoke tests.

## 6. Post-0.28.0 build artifact hardening

- [x] 6.1 Make generated `pnpm check` include the fixed `web` member checks after package creation.
- [x] 6.2 Make package `start:web` launch the fixed `apps/web` workspace member without falsely
      advertising a standalone public hosted runtime.
- [x] 6.3 Strip known build-machine paths from packaged text and fail closed on other absolute
      build-path leaks.
- [x] 6.4 Add template tests for launchable staging, metadata, path sanitization, and generated root
      checks.
- [ ] 6.5 Add a patch changeset and run the normal verification/release gate without manually
      selecting a version.

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
- 0.27.0 was published, followed by the 0.27.1 allowBuilds patch release.
- Post-0.27.1 iteration: `node --test templates/domain-packages/test/*.test.mjs` — 7/7 passed.
- Post-0.27.1 iteration: `pnpm --filter @cogito.ai/cli test` — 10 files / 192 tests passed, including explicit-field init, spec init, empty agent init, missing-spec failure, and fixed `apps/web` workspace placement.
- Post-0.27.1 iteration: `pnpm install`, `pnpm check-types`, `pnpm build`, and `pnpm lint` passed. Lint retained only the existing generated `web-nextjs` warning.
- Post-0.27.1 docs gates: `pnpm --filter docs lint`, `pnpm --filter docs check-types`, `pnpm docs:check-template-parity`, and the docs build inside `pnpm build` passed.
- Prettier was run with `pnpm format`; its current repo-wide glob also reformats 142 pre-existing unrelated files, so those unrelated edits were restored. A Prettier check over every file edited by this change passed.
- Real built-CLI agent smoke with package fields succeeded and generated `apps/smoke-domain/` plus `apps/web/`; real `pnpm install`, `pnpm check`, `pnpm check:smoke-domain`, and `pnpm build:smoke-domain-package` passed. `allowBuilds` produced no required root changes and `apps/smoke-domain/web/` was ignored.
- Real PTY smoke passed for interactive `agentdock init` package onboarding and for `pnpm create:package` without a spec; both generated `apps/<id>/` and `apps/web/`, and no temporary `package-spec.json` was created.
- Built `packages/cli/dist/templates/domain-packages/` contains root OpenSpec, `apps/docs/`, the `apps/web/.gitkeep` reservation, and the updated generator; built registry metadata exposes domain-package onboarding.
- Post-0.28.0 audit: a real 0.28.0 workspace passed install, structural check, dev server, package Web checks, and package staging build, but package `start:web` failed because `apps/<id>/web/server.mjs` was absent; packaged TanStack manifests also retained build-machine absolute paths.
- Post-0.28.0 hardening: template tests now cover generated root-check composition, package `start:web`, staging sanitization, and metadata behavior (7/7 passed).
- Post-0.28.0 hardening: a real local-CLI workspace passed install, full root check, package build, absolute-path scan, production startup, and `/en` plus `/zh-CN` HTTP probes.
