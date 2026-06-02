## ADDED Requirements

### Requirement: 四层目录契约
`templates/web-nextjs/src/` MUST 遵循四层目录契约，物理强制层间职责边界，Layer 2 规则在模板内从第一天 error 级生效。

目录结构：
- `src/core/`：只读稳定层——类型定义、仓储接口、领域逻辑（无框架依赖）。AI/Copilot 不得在此层直接写 DB 调用。
- `src/features/`：AI 主战场——每个 feature 子目录必须含 `__contract__.ts`、`index.ts` 公开边界、独立测试。不得跨 feature 直接 import，不得在此层直接调用 `infra/db`。
- `src/infra/`：需审批层——DB 客户端（Supabase）、第三方 SDK 初始化，只有 `core/repositories` 实现可消费。
- `src/features/_experiments/`：物理隔离沙盒——实验性 feature 放此处，不得被非 `_experiments` feature 引用。

Layer 2 ESLint 规则（来自 `packages/eslint-config`）在模板内 **error 级** 强制：
- `no-direct-db-in-features`：features/ 不得直接 import infra/db
- `require-feature-contract`：每个 feature 子目录必须有 `__contract__.ts`
- `no-cross-feature`：feature 之间不得直接 import
- `no-core-mutation`：core/ 不得被 features/infra/ 修改（只读约束）

#### Scenario: features 目录内缺少 __contract__.ts 触发 error
- **WHEN** `features/` 下某子目录缺少 `__contract__.ts`
- **THEN** ESLint `require-feature-contract` 报 error，`pnpm lint` 失败

#### Scenario: feature 直接 import infra/db 触发 error
- **WHEN** `features/` 内文件写 `import ... from '../../infra/db'`
- **THEN** ESLint `no-direct-db-in-features` 报 error

#### Scenario: 跨 feature 直接 import 触发 error
- **WHEN** `features/foo/index.ts` import `../bar/internal`（绕过 bar 的 index）
- **THEN** ESLint `no-cross-feature` 报 error

### Requirement: 1 个参考 feature
模板 MUST 提供 1 个最小、自包含的参考 feature（`src/features/hello/`），验证目录契约与 Layer 2 规则真实可用。

参考 feature MUST 含：
- `__contract__.ts`：声明 feature 的输入/输出契约（类型 + 描述）
- `index.ts`：公开 API 边界（只 export 契约内声明的内容）
- 至少 1 个测试文件（单元级）
- 1 个 Next.js App Router 页面（`app/hello/page.tsx`）消费此 feature

#### Scenario: 参考 feature 在日常开发中不别扭
- **WHEN** 开发者按契约添加新 export 到 `features/hello/index.ts`
- **THEN** 消费侧可直接 import，不触发 no-cross-feature 规则（index 是合法边界）

#### Scenario: 参考 feature 测试通过
- **WHEN** 运行 `pnpm test`（模板内）
- **THEN** `features/hello/` 的测试全部通过
