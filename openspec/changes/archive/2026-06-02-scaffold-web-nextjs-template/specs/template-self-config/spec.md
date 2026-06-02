## ADDED Requirements

### Requirement: AI 工具链配置
`templates/web-nextjs/` MUST 自带面向 AI 编码助手的配置文件，引导 Copilot/AI 遵守模板目录契约与 Layer 2 规则。

配置文件：
- `.github/copilot-instructions.md`：声明目录契约（core/features/infra/_experiments）、Layer 2 规则（4 条 error）、Conventional Commits、pnpm only、TypeScript strict。引用 `packages/eslint-config` 规则来源。
- `AGENTS.md`：声明 AI 自主边界（可自主 lint/test/build；需确认 push、删除文件、新增顶层目录）。格式参照平台 `AGENTS.md`。

#### Scenario: Copilot 收到 no-direct-db-in-features 规则提示
- **WHEN** Copilot 在 `features/` 中生成代码
- **THEN** `.github/copilot-instructions.md` 的上下文告知 Copilot 不得直接 import `infra/db`

#### Scenario: 新开发者读 AGENTS.md 了解 AI 边界
- **WHEN** 开发者克隆模板后运行 AI agent
- **THEN** `AGENTS.md` 明确列出哪些操作需人工确认

### Requirement: 模板内 openspec
`templates/web-nextjs/` MUST 包含自己的 `openspec/`，使下游项目可用 openspec 工作流管理自身变更。

- `openspec/config.yaml`：预填 context（下游项目模板信息、tech stack）、rules（proposal 必须含 Non-goals）。
- `openspec/changes/`、`openspec/specs/`：空目录（含 `.gitkeep`），下游按需填充。
- 平台自身 `openspec/` 不受此影响（隔离）。

#### Scenario: 下游项目克隆模板后可直接运行 openspec CLI
- **WHEN** 下游项目运行 `openspec new-change "add-feature-x"`
- **THEN** `templates/web-nextjs/openspec/` 提供正确的目录结构与 config

### Requirement: i18n 骨架
`templates/web-nextjs/` MUST 提供 i18n 骨架，英文优先，中文作为占位（不双语全量维护）。

- 使用 `next-intl`（轻量、App Router 原生支持）。
- 消息文件：`messages/en.json`（真实内容）、`messages/zh.json`（占位，value=key）。
- 参考 feature `features/hello/` 页面使用 `t('hello.title')` 演示 i18n 用法。

#### Scenario: 英文 locale 正常渲染
- **WHEN** 访问 `/en/hello`
- **THEN** 页面显示 `en.json` 中对应翻译内容

#### Scenario: 中文 locale 回退占位不报错
- **WHEN** 访问 `/zh/hello`
- **THEN** 页面正常渲染（显示 key 作为占位），不抛 missing translation 错误
