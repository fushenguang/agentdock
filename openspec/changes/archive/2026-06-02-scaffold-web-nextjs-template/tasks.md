## 1. 项目骨架

- [x] 1.1 创建 `templates/web-nextjs/`，初始化 `package.json`（name: `@agentdock/template-web-nextjs`，version: `0.1.0`，engines: pnpm ≥9，node ≥18）
- [x] 1.2 安装依赖：`next@16`、`react@19`、`react-dom@19`、`typescript`、`tailwindcss`、`@supabase/ssr`、`next-intl`、`vitest`、`@vitejs/plugin-react`
- [x] 1.3 配置 `tsconfig.json`（extends `@agentdock/tsconfig/base.json`，添加 Next.js paths 与 moduleResolution）
- [x] 1.4 配置 `tailwind.config.ts`（content: `src/**/*.{ts,tsx}`）
- [x] 1.5 配置 `.eslintrc.json`（extends `@agentdock/eslint-config/features`，覆盖 files 范围仅针对 `src/features/**`）
- [x] 1.6 配置 `vitest.config.ts`（environment: node，include: `src/**/*.test.ts`）
- [x] 1.7 配置 `next.config.ts`（启用 `next-intl` plugin）

## 2. 四层目录契约

- [x] 2.1 创建 `src/core/types/`（放领域类型，不依赖任何框架）
- [x] 2.2 创建 `src/core/repositories/`（放仓储 interface，无 Supabase 依赖）
- [x] 2.3 创建 `src/features/`（主战场，AI 编码区域）
- [x] 2.4 创建 `src/features/_experiments/`（实验沙盒，含 `.gitkeep`）
- [x] 2.5 创建 `src/infra/db/`（Supabase 实现层）
- [x] 2.6 创建 `src/app/[locale]/`（App Router，locale 路由前缀）
- [x] 2.7 确认 ESLint `no-direct-db-in-features` 规则在 `src/features/` 中 error 级生效（本地 `pnpm lint` 验证）

## 3. 参考 feature: hello

- [x] 3.1 创建 `src/features/hello/__contract__.ts`：声明输入 `{ name: string }`、输出 `{ greeting: string }` 的 TS 类型契约
- [x] 3.2 创建 `src/features/hello/service.ts`：实现 `greet(name: string): string`（纯函数，无副作用）
- [x] 3.3 创建 `src/features/hello/index.ts`：只 export `greet`（契约内声明的公开 API）
- [x] 3.4 创建 `src/features/hello/hello.test.ts`：Vitest 单元测试（测试 greet 返回正确问候、空字符串边界）
- [x] 3.5 创建 `src/app/[locale]/hello/page.tsx`：Server Component，调用 `features/hello`，展示 i18n 问候
- [x] 3.6 运行 `pnpm test`，确认 hello feature 测试全部通过

## 4. 数据层抽象

- [x] 4.1 创建 `src/core/types/greeting.ts`：`Greeting` 领域类型（`{ id: string; name: string; createdAt: string }`）
- [x] 4.2 创建 `src/core/repositories/IGreetingRepository.ts`：接口定义 `save(name: string): Promise<Greeting>` + `findRecent(): Promise<Greeting[]>`（返回领域类型，无 Supabase 类型）
- [x] 4.3 创建 `src/infra/db/client.ts`：导出 `getServerClient()`（`createServerClient`，用于 Server Components）和 `getBrowserClient()`（`createBrowserClient`，用于 Client Components），从环境变量读 URL/ANON_KEY，含 JSDoc 使用说明
- [x] 4.4 创建 `src/infra/db/schema.ts`：Drizzle 扩展边界占位（注释说明"Drizzle 扩展点，Supabase MVP 阶段不实现"）
- [x] 4.5 创建 `src/infra/db/SupabaseGreetingRepository.ts`：实现 `IGreetingRepository`，使用 `getServerClient()` 操作 Supabase `greetings` 表
- [x] 4.6 在 hello page 演示通过仓储保存/读取问候记录（可选，如 Supabase 未配置则降级展示静态内容）

## 5. i18n 骨架

- [x] 5.1 创建 `messages/en.json`（含 `hello.title`、`hello.greeting` 真实英文内容）
- [x] 5.2 创建 `messages/zh.json`（同 key，value=key 占位）
- [x] 5.3 创建 `src/i18n/request.ts`（next-intl 的 `getRequestConfig`，加载对应 locale 消息）
- [x] 5.4 创建 `middleware.ts`（next-intl 路由中间件，支持 `/en` 与 `/zh` 前缀，默认重定向到 `/en`）
- [x] 5.5 在 hello page 使用 `getTranslations('hello')` 展示翻译内容
- [x] 5.6 验证 `/en/hello` 正常渲染、`/zh/hello` 不报错（显示占位 key）

## 6. 模板自配置

- [x] 6.1 创建 `.github/copilot-instructions.md`：声明四层目录契约、Layer 2 error 规则（4条）、Conventional Commits、pnpm only、TypeScript strict
- [x] 6.2 创建 `AGENTS.md`：声明 AI 自主边界（可自主：lint/test/build/创建文件；需确认：push、删除文件、新增顶层目录、新增 dependencies）
- [x] 6.3 创建 `openspec/config.yaml`（context: 下游项目说明 + 技术栈；rules: proposal 必须含 Non-goals）
- [x] 6.4 创建 `openspec/changes/.gitkeep`、`openspec/specs/.gitkeep`（空目录占位）
- [x] 6.5 创建 `openspec/changes/archive/.gitkeep`

## 7. 验收

- [x] 7.1 `pnpm lint`：4 条 Layer 2 error 规则在 `src/features/` 生效，`src/app/` 不误报
- [x] 7.2 `pnpm test`：hello feature 测试全部通过
- [x] 7.3 `pnpm build`：Next.js 构建成功（允许 Supabase 未配置时降级静态内容）
- [x] 7.4 `pnpm check-types`（模板内 tsc）：strict mode 无 error
- [x] 7.5 访问 `/en/hello`：页面渲染问候内容、i18n 正常
- [x] 7.6 人工确认目录契约与 Layer 2 规则"日常开发不别扭"（通过参考 feature 完整开发流验证）
- [x] 7.7 `openspec validate scaffold-web-nextjs-template` 通过
- [x] 7.8 自检：未触及 Non-goals（无 auth / Drizzle 实现 / 全套 shadcn / 双语 / Docker）
- [x] 7.9 ESLint 显式忽略构建产物（至少 `.next/**`），避免对生成文件做 lint
- [x] 7.10 验证 `pnpm build && pnpm lint` 连续执行均通过（确保 build 后 lint 不假红）
