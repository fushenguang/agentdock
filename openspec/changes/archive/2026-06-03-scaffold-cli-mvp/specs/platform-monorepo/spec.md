## MODIFIED Requirements

### Requirement: Monorepo topology

平台 SHALL 采用 turborepo + pnpm workspace 的 monorepo 拓扑，并固化顶层目录契约。

顶层目录 MUST 包含且仅包含以下用途明确的入口：

- `templates/` — 存放可生成项目的模板（MVP 含 `web-nextjs`）。
- `packages/` — 平台自身的工具包（含 `cli`、`eslint-config`、`tsconfig`、`openspec-docs-sync`）。
- `apps/docs` — **AgentDock 平台自己的**文档站（与模板内部的 docs 应用是两个不同的东西）。
- `openspec/` — 平台自身的 SSOT。

#### Scenario: workspace 被 pnpm 识别

- **WHEN** 在仓库根执行 `pnpm install`
- **THEN** `templates/*`、`packages/*`、`apps/*` 下的包被识别为 workspace 成员，且安装成功无错误

#### Scenario: turbo 任务可运行

- **WHEN** 在仓库根执行 `pnpm build`（turbo run build）
- **THEN** turbo 能解析任务图并对各 workspace 成员执行 build，无配置错误

#### Scenario: generate-registry 在 cli build 之前运行

- **WHEN** 在仓库根执行 `pnpm build`，`packages/cli` 为其中一个成员
- **THEN** Turbo 任务图保证 `generate-registry` 先于 `packages/cli#build` 完成

## ADDED Requirements

### Requirement: Root tooling baseline with generate-registry

平台根目录 MUST 在 `turbo.json` 中声明 `generate-registry` 任务，配置 `inputs`（`templates/*/package.json`、`packages/*/package.json`）与 `outputs`（`packages/cli/src/registry.json`），并使 `cli` 包的 `build` 依赖该任务。

#### Scenario: turbo.json 包含 generate-registry 任务

- **WHEN** 检查仓库根 `turbo.json`
- **THEN** 存在 `generate-registry` 任务配置，声明了 `inputs` 和 `outputs` 字段
