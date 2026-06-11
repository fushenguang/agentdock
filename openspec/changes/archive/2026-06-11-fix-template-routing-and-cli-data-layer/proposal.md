---
roadmap-id: web-nextjs-builtin-suite
---

## Why

`add-payments-to-web-nextjs` 验收过程中发现两个路由 Bug，同时 CLI 缺少数据层选择能力，SQL 迁移文件没有 schema 隔离机制。这三个问题需要一并修复，才能让模板在真实开发环境中稳定运行。

**Bug 1**：注册页（signup）的「立即登录」使用了 `/{locale}/login` 作为 `href`，而 `Link` 组件来自 `@/i18n/navigation`（会自动拼接 locale），导致跳转到 `/zh/zh/login` → 404。

**Bug 2**：首页 Hero 区域的「查看文档」按钮使用 `<Link href="/docs">`，同样是 i18n-aware Link，导致跳转到 `/{locale}/docs` → 404。文档站是独立服务（默认 `localhost:3001`），不在同一 Next.js 实例内。

**CLI 缺陷**：`agentdock init` 目前只选模板，没有数据层选择步骤。用户创建项目后不知道下一步该用 Supabase 还是 Drizzle。

**SQL schema 硬编码**：当前迁移 SQL 使用裸表名（`subscription_plans` 等），隐式依赖 `public` schema。自部署 Supabase 场景中用户可能需要自定义 schema，现有文件无法适应。

## What Changes

- **Bug fix** — `signup/page.tsx`：`href={`/${locale}/login`}` → `href="/login"`（i18n Link 自动处理 locale）
- **Bug fix + env var** — `hero.tsx`：`<Link href="/docs">` → `<a>` + `NEXT_PUBLIC_DOCS_URL` 环境变量（默认 `http://localhost:3001/docs`），并更新 `.env.example`
- **SQL schema 参数化** — `supabase/migrations/20250608_add_subscription_tables.sql`：所有裸表名替换为 `__SCHEMA__.tablename` 占位符
- **CLI 数据层选择**（human adapter）— 选完模板后新增两步：选数据层（supabase | drizzle），若选 supabase 则继续输入 schema 名称（默认 `public`）
- **CLI agent 模式** — `init` 命令增加 `--data-layer` 和 `--schema` 参数，`AgentAdapterOptions` 同步扩展
- **scaffold 替换逻辑** — 文件复制完成后，将目标目录所有 `.sql` 文件内的 `__SCHEMA__` 替换为用户指定的 schema 名称

## Capabilities

### Modified Capabilities

- `cli-init-flow`：新增 data layer + schema 交互步骤，agent 模式新增 `--data-layer` / `--schema` 参数
- `web-nextjs-template`：修复路由 Bug，支持 schema 参数化 SQL 迁移

### New Capabilities

无新 Capability，均为已有能力的修复与扩展。
