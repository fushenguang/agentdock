---
roadmap-id: web-nextjs-builtin-suite
---

## Why

`add-payments-to-web-nextjs` 完成后，模板具备了完整的支付和订阅能力，但文档站 `apps/docs` 中 `web-nextjs` 部分的文档结构过于单薄：所有内容堆在一个 `index.mdx` 中，缺少数据层、支付、部署等专题页面，给使用者带来很高的认知负担。

同时，数据层（特别是自部署 Supabase）和支付（支付宝、微信支付）是国内 SaaS 开发者最关心的两个主题，现有文档完全空白。

本次变更的目标：

1. 将 `web-nextjs` 文档拆分为多个清晰子章节
2. 补齐自部署 Supabase 详细文档（优先，内容最多）
3. 补齐支付宝和微信支付文档（含技术架构图、时序图、安全重点、FAQs）
4. 为部署、Drizzle、Stripe 提供占位页
5. 为文档内 Mermaid 图表提供渲染支持

## What Changes

- **Mermaid 支持** — `apps/docs` 安装 `mermaid` 包，创建 `<Mermaid>` 客户端组件并注册到 MDX 组件树
- **文档重组（中文）** — `apps/docs/content/docs/zh/templates/web-nextjs/` 目录新增 8 个子页面，`index.mdx` 保留架构说明和快速开始，多余内容移至 `usage.mdx`
- **文档重组（英文）** — `apps/docs/content/docs/en/templates/web-nextjs/` 同步新增对应英文占位页
- **meta.json 更新** — 两个语言目录下更新导航顺序

## Capabilities

### New Capabilities

- `web-nextjs-docs-supabase`：自部署 Supabase 完整指南（Docker Compose、Auth、Storage、Edge Functions、Realtime、AI、MCP、备份）
- `web-nextjs-docs-alipay`：支付宝支付完整文档（架构图、时序图、配置、调试、安全、FAQs）
- `web-nextjs-docs-wechat-pay`：微信支付完整文档（架构图、时序图、配置、调试、安全、FAQs）

### Modified Capabilities

- `web-nextjs-docs`：`index.mdx` 精简，新增子页面导航结构
