## Purpose

定义 web-nextjs 模板的自配置能力，包括 AI 协作约束、模板内 openspec 工作流与 i18n 基础设施，确保下游项目开箱即用。

## Requirements

### Requirement: AI 工具链配置

`templates/web-nextjs/` MUST 自带面向 AI 编码助手的配置文件，引导 Copilot/AI 遵守模板目录契约与 Layer 2 规则。

配置文件：

- `.github/copilot-instructions.md`：声明目录契约（core/features/infra/\_experiments）、Layer 2 规则（4 条 error）、Conventional Commits、pnpm only、TypeScript strict。引用 `packages/eslint-config` 规则来源。
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

### Requirement: 模板的包管理器数组型设置只能有一个真正生效的来源

模板 MUST NOT 在 `.npmrc` 里表达任何**数组语义**的 pnpm 设置（如 `only-built-dependencies`）。

理由是形态问题而非风格问题：`.npmrc` 只能存字符串，pnpm 会把
`only-built-dependencies = a,b,c` 映射成一个**字符串**；消费该设置的工具链
（如 `pnpm/action-setup` 的 self-installer）会对它执行数组操作并崩溃，
使**任何由该模板脚手架出来的仓库**在安装阶段就失败。

这类设置的唯一真源 MUST 是 `pnpm-workspace.yaml`，且 MUST 只保留一处——
同一设置在多处并存本身就是产生上述崩溃的条件之一（实测：`.npmrc` 与
`pnpm-workspace.yaml` 各写一份，包管理器解析出的是**两份拼接**的结果）。

模板 MUST NOT 依赖 `package.json` 的 `pnpm` 字段来表达此类设置：
在 workspace 根下 pnpm 10 **不读取**它，留着它会让人误以为设置仍然生效——
这是一种比崩溃更隐蔽的失效（不会红，只是不生效）。

#### Scenario: 模板不含 `.npmrc` 形式的数组型设置

- **WHEN** 检查任一模板的 `.npmrc`
- **THEN** 其中不含 `only-built-dependencies` 之类以逗号分隔表达列表的键

#### Scenario: 该设置真正生效（负例：删除不得造成静默失效）

- **WHEN** 在模板目录内向包管理器**查询**该设置的实际生效值
- **THEN** 返回一个数组，其条目与移除前**完全一致、无重复**——判据是「包管理器真的读到了」，而不是「文件里还写着」

#### Scenario: 脚手架产物可以完成安装

- **WHEN** 用该模板脚手架出一个项目并在产物目录内执行依赖安装
- **THEN** 安装成功，不因包管理器配置的形态问题而失败
