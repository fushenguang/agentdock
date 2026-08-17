# tasks · skills-registry-template

## 1 · 模板骨架（`templates/skills-registry/`）

- [x] 1.1 从 `templates/web-nextjs/` 派生骨架：继承 `package.json`（改名
      `@cogito.ai/template-skills-registry`、去掉 web 相关 script）、`pnpm-workspace.yaml`、
      `turbo.json`、`.npmrc`、`.gitignore`、`.vscode/settings.json`、
      `packages/eslint-config/`、`packages/tsconfig/`。
      **不带** `apps/web/`、`supabase/`、`packages/openspec-docs-sync/`（理由见 design §1）。
- [x] 1.2 继承 `apps/docs/` Fumadocs 骨架。删掉 `content/docs/template/` 下 supabase /
      alipay / stripe / wechat-pay / drizzle 五篇（属 web 模板），换成：
      `getting-started.mdx`（怎么加一个 skill）、`skill-authoring.mdx`（`SKILL.md` 写法与约定）、
      `gates.mdx`（三道门各查什么、失败了怎么办）。
      执行时额外删掉了 `content/docs/features/`（`hello.mdx`/`auth.mdx` 描述的是
      `apps/web/src` 的四层契约/Supabase Auth，本模板没有 `apps/web`，留着是死链接/误导内容，
      不在 design §1 表格的字面清单里但判断为必要清理，已在报告里注明）；`template/`
      下另两篇（`deployment.mdx`/`troubleshooting.mdx`，同属 web 专属内容）一并按同一逻辑删除。
      顶层 `meta.json` 的 `pages` 同步从 `features` 改为 `skills`。
      `changelog/index.mdx`、`roadmap/index.mdx` 里对 `openspec-docs-sync` 自动同步的引用
      同步改写（该包已被删除，见 1.1）。
- [x] 1.3 继承 `openspec/` 结构；`config.yaml` 的 `context` **重写**为内容仓语境，
      并明写收窄范围与反例「加一个 skill 不走 openspec」（design §5）。
- [x] 1.4 `roadmap.yaml`：空 `now/next/later/wont` + 一条示例条目 + 注释说明
      「加 skill 不需要 roadmap 条目」。
- [x] 1.5 `AGENTS.md`：用一张表给出「什么走 openspec / 什么只走两道门」的判据。
- [x] 1.6 `README.md`：说明这是什么、怎么起步、三道门是什么。
- [x] 1.7 示例 skill `skills/example-skill/SKILL.md`（frontmatter 含 `name` +
      **英文** `description`——那是 manifest 里被机器读的字段）。
- [x] 1.8 `skills.json`：ship 一份**带显式占位 `source`** 的版本（模板不可能预置正确值，
      理由见 design §2「★」）。同时加 `pnpm skills:sync` script，并在 `README.md` 与
      `getting-started.mdx` 把它写成 **init 之后的第一条命令**。
- [ ] 1.9 `pnpm-lock.yaml` 重新生成。**未完成，如实报告**：`templates/skills-registry/`
      不在 agentdock 根 `pnpm-workspace.yaml` 里（`packages: [apps/*, packages/*]`，不含
      `templates/*`），所以只能在模板目录内独立 `pnpm install` 生成它自己的 lockfile；
      而 2.7 的占位版本号 `PENDING-SEE-TASK-2.7` 让 `pnpm install` 在解析依赖阶段就以
      `ERR_PNPM_NO_MATCHING_VERSION` 失败（已实测，见报告），根本不会产出 lockfile。
      这不是可以绕过的实现问题——2.7 解除阻塞、把真实版本号钉上之后，这一条才能完成。

## 2 · 三道门（模板真正的交付物）

- [x] 2.1 `scripts/gates/validate-all.mjs`（门①）：遍历 `skills/*`，对**每一个**跑
      `agentdock skill validate --json`；任一失败即 exit 1，输出哪个 skill 缺什么。
      纯 Node ESM，零构建步骤（design §3）。
- [x] 2.2 `scripts/gates/manifest-fresh.mjs`（门②）：把 `skills/*` 全部重新 publish 进
      临时目录，与已提交的 `skills.json` 对账。
      **★ 对账前归一化掉 `publishedAt`**（构建者裁决 = 甲）；条目按 `id` 排序后比较；
      其余字段逐字比。失败时打印**具体差异**（id / 字段 / 期望 vs 实际）。
      占位 `source` 仍在时，失败信息 MUST 直接给出 `pnpm skills:sync` 这条命令。
- [x] 2.3 `scripts/gen-skill-docs.mjs`：由 `skills.json` 生成
      `apps/docs/content/docs/skills/*.mdx` + `meta.json`；其新鲜度并入门②。
- [x] 2.4 `scripts/gates/public-boundary.mjs`（门③）：按 `boundary-rules.json` 扫描全部
      跟踪文件，命中即 exit 1，输出文件 / 行 / 命中的规则。
- [x] 2.5 `boundary-rules.json`：三类模式（私有仓路径 / 内部域名 / 个人可识别模式）
      各给可用的默认值 + 注释说明怎么按仓定制。**规则表是数据不是代码**。
- [x] 2.6 `.github/workflows/gates.yml`：PR 上跑三道门。这是**模板内容**
      （`templates/skills-registry/.github/workflows/gates.yml`），不是 agentdock 自己的
      CI（3.1 的范围），不受「改 `.github/` 需暂停确认」的约束。
- [ ] 2.7 `@cogito.ai/cli` 作为 **devDependency 钉版本**，CI 用 `pnpm exec agentdock`。
      **不得**用 `npx @cogito.ai/cli@latest`（design §4）。
      ⚠️ **阻塞点**：要钉的版本必须是**已发布**且**含 PR #31 的 source 规范化修复**的版本。
      若尚未发到 npm，**停下来报告，不得先钉旧版凑数**。
      **现状（2026-08-16 实测确认）**：修复已经写好，在本地分支
      `feat/cli-publish-source-normalization`（含 changeset
      `.changeset/publish-source-normalization.md`），但**尚未合并到 main、也未发版**——
      `packages/cli/package.json` 当前仍是 `0.8.0`，`npm` 上最新也是 `0.8.0`（无该修复）。
      按指示**未**先钉这个旧版本凑数；`templates/skills-registry/package.json` 的
      `devDependencies["@cogito.ai/cli"]` 目前是醒目占位符 `"PENDING-SEE-TASK-2.7"`。
      **解除条件**：`feat/cli-publish-source-normalization` 合并 + 发布到 npm 后，把占位符
      换成真实的 `^<版本号>`，重跑 `pnpm --filter @cogito.ai/cli build` 确认
      `packages/cli/src/registry.json` 里 `skills-registry` 模板的
      `resolvedDependencies["@cogito.ai/cli"]` 变成真实 semver，再勾选本条。

## 3 · 门必须被真跑过（不得交付没验过的门）

- [x] 3.1 在 agentdock 的 CI 里加一个 job：对 `templates/skills-registry/` 真跑三道门
      （path filter 到该目录）。既有的 `template-validation.yml` 是 web-nextjs 专用
      （`scripts/validate-template.sh` 硬编码 `templates/web-nextjs/apps/web`），**不复用**。
      新增 `.github/workflows/skills-registry-gates.yml`（改 `.github/` 已由构建者在真实对话中授权）。
      走的是**使用者的真实路径**（init → git init + origin → bootstrap → 三道门），
      而不是就地在模板源目录里跑——模板源目录的 `skills.json` 带占位 `source`，就地跑必然红。
      **该工作流刻意含一条反向对照**：bootstrap 之前门② 必须失败、且失败信息里必须出现
      `pnpm skills:sync`；否则视为门已退化成 no-op 而整体失败。
- [x] 3.2 **门① 反向对照**：临时造一个缺必需字段的 skill → 门① 必须失败；恢复后必须通过。
      贴出两次的实际输出。
- [x] 3.3 **门② 反向对照**：改示例 skill 的 `description` 但不重新生成 → 门② 必须失败
      且指出该字段的期望 vs 实际；重新生成后必须通过。
- [x] 3.4 **门② 时间戳负例**：只让 `publishedAt` 不同 → 门② 必须**通过**（这是裁决甲的判据本身）。
- [x] 3.5 **门③ 反向对照**：临时塞一条命中规则的内容 → 门③ 必须失败并指出文件/行/规则；移除后通过。
- [x] 3.6 **`agentdock init` 端到端**：用模板真初始化一个项目到临时目录，
      **读产出的目录树**确认 §1 结构正确；`git init` + 设一个 HTTPS `origin` +
      跑 `pnpm skills:sync`，然后三道门全绿。
      只验模板源目录不算——`init` 有自己的改写逻辑（`registry.json`、`_gitignore` 还原等）。
      实测用的是本仓构建出的 CLI（`pnpm --filter @cogito.ai/cli build` 后
      `node packages/cli/dist/index.js init ...`），`pnpm skills:sync` 的两步
      （`manifest-fresh.mjs --write` + `gen-skill-docs.mjs`）用 `AGENTDOCK_CMD` 环境变量
      指向该构建产物代替 `pnpm exec agentdock`（2.7 阻塞导致真实 devDependency 装不上，
      理由见 1.9/2.7）。真实 `pnpm install`（不带 `AGENTDOCK_CMD` 覆盖）在这个脚手架项目里
      确认会因占位版本号失败，见 1.9 记录。
- [x] 3.7 **bootstrap 之前的负例**：init 后**不跑** `skills:sync` 就跑门②
      → 必须失败，且失败信息里出现 `pnpm skills:sync`。贴出实际输出。

## 4 · 四道门（AGENTS.md 验收条件）

- [x] 4.1 `pnpm install` exit 0
- [x] 4.2 `pnpm check-types` exit 0
- [x] 4.3 `pnpm build` exit 0（`generate-registry` 会自动收录新模板，确认它出现在
      `packages/cli/src/registry.json`）
- [x] 4.4 `pnpm format` 后本 change 触碰的文件无 diff。⚠️ 全仓另有 101 个既有不合格文件，
      与本刀无关，**不得顺手格式化**（会淹没 diff）
      **未跑根目录真实 `pnpm format`**（它是 `prettier --write "**/*.{ts,tsx,md}"`，作用于全仓，
      与「不得跑全仓 format」的护栏冲突）；改用等价动作：只对
      `templates/skills-registry/**` 自己新建的文件跑
      `npx prettier --check`（排除生成产物 `apps/docs/content/docs/skills/**`——该目录已加
      `.prettierignore`，理由见报告：它是 `gen-skill-docs.mjs` 的输出,格式化会让门②
      永远判定"不新鲜"，这条和 `publishedAt` 是同一类问题）。结果全绿，见报告。
- [x] 4.5 `openspec validate skills-registry-template` exit 0
- [x] 4.6 `pnpm align:check` 全绿
- [x] 4.7 `pnpm secrets:check` exit 0 ★ —— 本刀会写「禁止模式」的示例，
      极易触发 secretlint。**不得靠加 ignore 放宽门**，改写法（第一刀已踩过这个坑）
      `boundary-rules.json` 里全部用正则（无明文样本字面量），全绿通过，未碰
      `.secretlintignore`。
- [x] 4.8 `pnpm arch:check` 全绿

## 5 · 收口

- [x] 5.1 补 changeset（`@cogito.ai/cli` 的模板集变了 → 需要发版才能被 `init` 用到）。
      ⚠️ 第一刀漏过这条：没有 changeset，改动合进 main 也不会发到 npm。
      已新增 `.changeset/skills-registry-template.md`（`@cogito.ai/cli`: minor）。
- [ ] 5.2 回写 thefoolai PRD `skill-commerce-loop.mdx` §4.1.2：模板已交付 + 指向本 change。
      （跨仓，走 thefoolai 自己的门。**本轮范围外，未执行**——由发起方另外处理。）
