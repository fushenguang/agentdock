## MODIFIED Requirements

### Requirement: Human interaction flow

人类模式下，`agentdock init` MUST 通过 `@clack/prompts` 提供以下交互步骤（按顺序）：

1. 项目名输入（默认值：`my-app`，校验：合法 npm 包名）
2. 模板选择（从 registry.json 枚举）
3. 数据层选择（选项来自所选模板的 `dataLayers`，默认选中 `defaultDataLayer`）
4. [仅当所选模板的 `supportsSchema` 为 true 且选择 `supabase`] Schema 名称输入（默认值 `public`，校验 `/^[a-z_][a-z0-9_]*$/`）
5. 包管理器选择（默认 `pnpm`；模板强制包管理器时跳过选择并直接使用模板声明值）
6. 确认摘要（展示将创建的目录、模板、数据层与依赖命令）
7. 执行脚手架（显示 spinner，完成后展示 next steps）

`web-nextjs` MUST 继续提供 `supabase`（默认）和 `drizzle` 选项。`web-tanstackstart` MUST 提供 `sqlite`（默认）和 `supabase`，且不询问 schema 名称。

`web-tanstackstart` MUST 只接受 pnpm，因为模板显式声明了 pnpm 12 `packageManager`。

#### Scenario: 交互完成后生成项目目录

- **WHEN** 用户在 TTY 模式下完成所有提示输入
- **THEN** 在当前工作目录下创建项目目录，复制模板文件，替换模板元数据，进程 exit 0

#### Scenario: 用户中途取消

- **WHEN** 用户在任意提示步骤按下 Ctrl+C
- **THEN** Clack 展示取消消息，不创建任何文件，进程以非零状态退出

#### Scenario: web-nextjs 选择 Supabase 并输入 schema

- **WHEN** 用户选择 `web-nextjs` 和 `supabase`，输入 schema 名称 `myapp`
- **THEN** 脚手架调用时 `schema: "myapp"`，生成的 SQL 文件把 `__SCHEMA__` 替换为 `myapp`

#### Scenario: web-nextjs 选择 Drizzle 跳过 schema

- **WHEN** 用户选择 `web-nextjs` 和 `drizzle`
- **THEN** 不显示 schema 输入步骤，SQL 文件保持 `__SCHEMA__` 原样

#### Scenario: web-tanstackstart 默认 SQLite

- **WHEN** 用户选择 `web-tanstackstart` 并接受默认数据层
- **THEN** 提示显示 `sqlite`，不显示 schema 输入步骤，生成项目的默认 provider 为 sqlite

#### Scenario: web-tanstackstart 可选择 Supabase

- **WHEN** 用户选择 `web-tanstackstart` 和 `supabase`
- **THEN** 不显示 schema 输入步骤，生成项目的默认 provider 为 supabase

#### Scenario: web-tanstackstart 不接受非 pnpm 包管理器

- **WHEN** 用户为 `web-tanstackstart` 选择 npm、yarn 或 bun
- **THEN** CLI 不创建项目并报告包管理器与模板不兼容

### Requirement: Agent headless flow

Agent 模式下，`agentdock init` MUST 支持通过命令行参数传入所有必要信息，无需任何交互：

```text
agentdock init --name <project-name> --template <template-id> \
               --pm <package-manager> --silent --json \
               --data-layer <layer-id> --schema <name>
```

默认 `--pm` MUST 为 pnpm。`--data-layer` 的默认值 MUST 来自所选模板的 `defaultDataLayer`。未传显式数据层时，CLI MUST 按模板默认值执行。

#### Scenario: Agent 静默初始化成功

- **WHEN** Agent 执行 `agentdock init --name my-project --template web-tanstackstart --silent --json`
- **THEN** 不渲染交互 UI，stdout 输出成功 JSON，exit 0，生成项目默认 provider 为 sqlite

#### Scenario: Agent 传入无效模板 ID

- **WHEN** Agent 执行 `agentdock init --template non-existent --json`
- **THEN** stdout 输出 `TEMPLATE_NOT_FOUND` 错误，exit 1，无文件被创建

#### Scenario: Agent 为 web-tanstackstart 选择 Supabase

- **WHEN** Agent 执行 `agentdock init --name test --template web-tanstackstart --data-layer supabase --json`
- **THEN** 生成项目默认 provider 为 supabase，且不要求 schema 参数

#### Scenario: Agent 为 web-nextjs 省略 data-layer

- **WHEN** Agent 执行 `agentdock init --name test --template web-nextjs --json`
- **THEN** 使用模板默认 `supabase`，按旧行为使用 schema `public`

### Requirement: Generated project package.json correctness

生成项目的 `package.json` MUST 满足以下条件：

- `name` 字段替换为用户输入的项目名
- `version` 重置为 `"0.1.0"`
- `private` 字段移除
- 所有 `workspace:*` 依赖替换为 registry.json 中记录的已解析 semver 版本
- 模板显式声明的 `packageManager` MUST 保留
- 模板未声明 `packageManager` 时 MAY 使用 CLI 检测到的 pnpm 版本

#### Scenario: 生成 package.json 无 workspace:\* 引用

- **WHEN** 在 AgentDock monorepo 外执行生成项目的 `pnpm install`
- **THEN** 安装成功，无 `workspace:*` 无法解析的错误

#### Scenario: pnpm 12 模板生成结果保持一致

- **WHEN** 从 `web-tanstackstart` 生成项目
- **THEN** 生成的 `package.json.packageManager` 为 `"pnpm@12.4.1"`
