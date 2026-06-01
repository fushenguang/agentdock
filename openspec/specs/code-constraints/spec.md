## Purpose

定义共享代码约束基线（ESLint 与 TypeScript），通过统一配置包在模板与平台包中复用，确保约束可执行、可继承、可演进。

## Requirements

### Requirement: Shared ESLint config package
平台 MUST 提供 `packages/eslint-config`，作为所有模板（及平台包）的共享 ESLint 基线，内含**有牙齿**的架构规则。

该包 MUST 导出至少以下规则集：
- `no-direct-db-in-features`：`src/features/**` 文件中禁止直接 import 数据库客户端（如 Drizzle/Supabase client），应只经由 `src/core/repositories` 抽象访问。— **error**
- `require-feature-contract`：每个 `src/features/<name>/` 目录 MUST 含 `__contract__.ts`，缺失时报错。— **error**
- 其余规则（import 排序、TS 严格补充等）应先以 `warn` 引入，经真实项目验证后再升 `error`。

#### Scenario: feature 直连 DB 被拦截
- **WHEN** `src/features/foo/service.ts` 直接 import `@/infra/db/client`
- **THEN** ESLint 以 `error` 报告 `no-direct-db-in-features`，lint 检查失败

#### Scenario: feature 缺 contract 被告知
- **WHEN** `src/features/bar/` 目录下无 `__contract__.ts`
- **THEN** ESLint 以 `error` 报告 `require-feature-contract`

#### Scenario: 平台元仓库自身豁免
- **WHEN** 在 AgentDock 元仓库根执行 lint（无 `src/features/` 语义）
- **THEN** 这两条规则不触发误报（通过 `ignorePatterns` 或条件激活）

### Requirement: Shared TypeScript config package
平台 MUST 提供 `packages/tsconfig`，含 `strict` 基线配置，所有模板与平台包通过 `extends` 继承，无需重复声明 strict 选项。

#### Scenario: strict 基线被继承
- **WHEN** 某包的 `tsconfig.json` 含 `"extends": "@agentdock/tsconfig/base.json"`
- **THEN** `strict: true`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes` 等严格选项自动生效

#### Scenario: 不允许绕过 any
- **WHEN** 某文件写了 `// @ts-ignore` 却无解释注释
- **THEN** 共享 ESLint 规则（`@typescript-eslint/ban-ts-comment`）以 `error` 报告
