## Context

- 分支：`docs/web-nextjs-restructure`
- 执行者：Cline + DeepSeek v4 Pro
- 文档目标受众：使用 web-nextjs 模板的开发者；支付和自部署 Supabase 章节假设读者是新手

涉及目录：
- `apps/docs/` — Fumadocs 文档站（fumadocs-core 16.9.3，fumadocs-mdx 15.0.10）
- `apps/docs/content/docs/zh/templates/web-nextjs/` — 中文文档主目录
- `apps/docs/content/docs/en/templates/web-nextjs/` — 英文文档（占位）

## Goals / Non-Goals

**Goals:**
- Fumadocs 内增加 Mermaid 图表渲染支持（客户端组件方式）
- 中文文档拆分为 8 个子页面 + 更新 meta.json
- 英文同步占位
- 自部署 Supabase、支付宝、微信支付文档内容详细、完整

**Non-Goals:**
- 不修改 `apps/docs` 的框架配置（不改 next.config.ts 等）
- 不改已有 `i18n-navigation.mdx`
- 不写 Stripe 和 Drizzle 的正文内容（仅占位）
- 不写英文正文内容（仅标题和简短 coming soon 声明）

## Decisions

### D1. Mermaid 渲染方案：客户端 React 组件

Fumadocs 不内置 Mermaid 支持。`rehype-mermaid` 需要 Playwright（重型依赖，不适合 CI）。
采用客户端 React 组件方案：

1. 安装 `mermaid`（`pnpm add mermaid --filter @agentdock/docs`）
2. 创建 `apps/docs/components/mermaid.tsx`（`'use client'` 组件，使用 `useEffect` + `mermaid.render()`）
3. 在 `apps/docs/components/mdx.tsx` 的 `getMDXComponents` 中注册：`Mermaid: dynamic(() => import('./mermaid'), { ssr: false })`
4. 在 MDX 文件中使用：`<Mermaid chart={\`...\`} />`

`mermaid.tsx` 实现要点：
- 使用 `useRef` 获取容器 DOM
- 使用 `useEffect` 调用 `mermaid.initialize({ theme: 'neutral', startOnLoad: false })` + `mermaid.render(id, chart)`
- 将 SVG 注入容器（`innerHTML`）
- 使用 `useId()` 生成唯一 id 避免 SSR hydration 冲突，将冒号替换为空字符（`:` → `''`）

### D2. 文档目录结构

```
apps/docs/content/docs/zh/templates/web-nextjs/
  index.mdx              (保留，精简：移除「开发工作流」、「配置」、「迁移指南」、「故障排查」章节，移至对应子页面)
  usage.mdx              (NEW) 模板开发和使用（含 CLI 使用、本地设置、验证命令、配置、迁移指南）
  deployment.mdx         (NEW) 部署（占位）
  supabase.mdx           (NEW) 数据层：Supabase（详细，自部署优先）
  drizzle.mdx            (NEW) 数据层：Drizzle（占位）
  alipay.mdx             (NEW) 支付宝支付（详细）
  wechat-pay.mdx         (NEW) 微信支付（详细）
  stripe.mdx             (NEW) Stripe 支付（占位）
  troubleshooting.mdx    (NEW) 故障排查（从 index.mdx 迁移 + 扩充支付相关问题）
  i18n-navigation.mdx    (保留，不改动)
  meta.json              (UPDATE)
```

英文目录新增同名 `.mdx` 文件（占位），不新增 meta.json（英文 meta.json 与中文保持一致结构）。

### D3. meta.json 导航顺序

```json
{
  "title": "web-nextjs",
  "pages": [
    "index",
    "usage",
    "deployment",
    "supabase",
    "drizzle",
    "alipay",
    "wechat-pay",
    "stripe",
    "troubleshooting",
    "i18n-navigation"
  ]
}
```

### D4. 自部署 Supabase 文档（`supabase.mdx`）内容结构

自部署 Supabase 是本次最重量级的文档，内容必须详细、可操作。章节结构：

```
# 数据层：Supabase

## Supabase Cloud vs 自部署
## 快速开始：Docker Compose 部署
  - 前置条件
  - 下载 Docker Compose 配置
  - 关键环境变量说明（含生成命令）
  - 启动服务
  - 验证
## 身份认证配置
  ### 邮件发送配置（SMTP）
  ### 第三方登录（OAuth）
    - GitHub
    - Google
    - 微信登录（微信开放平台）
  ### 国内短信验证码
    - 阿里云短信（SMS）
    - 腾讯云短信（SMS）
## 数据表与 RLS 安全
  - 在 web-nextjs 中执行迁移
  - 自定义 schema（__SCHEMA__ 替换说明）
  - RLS 策略最佳实践
## 文件存储（Storage）
  - 配置 Storage
  - 在 web-nextjs 中使用
## 数据备份
  - pg_dump 方式
  - Docker 卷备份
  - 自动化定时备份（cron 示例）
## Realtime
  - 启用 Realtime
  - 在 Next.js 中使用 Supabase Realtime
## Edge Functions
  - 自部署 Edge Runtime 说明
  - 示例：定时任务
## AI 功能（pgvector）
  - 启用 pgvector 扩展
  - 向量存储与检索示例
## MCP Server
  - Supabase MCP Server 是什么
  - 在 VS Code Copilot / Cursor 中配置使用
## 安全注意事项
## 常见问题（FAQ）
```

参考链接：https://supabase.com/docs/guides/self-hosting

### D5. 支付宝文档（`alipay.mdx`）内容结构

```
# 支付宝支付

## 技术架构图（Mermaid flowchart）
## 支付时序图（Mermaid sequenceDiagram）
## 准备工作（步骤详细）
## 环境变量配置
## 开发环境调试（含内网穿透）
## 生产环境配置
## 安全注意事项（重点）
## 常见问题（FAQs）
```

每个操作步骤附官方文档链接（https://opendocs.alipay.com）。

### D6. 微信支付文档（`wechat-pay.mdx`）内容结构

```
# 微信支付

## 技术架构图（Mermaid flowchart）
## 支付时序图（Mermaid sequenceDiagram，含前端轮询）
## 准备工作（步骤详细）
## 环境变量配置
## 开发环境调试（含内网穿透，说明无官方沙箱）
## 生产环境配置
## 安全注意事项（重点）
## 常见问题（FAQs）
```

每个操作步骤附官方文档链接（https://pay.weixin.qq.com/doc）。

### D7. index.mdx 精简范围

**保留**：标题、描述、「这是什么？」「它解决了什么问题？」「为什么选择这个模板？」、技术栈表格、架构说明（目录树 + 四层数据流 + Layer 2 约束）、已完成功能列表。

**移除**（移至子页面）：「开发工作流」、「配置」、「非目标」、「迁移指南」、「故障排查」。

index.mdx 末尾添加子页面导航引导段落：

```md
## 接下来

- [模板开发和使用 →](./usage)
- [部署 →](./deployment)
- [数据层：Supabase →](./supabase)
- [数据层：Drizzle →](./drizzle)
- [支付宝支付 →](./alipay)
- [微信支付 →](./wechat-pay)
- [Stripe 支付 →](./stripe)
- [故障排查 →](./troubleshooting)
```
