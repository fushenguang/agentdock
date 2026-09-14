---
roadmap-id: web-tanstackstart-template
---

## Why

`agentdock init --dir apps/<name>` 当前会无条件复制完整 standalone 模板。把 `web-tanstackstart` 放进已有 pnpm workspace 时，会复制子级 `pnpm-workspace.yaml`、lockfile 和 `.npmrc`，导致父 workspace 与子目录拥有两套安装边界、包管理器约束和构建授权真源。

需要一个显式但默认自动感知的 workspace-member mode，让单包模板可以安全生成为已有 workspace 的普通成员，同时不改变模板作为独立项目使用时的行为。

## What Changes

- 为 `agentdock init` 增加 `--mode auto|workspace|standalone`，默认 `auto`。
- `auto` 从目标目录向上探测最近的 pnpm workspace，并根据 `pnpm-workspace.yaml#packages` 的正负 glob 判断目标是否为成员。
- workspace mode 不复制子级 `pnpm-workspace.yaml`、`pnpm-lock.yaml`、`.npmrc`，并从生成包中移除 `packageManager` 与 `engines.pnpm`；`engines.node` 保留为成员运行时要求。
- 在写文件前校验根 workspace 的 pnpm 版本与模板要求；不兼容时 fail closed，不创建目标目录。
- 根 `allowBuilds` 变更以结构化 `requiredRootChanges` 返回；默认不修改根配置，不覆盖已有值或无效值，并单独报告冲突。
- workspace mode 生成 `.agentdock/workspace.json`，并向 `AGENTS.md` 注入简洁的 workspace 使用说明，避免后续 Agent 在子目录重复安装。
- `--json` 返回 `mode`、`workspaceRoot`、`lockfileOwner`、`requiredRootChanges` 和 `rootConfigConflicts`。
- 仅单包模板可 opt-in workspace-member mode；本次只启用 `web-tanstackstart`，`web-nextjs` 继续用于独立完整项目。
- 增加中英文 CLI 文档、模板说明、回归测试与 changeset。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `cli-init-command`: 增加 placement 探测、workspace-member 渲染、写入前兼容性检查、结构化结果和 Agent 上下文。
- `cli-template-registry`: 注册表暴露模板的 workspace-member 能力、运行时版本要求和根构建授权需求。

## Non-goals

- 不自动修改根 `pnpm-workspace.yaml`、根 `package.json` 或根 lockfile。
- 不支持 npm、yarn 或 bun workspace。
- 不为 `web-nextjs` 等 monorepo 模板实现嵌套成员转换。
- 不实现完整 YAML 编辑器或任意 pnpm 配置重写。
- 不迁移本仓库或下游项目的现有生成目录。

## Impact

- 修改 `packages/cli` 的 init 参数、agent/human adapter、scaffold、registry schema 和测试。
- 修改 `templates/web-tanstackstart/package.json` 的 AgentDock 元数据；standalone 文件形态不变。
- 修改 `scripts/generate-registry` 以生成新的模板元数据。
- 更新 `apps/docs` 的中英文 CLI 与 `web-tanstackstart` 使用说明。
- 不修改 `web-nextjs` 模板结构，不自动迁移任何现有生成项目。
- 不新增运行时依赖。
