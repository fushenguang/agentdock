## ADDED Requirements

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
