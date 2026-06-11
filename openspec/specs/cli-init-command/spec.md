## ADDED Requirements

### Requirement: Human interaction flow

人类模式下，`agentdock init` MUST 通过 `@clack/prompts` 提供以下交互步骤（按顺序）：

1. 项目名输入（默认值：`my-app`，校验：合法 npm 包名）
2. 模板选择（从 registry.json 枚举，MVP 仅显示 `web-nextjs`）
3. 数据层选择（`supabase` | `drizzle`，`supabase` 标注 recommended，`drizzle` 标注 coming soon）
4. [仅当选择 `supabase`] Schema 名称输入（默认值 `public`，校验 `/^[a-z_][a-z0-9_]*$/`）
5. 包管理器选择（`pnpm` / `npm` / `yarn`，默认 `pnpm`）
6. 确认摘要（展示将创建的目录、模板、依赖命令）
7. 执行脚手架（显示 spinner，完成后展示 next steps）

#### Scenario: 交互完成后生成项目目录

- **WHEN** 用户在 TTY 模式下完成所有提示输入
- **THEN** 在当前工作目录下创建以项目名命名的子目录，复制模板文件，`package.json` 中模板名和 `workspace:*` 已替换为正确值，进程 exit 0

#### Scenario: 用户中途取消（Ctrl+C）

- **WHEN** 用户在任意提示步骤按下 Ctrl+C
- **THEN** Clack 展示取消消息，不创建任何文件，进程以 exit code 1 退出

#### Scenario: 项目名校验失败

- **WHEN** 用户输入非法 npm 包名（如含空格、大写字母）
- **THEN** Clack 展示内联错误提示，要求重新输入，不推进下一步

#### Scenario: 用户选择 supabase 并输入 schema 名称

- **WHEN** 用户在交互流中选择 `supabase` 数据层，输入 schema 名称 `myapp`
- **THEN** 脚手架调用 `scaffoldProject` 时 `schema: "myapp"`，生成的 `.sql` 文件中 `__SCHEMA__` 替换为 `myapp`

#### Scenario: 用户选择 drizzle 跳过 schema 输入

- **WHEN** 用户在交互流中选择 `drizzle` 数据层
- **THEN** 不显示 schema 名称输入步骤，`scaffoldProject` 调用不传 `schema` 字段，SQL 文件保持 `__SCHEMA__` 原样

#### Scenario: schema 名称校验失败

- **WHEN** 用户输入非法 schema 名称（含大写字母、特殊字符、以数字开头）
- **THEN** Clack 展示内联错误提示 "Schema name must be lowercase letters, numbers, or underscores, starting with a letter or underscore"

---

### Requirement: Agent headless flow

Agent 模式下，`agentdock init` MUST 支持通过命令行参数传入所有必要信息，无需任何交互：

```
agentdock init --name <project-name> --template <template-id> \
               --pm <package-manager> --silent --json \
               --data-layer <supabase|drizzle> --schema <name>
```

所有参数均有默认值：`--name my-app`、`--template web-nextjs`、`--pm pnpm`、`--data-layer supabase`、`--schema public`。

#### Scenario: Agent 静默初始化成功

- **WHEN** Agent 执行 `agentdock init --name my-project --template web-nextjs --silent --json`
- **THEN** 不渲染任何交互 UI，stdout 输出 `{"ok":true,"result":{"path":"./my-project","template":"web-nextjs","pm":"pnpm"}}`，exit 0

#### Scenario: Agent 传入无效模板 ID

- **WHEN** Agent 执行 `agentdock init --template non-existent --json`
- **THEN** stdout 输出 `{"ok":false,"error":"TEMPLATE_NOT_FOUND","message":"..."}` ，exit 1，无任何文件被创建

#### Scenario: Agent 传递 --data-layer supabase --schema myapp

- **WHEN** Agent 执行 `agentdock init --name test --template web-nextjs --data-layer supabase --schema myapp --json`
- **THEN** 脚手架调用 `scaffoldProject` 时 `schema: "myapp"`，生成项目内 SQL 文件 `__SCHEMA__` 替换为 `myapp`

#### Scenario: Agent 不传递 --data-layer（默认 supabase）

- **WHEN** Agent 执行 `agentdock init --name test --template web-nextjs --json`（无 `--data-layer`）
- **THEN** 默认 `dataLayer = 'supabase'`，脚手架调用 `scaffoldProject` 时 `schema: "public"`，SQL 文件 `__SCHEMA__` 替换为 `public`

---

### Requirement: Template file copy from bundled assets

`agentdock init` MUST 从 CLI 包内置的模板资产中复制文件到目标目录。模板资产在 CLI 包构建时从 `templates/` 目录内联。

复制规则：

- 忽略 `node_modules/`、`.next/`、`.turbo/`、`dist/` 目录
- `package.json` 单独处理（见下一条需求）

#### Scenario: 模板文件被正确复制

- **WHEN** 执行 `agentdock init --name test-proj`
- **THEN** `test-proj/` 目录包含完整模板文件结构，包括 `src/`、`next.config.ts`、`tsconfig.json` 等，且不含 `node_modules/` 等忽略目录

---

### Requirement: Generated project package.json correctness

生成项目的 `package.json` MUST 满足以下条件：

- `name` 字段替换为用户输入的项目名
- `version` 重置为 `"0.1.0"`
- `private` 字段移除（生成项目不应继承模板的私有标记）
- 所有 `workspace:*` 依赖替换为 registry.json 中记录的已解析 semver 版本

#### Scenario: 生成 package.json 无 workspace:\* 引用

- **WHEN** 在 AgentDock monorepo 外执行生成项目的 `pnpm install`
- **THEN** 安装成功，无 `workspace:*` 无法解析的错误

#### Scenario: 生成 package.json name 字段正确

- **WHEN** 执行 `agentdock init --name my-saas`
- **THEN** 生成目录 `my-saas/package.json` 中 `name` 为 `"my-saas"`，`version` 为 `"0.1.0"`，不存在 `private` 字段
