## Purpose

定义 AgentDock 平台仓库自身的 AI 协作与治理基线，确保 OpenSpec 规划上下文一致、执行边界清晰，并明确元仓库特例范围。

## Requirements

### Requirement: Platform AI collaboration baseline

平台 SHALL 为其**自身**提供面向 Copilot 的 AI 协作基线，MVP 仅覆盖 GitHub Copilot 与 Copilot CLI（不覆盖 Claude Code / Cursor / Codex 的配置文件）。

MUST 提供：

- `.github/copilot-instructions.md` — 精炼的规则清单（每次请求注入，控制 token）。
- `AGENTS.md` — Copilot CLI 的补充指令（执行边界、验收标准）。

#### Scenario: Copilot 指令文件存在且精炼

- **WHEN** 检查 `.github/copilot-instructions.md`
- **THEN** 文件存在，内容为约束清单式（非长篇叙述），声明平台的目录契约与硬规则要点

#### Scenario: CLI 指令声明执行边界

- **WHEN** 阅读 `AGENTS.md`
- **THEN** 明确"允许自主执行 / 必须暂停确认 / 禁止执行"的边界

### Requirement: OpenSpec context populated

`openspec/config.yaml` 的 `context` 字段 MUST 被填写，向所有规划 session 提供平台技术栈、约定与领域背景。

#### Scenario: context 非空且可被规划复用

- **WHEN** 读取 `openspec/config.yaml`
- **THEN** `context` 字段非空，描述了技术栈（TS/turborepo/pnpm/Supabase）、SSOT=OpenSpec、文档=apps/docs 等关键事实

### Requirement: Meta-repo self-exception declared

AgentDock 作为"元仓库"无法完全从自身 bootstrap，MUST 在文档中明确声明其相对模板规则的自我豁免边界（如对部分反漂移不变量的豁免）。

#### Scenario: 自我豁免被记录

- **WHEN** 阅读平台治理说明（README 或 AGENTS.md 相关段落）
- **THEN** 明确指出本仓库是元仓库/特例，及其豁免范围

### Requirement: Platform tool packages published to npm

`packages/eslint-config`（`@cogito.ai/eslint-config`）和 `packages/tsconfig`（`@cogito.ai/tsconfig`）MUST 作为公开 npm 包发布，不再设置 `private: true`。

发布要求：
- 移除 `private: true` 字段
- 添加 `publishConfig: { "access": "public" }`
- 确保 `version` 字段为有效 semver
- 纳入 Changesets 管理，有独立 CHANGELOG

这是 `generate-registry` 在构建期解析 `workspace:*` 的前提条件：只有已发布的版本号才能被写入 `registry.json` 并在生成项目中正确安装。

#### Scenario: @cogito.ai/eslint-config 不含 private 字段

- **WHEN** 检查 `packages/eslint-config/package.json`
- **THEN** 不存在 `private: true` 字段，存在 `publishConfig: { "access": "public" }`，`version` 为有效 semver

#### Scenario: @cogito.ai/tsconfig 不含 private 字段

- **WHEN** 检查 `packages/tsconfig/package.json`
- **THEN** 不存在 `private: true` 字段，存在 `publishConfig: { "access": "public" }`，`version` 为有效 semver

#### Scenario: 生成项目可在 monorepo 外安装内部工具包

- **WHEN** 在 AgentDock monorepo 外目录运行 `pnpm install`（使用 CLI 生成的项目）
- **THEN** `@cogito.ai/eslint-config` 和 `@cogito.ai/tsconfig` 从 npm registry 成功解析并安装，无 `workspace:*` 错误

### Requirement: Changesets release management

平台 MUST 引入 Changesets 管理所有可发布包（`@cogito.ai/cli`、`@cogito.ai/eslint-config`、`@cogito.ai/tsconfig`）的版本号与 CHANGELOG。

#### Scenario: .changeset 目录存在且配置正确

- **WHEN** 检查仓库根 `.changeset/config.json`
- **THEN** 文件存在，`linked` 数组为空（各包独立版本），`access` 为 `"public"`
