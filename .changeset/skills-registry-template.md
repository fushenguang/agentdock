---
'@cogito.ai/cli': minor
---

新增 `skills-registry` 项目模板（`agentdock init --template skills-registry`）

用于初始化一个公开的 Agent Skills 内容仓：`skills/<name>/SKILL.md` 正典 + 根目录生成的
`skills.json` manifest + Fumadocs 文档站，并预置三道 day-one CI 门（纯 Node ESM，零构建步骤）：

- 门①全量校验——对 `skills/` 下每一个目录跑 `agentdock skill validate`，不是只跑改动的
- 门②manifest 新鲜度——重新 publish 全部 skill 与已提交的 `skills.json` 对账（忽略
  `publishedAt`，逐字比较其余字段），同时校验 `apps/docs/content/docs/skills/*` 是否与
  `skills.json` 保持同步
- 门③公私边界——按可配置的 `boundary-rules.json` 正则表扫描全部 git 跟踪文件，拦截私有仓路径 /
  内部域名 / 个人可识别模式

由 `web-nextjs` 模板派生，去掉 `apps/web`、`supabase/`、`packages/openspec-docs-sync/`；
`openspec/` 收窄为只管基建/契约变更（manifest schema、门规则、文档结构），新增一个 skill 不需要
proposal，只需要 `agentdock skill validate` 通过 + PR review。

选 **minor**：新增的项目模板是向后兼容的新能力，不是缺陷修复——和 `cli-skill-publish.md`
（新增 `skill` 子命令族）同一判断。

> ⚠️ 已知未完成项：`templates/skills-registry/package.json` 里 `@cogito.ai/cli` 的
> devDependency 目前是占位符 `PENDING-SEE-TASK-2.7`（等
> `feat/cli-publish-source-normalization` 分支合并发版后填入真实版本号，见本 change 的
> `tasks.md` 2.7）；补上真实版本号需要再发一版才能让 `init` 出的项目真正 `pnpm install` 通过。
