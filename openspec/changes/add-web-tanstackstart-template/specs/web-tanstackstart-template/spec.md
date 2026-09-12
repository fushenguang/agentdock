## Purpose

定义独立的 web-tanstackstart 模板，使企业内网项目可以直接获得 TanStack Start、Astryx/StyleX、原生工具链和 Agent Skills 组成的可执行开发闭环。

## ADDED Requirements

### Requirement: 独立单包应用结构

`templates/web-tanstackstart/` MUST 是独立单包应用，不得包含 `apps/`、`packages/`、Turborepo 配置或多个 workspace package。模板 MUST 保留 `src/core/`、`src/features/`、`src/infra/` 和 `src/routes/` 四层职责边界。

#### Scenario: 模板不是 monorepo

- **WHEN** 检查 `templates/web-tanstackstart/`
- **THEN** 不存在 `apps/`、`packages/`、`turbo.json` 或 workspace package glob，且依赖和脚本全部位于根 `package.json`

#### Scenario: 参考 feature 可运行

- **WHEN** 开发者运行模板并访问 `/hello`
- **THEN** 页面通过 `features/hello` 的公开边界完成一次可观察行为，且 feature 包含 `__contract__.ts`、`index.ts` 和测试

### Requirement: 固定工具链与运行时基线

模板 MUST 声明并使用 pnpm 12、Node `>=22.13.0`、TypeScript 7、Vite 8、React 19、TanStack Start/Router、Oxlint、Oxfmt、Vitest 和 Drizzle Kit。模板 MUST 在 `pnpm-workspace.yaml` 中设置 `packages: []`，并使用 `allowBuilds` 显式允许原生依赖构建。

#### Scenario: pnpm 12 安装成功

- **WHEN** 在模板根目录使用 pnpm 12 执行 `pnpm install --frozen-lockfile`
- **THEN** 安装 exit 0，且原生依赖不需要交互式批准构建

#### Scenario: 生成项目保留模板声明的 pnpm 版本

- **WHEN** 使用 CLI 从该模板生成项目
- **THEN** 生成项目的 `package.json` 保留模板声明的 pnpm 12 `packageManager`，不会被执行者本机旧版 pnpm 覆盖

### Requirement: TanStack Start 与 StyleX 集成

模板 MUST 使用 TanStack Start 的 Vite 插件和文件路由，并 MUST 配置 Astryx/StyleX 构建链。Astryx 组件样式 MUST 通过官方层叠顺序加载，应用级 `stylex.create` MUST 可由构建流程编译。

#### Scenario: 生产构建包含 StyleX 产物

- **WHEN** 执行 `pnpm build`
- **THEN** Vite 同时完成客户端与 SSR 构建，构建结果包含 Astryx 组件样式和应用 StyleX 样式

#### Scenario: 类型检查使用最新路由类型

- **WHEN** 路由文件新增或修改后执行 `pnpm check-types`
- **THEN** 先生成 `routeTree.gen.ts` 再执行 TypeScript 7 检查，且无缺失路由类型错误

### Requirement: 统一验证入口

模板 MUST 提供 `pnpm check`，依次或等价地执行生成路由、类型检查、Oxlint、Oxfmt 检查、测试和生产构建。任何一步失败时 `pnpm check` MUST 以非零状态退出。

#### Scenario: 干净模板通过全部门禁

- **WHEN** 在未修改的模板根目录执行 `pnpm check`
- **THEN** 类型、lint、格式、测试和构建全部通过，exit 0

#### Scenario: 架构违规阻断检查

- **WHEN** feature 直接 import `infra/db`、跨 feature import，或 feature 缺少 `__contract__.ts`
- **THEN** `pnpm lint` 或 `pnpm check` 以非零状态退出并指出违规文件和规则

### Requirement: 模板自配置与 Agent Skills

模板 MUST 提供 `AGENTS.md`、Copilot instructions、`DESIGN.md`、模板内 `openspec/` 和 Agent Skills。第三方 Skill MUST 保留来源、版本与许可证证据；不得引入与 React 19、Vite 8、TypeScript 7 或 pnpm 12 冲突的 Skill。

#### Scenario: Agent 可发现模板边界

- **WHEN** 新项目中的 AI Agent 读取 `AGENTS.md` 与 `.github/copilot-instructions.md`
- **THEN** 能明确知道可自主执行的命令、需要确认的操作、目录契约、验证入口和 UI 设计约束

#### Scenario: 第三方 Skill 可追溯

- **WHEN** 审计模板中的第三方 Skill
- **THEN** 每个 Skill 都有来源、版本或提交标识及兼容许可证说明
