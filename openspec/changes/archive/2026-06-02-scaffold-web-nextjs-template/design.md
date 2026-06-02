## Context

①②③④ 已全部归档。`packages/` 已有 `eslint-config`（含 4 条 Layer 2 error 规则）、`tsconfig`（strict 基线）、`openspec-docs-sync`。`templates/` 目录尚不存在（本 change 首次创建）。⑤ 是 MVP 最终 change，目标是提供**可运行的通用参考应用**地基——不是 CRUD 增删改查演示，而是验证"目录契约 + Layer 2 规则 + 数据层抽象"在真实 Next.js App Router 项目中日常开发不别扭。

技术栈：Next.js 16（App Router）、React 19、TypeScript 5.9 strict、Tailwind CSS、Supabase（`@supabase/ssr`）、`next-intl` i18n、Vitest（单元测试）。消费平台 `packages/eslint-config`/`packages/tsconfig`。

## Goals / Non-Goals

**Goals:**
- `templates/web-nextjs/` 四层目录契约（core/features/infra/_experiments）落地，Layer 2 规则从第一天 error 级强制。
- 参考 feature `features/hello/`（含 contract + index + 测试 + 页面），验证日常开发无摩擦。
- Supabase 仓储抽象（`core/repositories/` 接口 + `infra/db/` 实现），保留 Drizzle 扩展边界。
- 模板自带 `.github/copilot-instructions.md`、`AGENTS.md`、`openspec/`（自己的）。
- i18n 骨架（next-intl，英文主，中文占位）。

**Non-Goals:**
- 不实现 auth/用户中心/注册/支付/帮助页（Later: web-nextjs-builtin-suite）。
- 不实现 Drizzle（留接口边界）。
- 不做 shadcn 全套业务组件库（仅 Tailwind 基线 + 1 个 composed 组件示例）。
- 不做 Dokploy/Docker 部署全套。
- 不做 Tauri/Electron 等其他模板。
- 不做双语全量维护。

## Decisions

### D1. Next.js App Router，无 Pages Router 兼容
模板从零开始，直接采用 App Router（`src/app/`），不兼容 Pages Router。理由：Next.js 16 App Router 是官方推荐，团队需要 RSC + Server Actions + `@supabase/ssr` SSR 支持。
- 备选：pages/ + App Router 混用。否决——增加认知负担，与 Layer 2 目录契约产生摩擦。

### D2. 参考 feature 选 `hello`，最小自包含
参考 feature 命名 `hello`，提供一个问候接口（`greet(name: string): string`）。足够演示目录契约与 Layer 2 规则，不引入真实业务语义干扰。feature 包含：
- `__contract__.ts`：输入 `{ name: string }`，输出 `{ greeting: string }`
- `service.ts`：业务逻辑实现
- `index.ts`：只 export `greet` 函数（对应 contract 的 greet 方法）
- `hello.test.ts`：Vitest 单元测试
- 页面 `src/app/[locale]/hello/page.tsx`：Server Component 消费 feature，展示 i18n

### D3. Supabase 仓储抽象：接口与实现分离
`core/repositories/` 只含 TypeScript interface，`infra/db/` 持有 Supabase 实现。参考 feature 使用一个极简仓储（`IGreetingRepository`，保存/读取问候记录），验证整条数据链路（feature → repository interface → infra/db implementation）可通。
- Drizzle 扩展边界：`infra/db/schema.ts` 占位注释，接口设计不绑定 Supabase 类型（使用领域类型）。
- SSR 模式：使用 `@supabase/ssr` 的 `createServerClient`（Server Component）+ `createBrowserClient`（Client Component），通过环境变量 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`。

### D4. Layer 2 规则在模板内 error 级，与平台元仓库区分
模板 IS 一个生成的项目——平台 AGENTS.md 中的"meta-repo self-exception"不适用于 `templates/web-nextjs/`。模板内的 ESLint config 消费 `packages/eslint-config/features.js`，4 条架构不变量从第一天 error。
- 模板有自己的 `.eslintrc.json` 指向 `@agentdock/eslint-config/features`。

### D5. i18n：next-intl，路由前缀模式（/[locale]/...）
采用 `next-intl` 的 App Router 集成（`/[locale]/` 前缀，`middleware.ts` 处理语言检测重定向）。英文为主（`en.json` 真实内容），中文占位（`zh.json` value=key）。
- 参考 feature 页面演示 `useTranslations('hello')` 用法。
- i18n 不覆盖 API routes（API routes 不需要翻译）。

### D6. 测试框架：Vitest（模板内独立）
模板内使用 Vitest（与 Next.js 无缝集成，无需 jest-environment-jsdom 配置）。`vitest.config.ts` 独立于平台根。单元测试只覆盖 `features/` 与 `core/`（纯逻辑层），`infra/` 集成测试可选（MVP 不强制）。

### D7. 模板自带 openspec/：最小 config，不继承平台 openspec
模板的 `openspec/config.yaml` 独立，context 描述"你正在一个从 AgentDock web-nextjs 模板生成的项目中工作"，rules 继承 proposal Non-goals 要求。changes/、specs/ 空目录含 `.gitkeep`。

### D8. 模板无 Turborepo，单包简单结构
`templates/web-nextjs/` 本身是一个单 Next.js 项目（带自己的 `package.json`），不套 Turborepo（下游私有仓按需决定是否用 monorepo）。`pnpm` 作为包管理器写入 `package.json` engines 字段。

## Risks / Trade-offs

- [Layer 2 规则在 App Router 路由文件（`page.tsx`, `layout.tsx`）中误报] → ESLint config `features.js` 的 `files` 字段只针对 `src/features/**`，路由文件在 `src/app/` 不受约束，规避误报。
- [Supabase SSR 客户端在 Server Components 与 Client Components 用法不同导致混乱] → `infra/db/client.ts` 明确导出两个函数：`getServerClient()` 和 `getBrowserClient()`，JSDoc 注释说明使用场景。
- [参考 feature 过于简单，无法验证真实摩擦] → `hello` feature 演示完整链路（contract → service → infra → page → i18n → test），足以发现"规则是否别扭"；复杂业务逻辑放 Later。
- [next-intl 与 Next.js 16 兼容性] → next-intl 4.x 已支持 Next.js 15/16 App Router，使用官方推荐的 navigation API。

## Migration Plan

1. 在仓库根创建 `templates/web-nextjs/`，初始化 package.json（名 `@agentdock/template-web-nextjs`，version `0.1.0`）。
2. 建立四层目录骨架（core/features/infra/app），安装依赖（next、react、tailwind、supabase/ssr、next-intl、vitest）。
3. 配置 TypeScript（消费 `packages/tsconfig`）、ESLint（消费 `packages/eslint-config`）。
4. 实现参考 feature `hello` 完整链路（contract → service → index → test → page）。
5. 实现数据层（IGreetingRepository interface + Supabase 实现 + Drizzle 边界占位）。
6. 接入 i18n（next-intl middleware + en/zh messages + 页面演示）。
7. 写入模板自配置（.github/copilot-instructions.md、AGENTS.md、openspec/）。
8. 本地验证：`pnpm lint`、`pnpm test`、`pnpm build` 全部通过。
- 回滚：删除 `templates/web-nextjs/`（不影响平台任何其他部分）。

## Open Questions

（无——D1–D8 已覆盖关键决策，参考 feature 验证后如规则有摩擦，在 tasks 验收步骤修正 ESLint config files 字段）
