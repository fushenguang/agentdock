## ADDED Requirements

### Requirement: Monorepo topology

平台 SHALL 采用 turborepo + pnpm workspace 的 monorepo 拓扑，并固化顶层目录契约。

顶层目录 MUST 包含且仅包含以下用途明确的入口：

- `templates/` — 存放可生成项目的模板（MVP 仅 `web-nextjs`）。
- `packages/` — 平台自身的工具包。
- `apps/docs` — **AgentDock 平台自己的**文档站（与模板内部的 docs 应用是两个不同的东西）。
- `openspec/` — 平台自身的 SSOT。

#### Scenario: workspace 被 pnpm 识别

- **WHEN** 在仓库根执行 `pnpm install`
- **THEN** `templates/*`、`packages/*`、`apps/*` 下的包被识别为 workspace 成员，且安装成功无错误

#### Scenario: turbo 任务可运行

- **WHEN** 在仓库根执行 `pnpm build`（turbo run build）
- **THEN** turbo 能解析任务图并对各 workspace 成员执行 build，无配置错误

### Requirement: Root tooling baseline

平台根目录 MUST 提供统一的 `turbo.json`、`pnpm-workspace.yaml`、根 `tsconfig`（strict 基线指向）、`prettier` 与 `.gitignore`。

#### Scenario: 类型检查与格式化可用

- **WHEN** 执行 `pnpm check-types` 与 `pnpm format`
- **THEN** 两条命令均能在 monorepo 范围内运行且不因缺失配置而失败

### Requirement: apps/docs 归属为平台文档站

`apps/docs` SHALL 被明确定位为 AgentDock 平台自身的文档站；现有根目录下的 docs 应用骨架 MUST 被规整到该定位且保持可构建。

#### Scenario: docs 站可构建

- **WHEN** 对 `apps/docs` 执行其 build
- **THEN** 构建成功，且其内容定位为平台文档（非模板内 docs）
