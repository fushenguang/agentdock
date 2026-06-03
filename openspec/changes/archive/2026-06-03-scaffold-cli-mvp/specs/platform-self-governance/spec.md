## ADDED Requirements

### Requirement: Platform tool packages published to npm

`packages/eslint-config`（`@agentdock/eslint-config`）和 `packages/tsconfig`（`@agentdock/tsconfig`）MUST 作为公开 npm 包发布，不再设置 `private: true`。

发布要求：
- 移除 `private: true` 字段
- 添加 `publishConfig: { "access": "public" }`
- 确保 `version` 字段为有效 semver（初始发布版本为 `0.1.0`）
- 纳入 Changesets 管理，有独立 CHANGELOG

这是 `generate-registry` 在构建期解析 `workspace:*` 的前提条件：只有已发布的版本号才能被写入 `registry.json` 并在生成项目中正确安装。

#### Scenario: @agentdock/eslint-config 不含 private 字段

- **WHEN** 检查 `packages/eslint-config/package.json`
- **THEN** 不存在 `private: true` 字段，存在 `publishConfig: { "access": "public" }`，`version` 为有效 semver

#### Scenario: @agentdock/tsconfig 不含 private 字段

- **WHEN** 检查 `packages/tsconfig/package.json`
- **THEN** 不存在 `private: true` 字段，存在 `publishConfig: { "access": "public" }`，`version` 为有效 semver

#### Scenario: 生成项目可在 monorepo 外安装内部工具包

- **WHEN** 在 AgentDock monorepo 外目录运行 `pnpm install`（使用 CLI 生成的项目）
- **THEN** `@agentdock/eslint-config` 和 `@agentdock/tsconfig` 从 npm registry 成功解析并安装，无 `workspace:*` 错误

---

### Requirement: Changesets release management

平台 MUST 引入 Changesets 管理所有可发布包（`@agentdock/cli`、`@agentdock/eslint-config`、`@agentdock/tsconfig`）的版本号与 CHANGELOG。

#### Scenario: .changeset 目录存在且配置正确

- **WHEN** 检查仓库根 `.changeset/config.json`
- **THEN** 文件存在，`linked` 数组为空（各包独立版本），`access` 为 `"public"`

#### Scenario: changeset 工作流可执行

- **WHEN** 运行 `pnpm changeset`
- **THEN** 交互式 CLI 启动，可选择受影响包与 bump 类型，生成 changeset 文件
