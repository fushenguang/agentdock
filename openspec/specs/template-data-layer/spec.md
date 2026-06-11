## Purpose

定义 web-nextjs 模板的数据层抽象边界，确保 feature 通过 core 仓储接口访问数据，infra 负责具体实现，并为未来替换实现保留扩展空间。

## Requirements

### Requirement: Supabase 仓储抽象

`templates/web-nextjs/src/` MUST 提供 Supabase 驱动的数据层，遵循仓储模式（Repository Pattern），`core/` 持有接口、`infra/db/` 持有实现，Layer 2 规则保证 features 不直接触碰实现层。

数据层结构：

- `src/core/repositories/`：仓储接口（纯 TypeScript interface，无框架依赖）。接口方法使用领域类型（来自 `src/core/types/`），不泄露 Supabase 类型。
- `src/infra/db/`：Supabase 实现——客户端初始化（`client.ts`，SSR 兼容）、每个接口的实现类。
- `src/infra/db/client.ts`：Supabase Server/Browser client 双模式（`@supabase/ssr` 模式），可在 Server Components 与 Client Components 消费。

Drizzle 扩展边界（**不实现，仅保留**）：

- `src/infra/db/schema.ts`（占位，标注"Drizzle 扩展点，需时实现"）
- `src/core/repositories/` 接口设计不绑定 Supabase 语义，允许未来替换实现层而无需改接口

#### Scenario: feature 通过仓储接口访问数据

- **WHEN** `features/hello/` 中调用 `IHelloRepository.findById(id)`
- **THEN** 请求走 `infra/db/` 实现，feature 不 import 任何 Supabase SDK

#### Scenario: Supabase 客户端在 Server Component 可用

- **WHEN** Next.js Server Component 中初始化 Supabase client
- **THEN** `infra/db/client.ts` 提供 SSR-safe 实现，不触发 "no window" 类运行时错误

#### Scenario: 未来替换 Supabase 实现不改接口层

- **WHEN** 用 Drizzle 实现替换 `infra/db/` 中的仓储实现
- **THEN** `core/repositories/` 接口无需修改，features 无感知

#### Scenario: features 直接 import Supabase SDK 被阻止

- **WHEN** `features/` 内文件 `import { createClient } from '@supabase/ssr'`
- **THEN** ESLint `no-direct-db-in-features` 报 error（仓储接口是唯一合法访问路径）

---

### Requirement: SQL 迁移文件 schema 参数化

`templates/web-nextjs/supabase/migrations/` 下所有自定义 schema 的表名 MUST 使用 `__SCHEMA__` 占位符而非裸表名，以支持自部署 Supabase 的自定义 schema 场景。

替换规则：

- `subscription_plans` → `__SCHEMA__.subscription_plans`
- `user_subscriptions` → `__SCHEMA__.user_subscriptions`
- `payments` → `__SCHEMA__.payments`
- `auth.users` **保持不变**（固定 schema）
- Policy 名称字符串和 Index 名称标识符 **保持不变**

CLI 脚手架在项目生成时 (`scaffoldProject`)，根据用户选择的 schema 名称通过 `replaceSchemaPlaceholder()` 递归替换所有 `.sql` 文件内的 `__SCHEMA__` 为实际值。

#### Scenario: 用户选择 schema=myapp 后 SQL 文件正确替换

- **WHEN** 用户通过 `agentdock init` 选择 supabase + schema `myapp`
- **THEN** 生成项目中所有 `.sql` 文件的 `__SCHEMA__` 被替换为 `myapp`

#### Scenario: 用户选择 drizzle 时 SQL 文件保持占位符

- **WHEN** 用户选择 drizzle 数据层
- **THEN** 生成项目中 `.sql` 文件的 `__SCHEMA__` 保持不变（用户手动替换或忽略）
