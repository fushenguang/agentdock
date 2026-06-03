---
roadmap-id: web-nextjs-builtin-suite
---

## Why

在 AI Coding Agent 时代，一个核心洞察正在被实践验证：**文档必须从第一天起与应用共同成长**。当 AI Agent（Copilot、Claude Code 等）在新 session 中工作时，它唯一的"长期记忆"来源是结构化文档——`copilot-instructions.md` 提供约束边界，但无法承载架构决策、接口演变历史、feature 成长轨迹。

`web-nextjs` 模板当前是单 Next.js 应用，无内置 docs 站。这意味着：
- AI Agent 每次 session 只能靠约束文件推断上下文，无法查阅决策历史
- 随着 feature 累积，`copilot-instructions.md` 会越来越臃肿
- 下游项目团队没有标准的知识沉淀位置

解决方案：将模板重构为 **monorepo 范式**，内置 `apps/docs`（Fumadocs/Next.js），与主应用（`apps/web`）共同成长。这使得每个 feature、每个 ADR、每个架构决策都有专属的文档落点，AI Agent 可以从 docs 获取真实的项目知识，而非仅靠约束规则推断。

## What Changes

- `templates/web-nextjs/` 从单 Next.js 应用重构为 **turborepo + pnpm monorepo**：
  - `apps/web/`：原主应用（保留所有现有代码：四层目录契约、hello feature、Supabase 仓储、i18n 骨架）
  - `apps/docs/`：内置 Fumadocs/Next.js 文档站，接入 `openspec-docs-sync`（changelog/roadmap 自动投影）
  - `packages/`：为未来共享逻辑预留（暂空）
- 模板根的 `openspec/` 接入 `openspec-docs-sync`，使 docs 站随 changes 自动生长
- 模板自配置文件（`copilot-instructions.md`、`AGENTS.md`）更新，反映 monorepo 结构

## Capabilities

### New Capabilities

- `template-monorepo-structure`：turborepo + pnpm monorepo 骨架（apps/web + apps/docs + packages/），根级 turbo pipeline（build/dev/lint/test）
- `template-docs-site`：内置 Fumadocs docs 站（`apps/docs/`），预配置 openspec-docs-sync，changelog/roadmap 页自动生成，本地 Orama 搜索
- `template-docs-coevolution`：docs 与 web 应用共同成长机制——feature 开发时有标准文档落点（`apps/docs/content/docs/features/`），ADR 有专属目录（`apps/docs/content/docs/decisions/`）

### Modified Capabilities

- `template-directory-contract`：更新路径（`apps/web/src/core|features|infra`），ESLint/tsconfig 消费方式适配 monorepo workspace
- `template-self-config`：更新 `copilot-instructions.md`、`AGENTS.md` 反映 monorepo 结构；模板 `openspec/` 接入 docs-sync

## Non-goals

- **不迁移**平台 `apps/docs`（AgentDock 平台文档站，与此无关）
- **不实现** auth / payments / analytics / 其他业务 feature（下一批子 changes）
- **不改变**四层目录契约与 Layer 2 规则（仅迁移路径，规则不变）
- **不引入** Nx 或其他构建工具（turborepo 与平台一致）
- **不做**模板 docs 站的双语全量维护（英文优先，中文占位，与 i18n 骨架保持一致）
- **不改变** `packages/openspec-docs-sync` 的平台实现（直接消费，不 fork）

## Roadmap & Sequence

- Roadmap 锚点：`web-nextjs-builtin-suite`（Now，in-progress）
- 顺序：**builtin-suite 第一子 change**，在 auth / payments / analytics 之前必须完成——因为后续所有 feature 都要在 monorepo 结构中实现，并能在 docs 站记录其决策

## Impact

- 影响范围：`templates/web-nextjs/**` 全量目录重组；消费平台 `packages/openspec-docs-sync`
- 风险：monorepo 迁移时现有代码路径、import alias、ESLint config 需要同步更新，可能引入临时 type error → 以 `pnpm check-types` 门禁保证
