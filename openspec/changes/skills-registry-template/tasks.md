# tasks · skills-registry-template

## 1 · 模板骨架（`templates/skills-registry/`）

- [ ] 1.1 从 `templates/web-nextjs/` 派生骨架：继承 `package.json`（改名
      `@cogito.ai/template-skills-registry`、去掉 web 相关 script）、`pnpm-workspace.yaml`、
      `turbo.json`、`.npmrc`、`.gitignore`、`.vscode/settings.json`、
      `packages/eslint-config/`、`packages/tsconfig/`。
      **不带** `apps/web/`、`supabase/`、`packages/openspec-docs-sync/`（理由见 design §1）。
- [ ] 1.2 继承 `apps/docs/` Fumadocs 骨架。删掉 `content/docs/template/` 下 supabase /
      alipay / stripe / wechat-pay / drizzle 五篇（属 web 模板），换成：
      `getting-started.mdx`（怎么加一个 skill）、`skill-authoring.mdx`（`SKILL.md` 写法与约定）、
      `gates.mdx`（三道门各查什么、失败了怎么办）。
- [ ] 1.3 继承 `openspec/` 结构；`config.yaml` 的 `context` **重写**为内容仓语境，
      并明写收窄范围与反例「加一个 skill 不走 openspec」（design §5）。
- [ ] 1.4 `roadmap.yaml`：空 `now/next/later/wont` + 一条示例条目 + 注释说明
      「加 skill 不需要 roadmap 条目」。
- [ ] 1.5 `AGENTS.md`：用一张表给出「什么走 openspec / 什么只走两道门」的判据。
- [ ] 1.6 `README.md`：说明这是什么、怎么起步、三道门是什么。
- [ ] 1.7 示例 skill `skills/example-skill/SKILL.md`（frontmatter 含 `name` +
      **英文** `description`——那是 manifest 里被机器读的字段）。
- [ ] 1.8 `skills.json`：ship 一份**带显式占位 `source`** 的版本（模板不可能预置正确值，
      理由见 design §2「★」）。同时加 `pnpm skills:sync` script，并在 `README.md` 与
      `getting-started.mdx` 把它写成 **init 之后的第一条命令**。
- [ ] 1.9 `pnpm-lock.yaml` 重新生成。

## 2 · 三道门（模板真正的交付物）

- [ ] 2.1 `scripts/gates/validate-all.mjs`（门①）：遍历 `skills/*`，对**每一个**跑
      `agentdock skill validate --json`；任一失败即 exit 1，输出哪个 skill 缺什么。
      纯 Node ESM，零构建步骤（design §3）。
- [ ] 2.2 `scripts/gates/manifest-fresh.mjs`（门②）：把 `skills/*` 全部重新 publish 进
      临时目录，与已提交的 `skills.json` 对账。
      **★ 对账前归一化掉 `publishedAt`**（构建者裁决 = 甲）；条目按 `id` 排序后比较；
      其余字段逐字比。失败时打印**具体差异**（id / 字段 / 期望 vs 实际）。
      占位 `source` 仍在时，失败信息 MUST 直接给出 `pnpm skills:sync` 这条命令。
- [ ] 2.3 `scripts/gen-skill-docs.mjs`：由 `skills.json` 生成
      `apps/docs/content/docs/skills/*.mdx` + `meta.json`；其新鲜度并入门②。
- [ ] 2.4 `scripts/gates/public-boundary.mjs`（门③）：按 `boundary-rules.json` 扫描全部
      跟踪文件，命中即 exit 1，输出文件 / 行 / 命中的规则。
- [ ] 2.5 `boundary-rules.json`：三类模式（私有仓路径 / 内部域名 / 个人可识别模式）
      各给可用的默认值 + 注释说明怎么按仓定制。**规则表是数据不是代码**。
- [ ] 2.6 `.github/workflows/gates.yml`：PR 上跑三道门。
- [ ] 2.7 `@cogito.ai/cli` 作为 **devDependency 钉版本**，CI 用 `pnpm exec agentdock`。
      **不得**用 `npx @cogito.ai/cli@latest`（design §4）。
      ⚠️ **阻塞点**：要钉的版本必须是**已发布**且**含 PR #31 的 source 规范化修复**的版本。
      若尚未发到 npm，**停下来报告，不得先钉旧版凑数**。

## 3 · 门必须被真跑过（不得交付没验过的门）

- [ ] 3.1 在 agentdock 的 CI 里加一个 job：对 `templates/skills-registry/` 真跑三道门
      （path filter 到该目录）。既有的 `template-validation.yml` 是 web-nextjs 专用
      （`scripts/validate-template.sh` 硬编码 `templates/web-nextjs/apps/web`），**不复用**。
- [ ] 3.2 **门① 反向对照**：临时造一个缺必需字段的 skill → 门① 必须失败；恢复后必须通过。
      贴出两次的实际输出。
- [ ] 3.3 **门② 反向对照**：改示例 skill 的 `description` 但不重新生成 → 门② 必须失败
      且指出该字段的期望 vs 实际；重新生成后必须通过。
- [ ] 3.4 **门② 时间戳负例**：只让 `publishedAt` 不同 → 门② 必须**通过**（这是裁决甲的判据本身）。
- [ ] 3.5 **门③ 反向对照**：临时塞一条命中规则的内容 → 门③ 必须失败并指出文件/行/规则；移除后通过。
- [ ] 3.6 **`agentdock init` 端到端**：用模板真初始化一个项目到临时目录，
      **读产出的目录树**确认 §1 结构正确；`git init` + 设一个 HTTPS `origin` +
      跑 `pnpm skills:sync`，然后三道门全绿。
      只验模板源目录不算——`init` 有自己的改写逻辑（`registry.json`、`_gitignore` 还原等）。
- [ ] 3.7 **bootstrap 之前的负例**：init 后**不跑** `skills:sync` 就跑门②
      → 必须失败，且失败信息里出现 `pnpm skills:sync`。贴出实际输出。

## 4 · 四道门（AGENTS.md 验收条件）

- [ ] 4.1 `pnpm install` exit 0
- [ ] 4.2 `pnpm check-types` exit 0
- [ ] 4.3 `pnpm build` exit 0（`generate-registry` 会自动收录新模板，确认它出现在
      `packages/cli/src/registry.json`）
- [ ] 4.4 `pnpm format` 后本 change 触碰的文件无 diff。⚠️ 全仓另有 101 个既有不合格文件，
      与本刀无关，**不得顺手格式化**（会淹没 diff）
- [ ] 4.5 `openspec validate skills-registry-template` exit 0
- [ ] 4.6 `pnpm align:check` 全绿
- [ ] 4.7 `pnpm secrets:check` exit 0 ★ —— 本刀会写「禁止模式」的示例，
      极易触发 secretlint。**不得靠加 ignore 放宽门**，改写法（第一刀已踩过这个坑）
- [ ] 4.8 `pnpm arch:check` 全绿

## 5 · 收口

- [ ] 5.1 补 changeset（`@cogito.ai/cli` 的模板集变了 → 需要发版才能被 `init` 用到）。
      ⚠️ 第一刀漏过这条：没有 changeset，改动合进 main 也不会发到 npm。
- [ ] 5.2 回写 thefoolai PRD `skill-commerce-loop.mdx` §4.1.2：模板已交付 + 指向本 change。
      （跨仓，走 thefoolai 自己的门）
