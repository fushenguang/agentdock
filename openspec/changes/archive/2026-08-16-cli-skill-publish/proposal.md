---
roadmap-id: skills-hub-cli
---

# cli-skill-publish

> 本刀是 thefoolai `skill-commerce-loop` 子roadmap 第 1 刀在本仓库的落点。
> 按跨仓库治理约定：**hub 本体的 roadmap 条目与 openspec change 全在 agentdock**，thefoolai 侧只留一行链过来。
> 上游 PRD：thefoolai `apps/wiki/content/docs/prd/skill-commerce-loop.mdx`

## Why

**做好的 skill 今天出不去。**

thefoolai 那边刚把 skill 代谢干净（25 → 13，94M → 7.1M）并建好了参与集归因底座。留下的 13 个里，`lesson-prep` 是**真实老师方法论、授权已取得**——但它**没有任何对外分发路径**：

- 想给别人用，只能手动把目录发过去
- 同一批 skill 被复制进 `.claude` / `.cline` / `.codex` / `.lingma` **四个 agent 目录**靠手工同步（这是整个 skills-hub 方向最初的痛点，至今没解）
- Agent Skills 已是开放标准（~50 家采纳），**格式与分发已被商品化**，缺的只是一条把 skill 变成可安装资产的工具链

而 CLI 今天只有 `init`（项目脚手架）和 `mcp`，**零 skill 能力**。

### 为什么现在做（触发条件已满足）

`roadmap.yaml` 的 `skills-hub-cli` 条目上原有一条人工门——「账本非零才开工」。**2026-08-13 构建者明确放行**，理由是那条门的论证前提被推翻了：

> 它要防的是「hub 带着空履历库上线、退回成又一个 skill 目录」。但**履历是闭环跑起来之后的产物、不是它的前置条件**——先有发布/获取/安装的通路，才谈得上积累履历。**要求先有履历再建通路，是把因果颠倒了。**

## What

给 CLI 加**最小可用的 skill 发布能力**，产物是一条 **git manifest 条目**。

- **`agentdock skill validate <dir>`** —— 结构校验。至少覆盖：`SKILL.md` 存在且 frontmatter 可解析、spec 必需字段齐全、非 spec 顶层键的处理（thefoolai 侧的 L2 合规约定是迁进 `metadata:` 并加前缀）
- **`agentdock skill publish <dir>`** —— 校验 → 产出 manifest 条目 → 写入**本地 registry 仓库 checkout**，**到此为止**：由人审阅后自行 commit / PR
- **双模输出**：遵既有的 `--json` NDJSON 契约（`{ok:true,...}` / `{ok:false,error:CODE,message,...}`），Agent 与人都能用

### ★ registry 形态：git manifest，**不碰任何后端**

skill **内容永远在 git**；manifest 只存索引（`id` / `source` / `version` / `描述` 等）。

**这条是硬的**：thefoolai 侧的 `skills_registry`（Supabase）是**它自己的索引层**，与本 CLI 无关。**CLI 绝不写它，也不知道它存在**——否则一个要发到 npm 给所有人用的独立包，就反过来依赖上了某个宿主的私有基建。

> 上游 PRD 原文曾写「产出接进已有 `skills_registry`」，**该表述已订正**：CLI 产出 manifest，**把 manifest 索引进 `skills_registry` 是 thefoolai 侧的事**。

### 发布必须停下来让人确认

本仓库 `.claude/CLAUDE.md` 的「必须暂停确认」清单明确包含**发布到 registry**。

因此 v0 **不做自动推送**：`publish` 把条目写进本地 checkout 就停，人审阅后自行 commit/PR。**这既满足了那条约束，又顺带免掉了凭据管理**——CLI 不需要持有任何 token。

## Non-goals

- ❌ **不做 `eval`（skill 质量评估）**——「怎么评」本身是个未定义的大问题，且当前无消费者。上游减法门已 DEFER，触发条件 = 出现"两个功能重叠的 skill 要选一个"的真实场景。
- ❌ **不写任何后端 / 不碰 Supabase**——见上文 registry 形态。CLI 必须保持零后端依赖。
- ❌ **不做自动推送到远端 registry**——违反本仓库「发布到 registry 必须暂停确认」的约束，且会引入凭据管理。
- ❌ **不改既有的 `init` / `mcp` 命令**，不动模板 registry（`src/registry.json` 是**模板**注册表，与 skill registry 是两回事，形态不匹配，不复用其代码）。
- ❌ **不做 skill 的安装/消费侧**——那在 thefoolai（`downloadSkill` 已存在）。
- ❌ **不做交易/授权**——那是上游 epic 的 #4，且属权限层，与本体解耦。

## Trigger

✅ **已点亮**——2026-08-13 构建者明确放行原有的人工门（理由见 Why）。WIP 位空闲（`roadmap.yaml` 当前 0 个 in-progress）。
