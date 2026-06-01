## Why

AgentDock 是一个面向 AI Coding Agent 的开源工程脚手架平台，但当前仓库几乎是空的（README 一行、openspec context 为空、无 monorepo 拓扑）。在写任何能力之前，必须先有一个**干净、可公开、可治理**的 monorepo 地基，否则后续所有 change 无处落脚，且第一天就 public 建设要求零密钥与规范化的提交历史。

## What Changes

- 建立 turborepo + pnpm workspace 的 monorepo 拓扑，固化顶层目录契约：`templates/`（模板）、`packages/`（平台工具）、`apps/docs`（**AgentDock 平台自己的**文档站，区别于模板内的 docs）。
- 补齐 public 就绪物料：`LICENSE`、可读的 `README`、`CONTRIBUTING`、提交规范（conventional commits）、`.gitignore` 与基础 secret 卫生基线。
- 建立平台**自身**的 AI 协作基线：`.github/copilot-instructions.md` + `AGENTS.md`（仅服务 Copilot + Copilot CLI），并填写 `openspec/config.yaml` 的 `context`（供所有规划 session 复用）。
- 明确 `apps/docs` 归属为平台文档站，迁移/规整当前根目录已有的 docs 应用骨架到该定位。
- **BREAKING**（仅对本仓库现状）：重排现有目录以符合上述拓扑。

## Capabilities

### New Capabilities

- `platform-monorepo`: turborepo + pnpm workspace 拓扑、顶层目录契约、根级 tsconfig/prettier/turbo 配置。
- `public-readiness`: 开源就绪物料（LICENSE/README/CONTRIBUTING/提交规范/secret 卫生基线）。
- `platform-self-governance`: 平台自身的 Copilot/AGENTS 配置基线 + 已填写的 openspec context。

### Modified Capabilities

- （无，本仓库尚无已有 spec）

## Non-goals

- 不实现任何模板内容（web-nextjs 的目录契约/功能 → change ⑤）。
- 不实现 Layer 2 约束门禁（eslint/arch/CI → change ③）。
- 不实现 roadmap/对齐脚本（→ change ②）。
- 不做 CLI（`create-agentdock`）、不做 `_shared` 同步引擎、不做发版流水线（押后，需真实项目验证后再议）。
- 不覆盖 Claude Code / Cursor / Codex 的配置（MVP 仅 Copilot）。

## Roadmap & Sequence

- Roadmap 锚点：`platform-foundation`（Now）。
- 顺序：本 change 为 **①**，是 ②③④⑤ 的共同前置。无前置依赖。

## Impact

- 影响范围：仓库根（package.json/turbo.json/pnpm-workspace.yaml）、`apps/docs` 定位、`.github/`、`openspec/config.yaml`。
- 风险：目录重排可能触及已有 docs 应用；需保证其仍可构建。
