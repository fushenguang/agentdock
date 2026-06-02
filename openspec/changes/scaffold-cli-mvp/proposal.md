---
roadmap-id: cli-mvp-scaffolder
---

## Why

AgentDock 已完成平台基础设施与 `web-nextjs` 模板的一阶段建设，但目前缺乏任何面向用户的入口——开发者无法通过命令行快速创建基于模板的真实项目。更深层的问题是：传统 CLI 仅对人类可用，无法对 AI Agent 提供结构化、可自省、无交互阻塞的工具接口。我们需要在模板进入真实项目验证之前，先建立一个兼顾 **人类 DX（Developer Experience）** 与 **Agent AX（Agent Experience）** 的双轨制 CLI 运行时——这既是验证模板质量的工具，也是平台分发层的战略基础。

## What Changes

- **前置：发布平台内部工具包**：`packages/eslint-config` 与 `packages/tsconfig` 移除 `private: true`，通过 Changesets 发布至 npm（`@agentdock/eslint-config`、`@agentdock/tsconfig`），使其成为独立生成项目可解析的公开依赖。这是 `generate-registry` 构建期依赖解析的必要前提。

- **新增 `packages/cli` 包**：基于 Bun + Citty 构建的 TypeScript 脚手架工具，包名 `@agentdock/cli`。MVP 阶段以 `bun build` 输出 JS bundle，附 `bin: agentdock` 字段发布至 npm，Node ≥18 运行；单文件跨平台二进制分发（`bun build --compile`）与 GitHub Releases 渠道为 Next 阶段目标。

- **核心命令 `agentdock init`**：
  - 人类模式（TTY 检测）：通过 `@clack/prompts` 提供 Stripe 级交互体验（项目名、模板选择、包管理器、镜像源）。
  - Agent 模式（`--silent --json` 标志）：无头静默运行，所有输出为机器可读 JSON，交互阻塞归零。

- **核心命令 `agentdock mcp`**：启动符合 Model Context Protocol 协议的 Stdio 长连接服务，将模板库动态投影为 AI Agent 工具链，工具包括 `list_templates`、`scaffold_project`、`get_template_schema`。

- **编译期注册表生成 `generate-registry` Turbo 任务**：自动扫描 `templates/` 下所有 `package.json`，聚合生成 `packages/cli/src/registry.json`，规避手动维护导致的语义漂移。CLI 内置此静态注册表，`agentdock mcp` 基于注册表动态暴露工具。

- **版本自愈机制**：当 CLI 版本与模板 `minCliVersion` 字段不兼容时，返回结构化错误码 `CLI_VERSION_OUTDATED` 并附带 `suggested_action`（含升级命令），供 Agent 自主执行。

- **构建期 `workspace:*` 依赖解析**：`generate-registry` 任务在构建期扫描 `templates/*/package.json`，将 `workspace:*` 引用解析为对应包的已发布 semver 版本（读取 `packages/*/package.json` 中的 `version` 字段），并将解析结果写入 `registry.json`。CLI 运行时直接引用已解析的版本号，无运行时字符串改写逻辑，确保版本在发布时锁定且经过验证。

- **Turbo 任务图更新**：`turbo.json` 新增 `generate-registry` 任务，`cli#build` 依赖 `generate-registry`，确保注册表在打包前已生成。

- **发版自动化**：引入 Changesets，配置 `.changeset/` 目录与 `pnpm changeset` 工作流，为后续 npm 发布奠基。

## Capabilities

### New Capabilities

- `cli-runtime`：CLI 双轨制运行时架构——TTY 交互层（Clack）与无头 JSON 输出层（`--silent --json`）的解耦设计，包括 TTY 检测、模式路由、错误码规范（`CLI_VERSION_OUTDATED` 等）。
- `cli-init-command`：`agentdock init` 命令的完整行为规范，涵盖人类交互流程（项目名、模板选择、包管理器）、Agent 静默流程（`--silent --json`）、从内置模板资产复制文件并写入已解析依赖版本。MVP 阶段模板资产内置于 CLI 包，不依赖远程拉取（Giget 远程模板为 Next 阶段）。
- `cli-mcp-server`：`agentdock mcp` 命令规范，定义 MCP Stdio 服务的工具列表（`list_templates`、`scaffold_project`、`get_template_schema`）、协议版本锁定与生命周期管理。
- `cli-template-registry`：编译期注册表规范，定义 `registry.json` 的 schema（`id`、`name`、`description`、`minCliVersion`、`source`）、`generate-registry` Turbo 任务的触发条件与幂等性保证。

### Modified Capabilities

- `platform-monorepo`：新增 `packages/cli` 成员，`turbo.json` 任务图中引入 `generate-registry` 任务节点；monorepo 目录契约需记录 CLI 包的归属位置与 Turbo 任务依赖关系。
- `platform-self-governance`：`packages/eslint-config` 与 `packages/tsconfig` 从 `private: true` 改为公开发布，需更新包发布约束规范（Changesets 工作流覆盖范围扩展）。

## Impact

**新增文件/目录：**
- `packages/cli/` — CLI 包全量代码（Bun + Citty + Clack + MCP SDK + Giget）
- `packages/cli/src/registry.json` — 编译期生成的模板注册表（不纳入版本控制，由 `generate-registry` 构建）
- `.changeset/` — Changesets 发版配置

**修改文件：**
- `turbo.json` — 新增 `generate-registry` 任务，更新 `build` 依赖链
- `pnpm-workspace.yaml` — 无需修改（`packages/*` 通配已覆盖 `packages/cli`）
- `roadmap.yaml` — 新增 `cli-mvp-scaffolder` 条目至 `next` 桶（人工操作）
- `templates/web-nextjs/package.json` — 新增 `minCliVersion` 字段至 `agentdock` 自定义字段

**新增依赖（`packages/cli`）：**
- `citty` — CLI 框架与命令路由
- `@clack/prompts` — 人类终端交互 UI
- `@modelcontextprotocol/sdk` — MCP 协议实现
- `giget` — 远程模板拉取（Next 阶段启用；MVP 阶段模板内置，作为预留依赖引入）

**修改（`packages/eslint-config`、`packages/tsconfig`）：**
- 移除 `private: true`，补全 `publishConfig`，纳入 Changesets 发版管理

**外部影响：**
- 生成项目的 `package.json` 将不含 `workspace:*` 依赖，引用已发布的 `@agentdock/eslint-config` 和 `@agentdock/tsconfig`，可独立于 AgentDock monorepo 使用
- AI Agent 通过 MCP 协议调用 CLI 工具链，无需了解底层实现细节
- `@agentdock/eslint-config` 和 `@agentdock/tsconfig` 正式成为公开 npm 包，第三方项目可独立引用
