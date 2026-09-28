---
roadmap-id: web-tanstackstart-template
---

## Why

AgentDock 目前只有 Next.js 这一条全栈 Web 路线。企业内网用户需要一条以 TanStack Start 为应用框架、以原生工具链降低验证延迟、并以 Astryx/StyleX 提供设计系统约束的独立 Web 模板。该模板同时需要一个默认零外部依赖的 SQLite 数据层，以及可平滑切换到 Supabase Postgres 的仓储实现。

## What Changes

- 新增独立的 `templates/web-tanstackstart/` 单包应用模板，不采用 monorepo/turborepo。
- 技术栈采用 pnpm 12、Node 22.13+、TypeScript 7、Vite 8、React 19、TanStack Start/Router、Oxlint、Oxfmt、Astryx、StyleX、Drizzle ORM。
- 提供 `core` / `features` / `infra` 四层契约、一个可运行的 `hello` feature，以及对应的 SQLite 全链路。
- SQLite 使用 `better-sqlite3`，作为默认数据源；Supabase 作为 Drizzle Postgres 的第二仓储实现，通过环境变量切换。
- Astryx 使用预编译组件样式，同时正式接入应用级 StyleX 编译链。
- 内置 Vitest、Drizzle Kit、`tsr generate` 与统一的 `pnpm check` 验证入口。
- 模板自带 `openspec/`、`AGENTS.md`、Copilot instructions、`DESIGN.md` 以及经许可兼容的 Agent Skills。
- CLI 注册表与 `init` 流程支持模板感知的数据层选择：新模板使用 `sqlite`（默认）/ `supabase`，不再显示固定的 Supabase/Drizzle 二选一。
- CLI 脚手架保留模板显式声明的 `packageManager`，避免本机旧版 pnpm 覆盖模板要求的 pnpm 12。
- 新增模板文档、changeset 和 Node 24 + pnpm 12 的独立 CI 验证门。

## Capabilities

### New Capabilities

- `web-tanstackstart-template`: 独立 TanStack Start 模板的目录契约、技术栈、StyleX/Astryx、测试、验证和 Agent Skills。
- `web-tanstackstart-data-layer`: Drizzle SQLite 默认实现与 Supabase Postgres 辅助实现。
- `web-tanstackstart-docs`: 平台文档站中的模板使用、数据层、样式与验证指南。

### Modified Capabilities

- `cli-template-registry`: registry 暴露模板包管理器与数据层能力，脚手架保留模板显式包管理器。
- `cli-init-command`: 人类与 Agent 模式支持模板感知的 `sqlite` / `supabase` 数据层选择。
- `ci-gates`: 为 web-tanstackstart 增加可执行的安装、格式、lint、类型、测试和构建门。

## Impact

- 新增 `templates/web-tanstackstart/` 及 `pnpm-lock.yaml`。
- 修改 `packages/cli` 的 registry schema、生成脚本、human/agent adapter、scaffold 逻辑和测试。
- 修改 `apps/docs` 的模板导航、中英文模板文档。
- 修改 `roadmap.yaml`、changeset、GitHub Actions 验证 workflow。
- 不修改 `templates/web-nextjs` 的运行时代码。
- 新增运行时依赖：TanStack Start/Router、Astryx、StyleX、Drizzle ORM、better-sqlite3、postgres。
- 新增开发依赖：TypeScript 7、Vite 8、Oxlint、Oxfmt、Vitest、Drizzle Kit 等。

## Non-goals

- 不实现 web-nextjs 的 auth、i18n、支付、订阅和管理后台功能。
- 不把 web-tanstackstart 改造成 monorepo，也不内置独立 Fumadocs 应用。
- 不提供 Vercel、Netlify、Cloudflare 等无状态平台的 SQLite 持久化方案。
- 不实现 Supabase Auth、Storage 或 Realtime；首版只把 Supabase 作为 Drizzle Postgres 数据源。
- 不重构现有 web-nextjs 模板。
- 不复制来源不明或许可证不兼容的 Agent Skill；第三方 skill 必须保留来源和许可证据。
