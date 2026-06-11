## 0. Git 分支准备

- [x] 0. `git checkout main && git pull`
- [x] 0. `git checkout -b docs/web-nextjs-restructure`

## 1. Mermaid 组件：安装依赖

- [x] 1. 在 `apps/docs` 目录下安装 mermaid：`pnpm add mermaid --filter @agentdock/docs`

## 2. Mermaid 组件：创建组件文件

文件：`apps/docs/components/mermaid.tsx`

- [x] 2. 创建客户端组件，完整实现：

  ```tsx
  'use client'

  import { useEffect, useId, useRef } from 'react'

  interface MermaidProps {
    chart: string
  }

  export default function Mermaid({ chart }: MermaidProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const rawId = useId()
    const id = `mermaid-${rawId.replace(/:/g, '')}`

    useEffect(() => {
      let cancelled = false

      async function render() {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({ startOnLoad: false, theme: 'neutral', fontFamily: 'inherit' })

        if (cancelled || !containerRef.current) return

        try {
          const { svg } = await mermaid.render(id, chart)
          if (!cancelled && containerRef.current) {
            containerRef.current.innerHTML = svg
          }
        } catch (err) {
          if (!cancelled && containerRef.current) {
            containerRef.current.innerHTML = `<pre style="color:red">${String(err)}</pre>`
          }
        }
      }

      render()
      return () => {
        cancelled = true
      }
    }, [chart, id])

    return <div ref={containerRef} className="my-4 overflow-x-auto" />
  }
  ```

## 3. Mermaid 组件：注册到 MDX

文件：`apps/docs/components/mdx.tsx`

- [x] 3. 在文件顶部新增 import：
  ```ts
  import dynamic from 'next/dynamic'
  const Mermaid = dynamic(() => import('./mermaid'), { ssr: false })
  ```
- [x] 3. 在 `getMDXComponents` 的返回对象中新增 `Mermaid`：
  ```ts
  return {
    ...defaultMdxComponents,
    ...components,
    Mermaid,
  } satisfies MDXComponents
  ```

## 4. 创建/更新 zh meta.json

文件：`apps/docs/content/docs/zh/templates/web-nextjs/meta.json`

- [x] 4. 若文件不存在则创建，内容为：
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

## 5. 精简 zh index.mdx

文件：`apps/docs/content/docs/zh/templates/web-nextjs/index.mdx`

- [x] 5. 从现有 `index.mdx` 中**移除**以下章节（内容将在后续任务中写入对应子页面）：
  - `## 开发工作流`（及其所有子节）
  - `## 配置`（及其所有子节）
  - `## 非目标（有意排除）`
  - `## 迁移指南`（及其所有子节）
  - `## 故障排查`（及其所有子节）
- [x] 5. 在文件末尾追加子页面导航引导段落：

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

## 6. 创建 zh usage.mdx

文件：`apps/docs/content/docs/zh/templates/web-nextjs/usage.mdx`

- [x] 6. frontmatter：
  ```yaml
  ---
  title: 模板开发和使用
  description: 如何使用 AgentDock CLI 创建 web-nextjs 项目，以及本地开发、配置和迁移指南。
  ---
  ```
- [x] 6. 内容包含以下章节（从 index.mdx 移出的内容 + 补充 CLI 使用说明）：
  - `## 使用 CLI 创建项目`：说明 `npx @cogito.ai/cli init` 交互步骤（项目名 → 模板选择 → 数据层选择（supabase/drizzle）→ Supabase schema 名称（默认 public）→ 包管理器 → 确认），以及 agent 模式参数（`--name`、`--template`、`--data-layer`、`--schema`）
  - `## 本地设置`：从 index.mdx「开发工作流 > 本地设置」迁移，补充 `NEXT_PUBLIC_DOCS_URL` 说明
  - `## 验证命令`：从 index.mdx「开发工作流 > 验证命令」迁移
  - `## 配置`：从 index.mdx「配置」章节迁移（Supabase 设置、添加新语言区域、添加新功能）
  - `## 非目标（有意排除）`：从 index.mdx 迁移
  - `## 迁移指南`：从 index.mdx 迁移

## 7. 创建 zh deployment.mdx（占位）

文件：`apps/docs/content/docs/zh/templates/web-nextjs/deployment.mdx`

- [x] 7. 内容：

  ```mdx
  ---
  title: 部署
  description: 将 web-nextjs 项目部署到生产环境。
  ---

  # 部署

  > 🚧 本章节正在建设中，将涵盖通过 AgentDock CLI 一键部署到 Dokploy 自托管平台的完整流程。

  ## 即将包含

  - 通过 AgentDock CLI 部署到 Dokploy
  - 环境变量配置
  - 自定义域名与 HTTPS
  - 生产环境 Supabase 配置
  ```

## 8. 创建 zh supabase.mdx（详细内容）

文件：`apps/docs/content/docs/zh/templates/web-nextjs/supabase.mdx`

- [x] 8. frontmatter：

  ```yaml
  ---
  title: 数据层：Supabase
  description: 在 web-nextjs 中使用 Supabase，包括自部署（Docker Compose）完整配置指南。
  ---
  ```

- [x] 8. 按以下大纲编写完整内容，每个操作步骤须具体可执行，附命令和配置示例：

  **## Supabase Cloud vs 自部署**
  对比表格：云端（快速上手、免费额度、有存储限制、数据在第三方）vs 自部署（数据掌控、无限制、需要 Docker 和服务器）。建议：开发用 Cloud，生产推荐自部署。

  **## 快速开始：Docker Compose 自部署**
  - 前置条件：已安装 Docker（≥20.10）和 Docker Compose（≥2.0），服务器开放端口 8000、54321、5432
  - 步骤 1：克隆官方 docker-compose 配置：
    ```bash
    git clone --depth 1 https://github.com/supabase/supabase
    cd supabase/docker
    cp .env.example .env
    ```
  - 步骤 2：关键环境变量说明（`POSTGRES_PASSWORD`、`JWT_SECRET`、`ANON_KEY`、`SERVICE_ROLE_KEY` 的作用，以及生成方式）：
    ```bash
    # 生成 JWT_SECRET（至少 32 位随机字符串）
    openssl rand -base64 32
    # ANON_KEY 和 SERVICE_ROLE_KEY 使用官方生成器
    # 参考：https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
    ```
  - 步骤 3：启动所有服务：`docker compose up -d`
  - 步骤 4：验证：访问 `http://localhost:8000`（Supabase Studio），使用 `.env` 中的 `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` 登录
  - 参考链接：https://supabase.com/docs/guides/self-hosting/docker

  **## 身份认证配置**

  **### 邮件发送配置（SMTP）**
  - 说明默认 Inbucket（开发用）和生产 SMTP 的区别
  - `.env` 中 SMTP 字段（`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_SENDER_NAME`）
  - 推荐国内服务：阿里云邮件推送（DirectMail）、腾讯云 SES、Resend
  - 参考：https://supabase.com/docs/guides/self-hosting/docker#smtp

  **### 第三方登录（OAuth）**
  - GitHub OAuth 配置步骤：创建 GitHub OAuth App（Settings → Developer settings → OAuth Apps）→ 回调 URL 填 `http://你的域名:8000/auth/v1/callback` → 将 Client ID/Secret 填入 Supabase Dashboard（Authentication → Providers → GitHub）
  - Google OAuth 配置步骤：Google Cloud Console → API 和服务 → 凭据 → 创建 OAuth 2.0 客户端 ID → 回调 URL → 填入 Supabase Dashboard
  - 微信登录配置：微信开放平台（https://open.weixin.qq.com）申请网站应用 → 获取 AppID/AppSecret → Supabase 目前不内置微信 OAuth，需通过 Edge Function 实现自定义 OAuth provider，或使用第三方 Auth 服务（如 Authing、Casdoor）做中间层

  **### 国内短信验证码**

  **#### 阿里云短信（Aliyun SMS）**
  - 开通步骤：登录阿里云控制台 → 短信服务 → 申请签名（需营业执照） → 申请模板
  - 与 Supabase 集成方式：Supabase Auth 支持自定义 SMS 提供商，通过 Edge Function 作为中间层调用阿里云 SMS API
  - 配置位置：Dashboard → Authentication → SMS Providers → 选择「Custom」→ 填入 Edge Function URL
  - 参考：https://supabase.com/docs/guides/auth/phone-login

  **#### 腾讯云短信（Tencent SMS）**
  - 开通步骤：腾讯云控制台 → 短信 → 创建应用 → 申请签名和模板
  - 集成方式同阿里云（Edge Function 中间层）

  **## 数据表与 RLS 安全**
  - 执行迁移：将 `supabase/migrations/` 目录下的 SQL 文件在 Supabase Studio 的 SQL Editor 中逐一执行（Dashboard → SQL Editor → 粘贴内容 → Run）
  - **自定义 schema 说明**：`web-nextjs` 模板的 SQL 文件使用 `__SCHEMA__` 占位符。通过 CLI `--schema` 参数创建项目时会自动替换。手动替换：全局搜索替换 `__SCHEMA__` 为你的 schema 名称（如 `myapp`），再执行 SQL
  - RLS 最佳实践：service_role key 可绕过 RLS（仅在服务端 Route Handler 中使用），anon/authenticated key 必须遵守 RLS 策略；每张表建表后立即 `ALTER TABLE xxx ENABLE ROW LEVEL SECURITY`

  **## 文件存储（Storage）**
  - 自部署 Storage 支持本地文件系统（`file`）或 S3 兼容存储（如 MinIO）
  - `.env` 中配置 `STORAGE_BACKEND=file`（本地）或 `STORAGE_BACKEND=s3`（MinIO/S3）
  - 在 web-nextjs 中上传文件示例（Server Action 中使用 Supabase Storage SDK）
  - 参考：https://supabase.com/docs/guides/storage/self-hosting

  **## 数据备份**
  - `pg_dump` 方式（最通用，推荐）：

    ```bash
    # 备份（在宿主机执行）
    docker exec -t supabase-db pg_dump -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql

    # 恢复
    docker exec -i supabase-db psql -U postgres -d postgres < backup_20250101_000000.sql
    ```

  - Docker volume 备份：直接备份 Docker volume 目录（`/var/lib/docker/volumes/supabase_db_data`）
  - 自动化定时备份（cron 示例，每天凌晨 3 点）：
    ```bash
    0 3 * * * docker exec -t supabase-db pg_dump -U postgres -d postgres > /backup/db_$(date +\%Y\%m\%d).sql
    ```

  **## Realtime**
  - 自部署 Realtime 已包含在 Docker Compose 中（`realtime` 服务）
  - 启用表的 Realtime：Dashboard → Database → Replication → 勾选对应表
  - 在 Next.js 客户端组件中订阅示例：
    ```ts
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Change received!', payload)
        },
      )
      .subscribe()
    ```
  - 参考：https://supabase.com/docs/guides/realtime

  **## Edge Functions**
  - 自部署使用 `deno` 运行时（`edge-runtime` 服务，已在 Docker Compose 中）
  - 函数目录：`supabase/docker/volumes/functions/`
  - 本地开发：`supabase functions serve <function-name>`
  - 部署到自部署实例：将函数文件放入 `volumes/functions/` 目录后重启 `edge-runtime` 容器
  - 参考：https://supabase.com/docs/guides/functions/self-hosting

  **## AI 功能（pgvector）**
  - 启用 pgvector 扩展：在 SQL Editor 中执行：
    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;
    ```
  - 创建向量列示例：
    ```sql
    ALTER TABLE documents ADD COLUMN embedding vector(1536);
    CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
    ```
  - 在 Next.js Server Action 中结合 OpenAI 进行语义检索示例（生成 embedding → 存储 → 相似度查询）
  - 参考：https://supabase.com/docs/guides/ai/vector-columns

  **## MCP Server**
  - Supabase MCP Server 让 AI 编程助手（GitHub Copilot、Cursor 等）可以直接操作 Supabase，读写数据库、管理表结构
  - 安装：`npx @supabase/mcp-server-supabase@latest`
  - 在 VS Code + GitHub Copilot（`.vscode/mcp.json`）中配置：
    ```json
    {
      "servers": {
        "supabase": {
          "command": "npx",
          "args": [
            "-y",
            "@supabase/mcp-server-supabase@latest",
            "--supabase-url",
            "http://localhost:8000",
            "--supabase-key",
            "<your-service-role-key>"
          ]
        }
      }
    }
    ```
  - 在 Cursor（`~/.cursor/mcp.json`）中配置方式相同
  - 参考：https://supabase.com/docs/guides/getting-started/mcp

  **## 安全注意事项**
  - 生产环境必须修改的默认值清单：`POSTGRES_PASSWORD`、`JWT_SECRET`、`ANON_KEY`、`SERVICE_ROLE_KEY`、`DASHBOARD_USERNAME`、`DASHBOARD_PASSWORD`（所有默认值均不安全）
  - `SERVICE_ROLE_KEY` 绝不能出现在客户端代码中（不能以 `NEXT_PUBLIC_` 开头）
  - 建议在 Supabase 前使用反向代理（Nginx/Traefik）做 SSL 终止，不要直接暴露 8000 端口
  - 定期检查 Docker 镜像更新（`docker compose pull && docker compose up -d`）

  **## 常见问题（FAQ）**
  - Q: 自部署后收不到邮件？→ 检查 SMTP 配置，使用 Inbucket (`localhost:54324`) 调试
  - Q: Studio 无法访问？→ 检查 `http://localhost:8000` 是否通，检查 Docker 端口映射
  - Q: RLS 导致查询返回空？→ 在 Studio 中检查 policy 定义，或临时用 service_role key 测试
  - Q: `auth.users` 和自定义表如何关联？→ 使用 `REFERENCES auth.users(id) ON DELETE CASCADE`
  - Q: 自部署和 Cloud 的 SDK 用法有区别吗？→ 无区别，只需将 URL 和 key 换为自部署地址即可

## 9. 创建 zh drizzle.mdx（占位）

文件：`apps/docs/content/docs/zh/templates/web-nextjs/drizzle.mdx`

- [x] 9. 内容：

  ```mdx
  ---
  title: 数据层：Drizzle
  description: 在 web-nextjs 中使用 Drizzle ORM 进行数据库操作。
  ---

  # 数据层：Drizzle

  > 🚧 本章节正在建设中。

  ## 即将包含

  - Drizzle ORM 配置（PostgreSQL / SQLite）
  - Schema 定义与迁移
  - 在 Server Actions 中使用 Drizzle
  - 类型安全查询示例
  ```

## 10. 创建 zh alipay.mdx（详细内容）

文件：`apps/docs/content/docs/zh/templates/web-nextjs/alipay.mdx`

- [x] 10. frontmatter：

  ```yaml
  ---
  title: 支付宝支付
  description: 在 web-nextjs 中集成支付宝 PC 网页支付和 H5 手机网站支付，含沙箱调试、安全配置和常见问题。
  ---
  ```

- [x] 10. 按以下大纲编写完整内容（目标读者是新手，操作步骤要详细）：

  **## 技术架构图**
  使用 `<Mermaid>` 组件渲染 flowchart 架构图，展示：
  - 用户浏览器 → Next.js 服务器（Route Handler: `/api/payments/alipay/create`）→ 支付宝服务器
  - 支付宝服务器 → 异步通知 → Route Handler: `/api/payments/alipay/notify` → Supabase DB
  - 支付宝服务器 → 同步回调 → Route Handler: `/api/payments/alipay/return` → 重定向到支付状态页

  示例代码：

  ```mdx
  <Mermaid
    chart={`
  flowchart LR
    User[用户浏览器] -->|1. 点击支付| CreateAPI[POST /api/payments/alipay/create]
    CreateAPI -->|2. 调用 SDK| Alipay[支付宝服务器]
    Alipay -->|3. 跳转收银台| User
    User -->|4. 完成支付| Alipay
    Alipay -->|5. 异步通知| NotifyAPI[POST /api/payments/alipay/notify]
    NotifyAPI -->|6. 验签 + 更新| DB[(Supabase DB)]
    Alipay -->|7. 同步回调| ReturnAPI[GET /api/payments/alipay/return]
    ReturnAPI -->|8. 跳转| StatusPage[支付状态页]
  `}
  />
  ```

  **## 支付时序图**
  使用 `<Mermaid>` 组件渲染 sequenceDiagram，参与者：用户、浏览器、Next.js Server、支付宝 Server、Database。覆盖完整支付流程（创建订单 → 跳转收银台 → 完成支付 → 异步通知验签 → DB 更新 → 状态页展示）。

  **## 准备工作**
  步骤 1：注册/登录支付宝商家账号（https://b.alipay.com）
  步骤 2：在支付宝开放平台（https://open.alipay.com）创建应用，选择「网页&移动应用」
  步骤 3：在应用中申请「电脑网站支付」和「手机网站支付」产品（需上传营业执照等资质材料）
  步骤 4：配置应用公钥：使用支付宝密钥工具（https://opendocs.alipay.com/common/02kipk）在本地生成 RSA2048 密钥对，将应用公钥（公钥字符串，不含 PEM header）粘贴到开放平台配置
  步骤 5：获取配置信息：应用 ID（APPID）、应用私钥（RSA2048 PEM 格式）、支付宝公钥（在开放平台「查看支付宝公钥」）
  步骤 6：配置回调 URL（开发阶段填内网穿透 URL，生产阶段填真实 HTTPS 域名）

  **## 环境变量配置**
  说明 `.env.local` 中各变量来源和格式，以代码块展示完整示例（含注释）：

  ```bash
  ALIPAY_APP_ID=2021xxxxxxxx          # 应用 ID，在开放平台「我的应用」获取
  ALIPAY_PRIVATE_KEY=MIIEowIBAAK...   # 应用私钥，RSA2048，PKCS1 格式，不含 PEM header
  ALIPAY_PUBLIC_KEY=MIIBIjANBgk...    # 支付宝公钥（不是应用公钥），在开放平台「查看」
  ALIPAY_NOTIFY_URL=https://你的域名/api/payments/alipay/notify
  ```

  **## 开发环境调试**
  - 沙箱账号申请：登录开放平台 → 进入「沙箱环境」→ 获取沙箱 APPID 和密钥（文档：https://opendocs.alipay.com/common/02kkv7）
  - 沙箱买家账号：在「沙箱账号」页签获取测试用账号（账号 + 登录密码 + 支付密码）
  - 内网穿透配置（必须，因为支付宝需要向本地回调）：
    - 推荐工具 natapp（https://natapp.cn）：注册账号 → 购买免费隧道 → 下载客户端 → 配置 `authtoken` → 启动（隧道指向 `127.0.0.1:3000`）→ 获得公网域名如 `abc.natapp.cc`
    - 将 `https://abc.natapp.cc/api/payments/alipay/notify` 填入 `.env.local` 的 `ALIPAY_NOTIFY_URL`
  - 完整沙箱测试流程：启动 natapp + `pnpm dev` → 访问 `/pricing` → 选择支付宝 → 跳转沙箱收银台 → 用沙箱买家账号登录支付 → 在终端观察 notify 回调日志 → 检查数据库 payment 状态变为 `paid`

  **## 生产环境配置**
  - 将 `.env.local` 中的沙箱 APPID 和密钥替换为正式密钥
  - `ALIPAY_NOTIFY_URL` 改为生产 HTTPS 域名（必须 HTTPS，IP 地址不支持）
  - 在开放平台将应用提交上线审核（需完善资质材料），审核通过后正式可用
  - 官方上线指引：https://opendocs.alipay.com/open/common/get-started

  **## 安全注意事项（重点）**
  - **私钥绝不能泄露到客户端**：`ALIPAY_PRIVATE_KEY` 仅在 Route Handler（服务端）使用，绝不能以 `NEXT_PUBLIC_` 开头或出现在前端代码中
  - **回调验签必须执行**：每次收到支付宝异步通知（notify）时，必须调用 `verifyAlipayNotify(formData)` 验证签名，拒绝签名不通过的请求（直接返回 HTTP 400），不可跳过
  - **幂等性处理**：根据 `out_trade_no` 查询数据库，若已是 `paid` 状态则直接返回 `'success'`，避免重复处理
  - **金额精度**：支付宝金额单位为「元」（字符串，最多 2 位小数），数据库存储建议使用整数「分」，转换时：`分 / 100` 格式化为 `'0.01'`
  - **HTTPS 强制**：生产环境的 notify URL 必须是 HTTPS；同步回调（return URL）也建议 HTTPS
  - 官方安全文档：https://opendocs.alipay.com/common/02nm2b

  **## 常见问题（FAQs）**
  - Q: 本地开发时收不到支付宝回调？→ 需要内网穿透工具（natapp/cpolar），将公网 URL 配置为 `ALIPAY_NOTIFY_URL`
  - Q: 验签失败（`ISV.INVALID-SIGNATURE`）？→ 检查是否使用了「支付宝公钥」（不是应用公钥），以及公钥格式是否正确（不含 PEM header）
  - Q: 支付后页面没有跳转到 return URL？→ `return_url` 必须是 HTTPS 才会触发同步回调
  - Q: 沙箱可以正常支付，生产环境失败？→ 检查是否替换为正式密钥，应用是否已通过审核上线
  - Q: 出现 `INVALID_PARAMETER` 错误？→ 检查 APPID 是否与密钥匹配，金额格式是否正确（字符串，非负数）
  - Q: 回调接收到但数据库未更新？→ 检查 Supabase service_role key 是否正确，RLS 策略是否允许 insert/update

## 11. 创建 zh wechat-pay.mdx（详细内容）

文件：`apps/docs/content/docs/zh/templates/web-nextjs/wechat-pay.mdx`

- [x] 11. frontmatter：

  ```yaml
  ---
  title: 微信支付
  description: 在 web-nextjs 中集成微信 Native 扫码支付和 H5 手机网站支付，含内网穿透调试、API v3 安全配置和常见问题。
  ---
  ```

- [x] 11. 按以下大纲编写完整内容（目标读者是新手，操作步骤要详细）：

  **## 技术架构图**
  使用 `<Mermaid>` 组件渲染 flowchart 架构图，展示 Native 支付流程：
  - 用户浏览器 → Next.js Server（`/api/payments/wechat/create`）→ 微信支付服务器（Native 下单）
  - 微信支付服务器 → 返回 `code_url` → Next.js Server → 浏览器渲染二维码（qrcode.react）
  - 用户微信 App 扫码 → 微信支付服务器 → 异步通知 → `/api/payments/wechat/notify` → Supabase DB
  - 浏览器轮询 → `/api/payments/wechat/query` → 获知成功 → 跳转状态页

  **## 支付时序图**
  使用 `<Mermaid>` 组件渲染 sequenceDiagram，参与者：用户、浏览器、Next.js Server、微信支付 Server、Database。覆盖完整 Native 支付流程（创建订单 → 返回 code_url → 渲染二维码 → 扫码支付 → 异步通知验签解密 → DB 更新 → 轮询确认 → 状态页展示）。

  **## 准备工作**
  步骤 1：注册微信商户（https://pay.weixin.qq.com）→ 完成主体资质认证（个人暂不支持，需企业或个体工商户）
  步骤 2：在商户平台开通「Native 支付」权限（产品中心 → 我的产品 → Native 支付 → 开通）
  步骤 3：配置 API v3 密钥（账户中心 → API 安全 → 设置 APIv3 密钥）：生成 32 位随机字符串（可使用 `openssl rand -hex 16`），牢记保存，此密钥用于回调解密
  步骤 4：下载商户 API 证书（账户中心 → API 安全 → 申请 API 证书）：按步骤使用证书工具（certutil）生成并下载 `apiclient_cert.pem`（证书）和 `apiclient_key.pem`（私钥）；同时记录「证书序列号」
  步骤 5：获取微信支付平台证书公钥：可通过 API（`GET /v3/certificates`）获取，或在商户平台下载；用于验证微信支付的回调签名
  步骤 6：将 `apiclient_key.pem` 的内容（完整 PEM 格式含 header/footer）设置到环境变量 `WECHAT_PAY_PRIVATE_KEY`

  **## 环境变量配置**
  说明各变量来源，以代码块展示完整示例：

  ```bash
  WECHAT_PAY_APP_ID=wx1234567890abcdef    # 公众号/小程序/移动应用 AppID
  WECHAT_PAY_MCH_ID=1234567890           # 商户号
  WECHAT_PAY_API_V3_KEY=your32charkey... # APIv3 密钥（32 位）
  WECHAT_PAY_PRIVATE_KEY="-- 你的商户私钥（PKCS8 格式，含 PEM header/footer） --"
  WECHAT_PAY_SERIAL_NO=证书序列号（大写十六进制字符串）
  WECHAT_PAY_PLATFORM_PUBLIC_KEY="-- 微信支付平台公钥（含 PEM header/footer） --"
  WECHAT_PAY_BASE_URL=https://api.mch.weixin.qq.com
  WECHAT_PAY_NOTIFY_URL=https://你的域名/api/payments/wechat/notify
  ```

  **## 开发环境调试**
  - **微信支付没有官方沙箱环境**（不同于支付宝），必须使用真实商户账号进行调试
  - 内网穿透配置（必须，微信需要向本地发送回调）：
    - 推荐 natapp（https://natapp.cn）或 cpolar（https://cpolar.com）
    - 操作步骤同支付宝：注册 → 创建 HTTP 隧道（指向 `localhost:3000`）→ 获得公网域名 → 配置到 `WECHAT_PAY_NOTIFY_URL`
  - Native 支付调试流程：启动 natapp + `pnpm dev` → 进入 `/pricing` → 选择微信支付 → 页面显示二维码 → 使用真实微信扫码 → 完成支付 → 观察 notify 回调日志 → 检查数据库
  - **H5 支付在本地无法测试**：微信要求 H5 支付域名必须在商户平台白名单中，本地 localhost 无法通过验证；开发阶段只调试 Native 支付
  - 官方调试工具：商户平台 → 开发调试 → API 接口调试（https://pay.weixin.qq.com/miniapp/dev/apiquery）

  **## 生产环境配置**
  - 在商户平台配置「支付授权目录」（H5 支付）：产品中心 → H5 支付 → 申请域名白名单
  - 回调通知 URL 无需单独配置白名单，但必须是公网可访问的 HTTPS URL
  - 商户 API 证书有效期约 5 年，到期前商户平台会发送提醒邮件，届时需重新申请并更新环境变量
  - 官方上线指引：https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_8_1.shtml

  **## 安全注意事项（重点）**
  - **私钥绝不能泄露到客户端**：`WECHAT_PAY_PRIVATE_KEY` 仅在服务端使用，永远不要以 `NEXT_PUBLIC_` 开头
  - **回调验签必须执行**：在 `notify/route.ts` 中，必须先用 `await req.text()` 读取原始请求体（不能解析为 JSON，否则破坏签名），再验证请求头中的 `Wechatpay-Signature`、`Wechatpay-Timestamp`、`Wechatpay-Nonce`、`Wechatpay-Serial`；验签不通过直接返回 HTTP 400
  - **回调数据必须解密**：微信支付通知中的 `resource` 字段使用 AEAD_AES_256_GCM 加密，必须调用 `decryptResource` 函数解密后才能获取真实支付状态，不可直接信任明文字段
  - **幂等性处理**：根据 `out_trade_no` 检查 DB，已 paid 则直接返回 `{ code: 'SUCCESS' }`
  - **API v3 密钥强度**：32 位随机字符串，定期轮换，不与其他系统共享同一密钥
  - **时间戳有效期**：微信支付的时间戳验证窗口为 5 分钟，服务器时间必须准确（建议启用 NTP 同步）
  - 微信签名规范：https://pay.weixin.qq.com/doc/global/v3/zh/4012354988.md

  **## 常见问题（FAQs）**
  - Q: 收不到微信回调？→ 检查 `WECHAT_PAY_NOTIFY_URL` 是否公网可访问，是否 HTTPS；用 natapp/cpolar 内网穿透
  - Q: 验签失败？→ 确认用的是「微信支付平台公钥」（不是商户证书中的公钥），检查 `Wechatpay-Serial` 是否与平台证书序列号一致
  - Q: Native 支付返回 `SIGNERROR`？→ 检查私钥格式：微信 API v3 要求 PKCS8 格式（`-----BEGIN PRIVATE KEY-----`），而非 PKCS1（`-----BEGIN RSA PRIVATE KEY-----`）
  - Q: 二维码扫了没有反应？→ 检查 `code_url` 是否是 `weixin://wxpay/bizpayurl?pr=...` 格式，确认微信 APP 已更新到最新版
  - Q: 轮询一直是 pending？→ 检查 `/api/payments/wechat/query` 是否调用了正确的微信查单 API（需要传入 `out_trade_no`）

## 12. 创建 zh stripe.mdx（占位）

文件：`apps/docs/content/docs/zh/templates/web-nextjs/stripe.mdx`

- [x] 12. 内容：

  ```mdx
  ---
  title: Stripe 支付
  description: 在 web-nextjs 中集成 Stripe 国际信用卡支付。
  ---

  # Stripe 支付

  > 🚧 本章节正在建设中，适合面向海外用户的 SaaS 产品。

  ## 即将包含

  - Stripe Checkout 集成
  - Webhook 配置与验签
  - 订阅管理（Stripe Billing）
  - 测试模式调试
  ```

## 13. 创建 zh troubleshooting.mdx

文件：`apps/docs/content/docs/zh/templates/web-nextjs/troubleshooting.mdx`

- [x] 13. frontmatter：
  ```yaml
  ---
  title: 故障排查
  description: web-nextjs 模板常见问题排查指南，涵盖认证、路由、支付和数据层问题。
  ---
  ```
- [x] 13. 内容包含以下章节：
  - **## 认证相关**（从 `index.mdx` 的「故障排查」章节迁移：Layer 2 导入错误、Module not found、认证回调错误）
  - **## 路由和 i18n 相关**（新增）：
    - 链接跳转到 `/zh/zh/xxx` 双 locale → 原因：在 i18n `Link` 的 `href` 中手动拼接了 `/{locale}/`，解决：改为 `href="/xxx"`
    - 文档链接跳转 404 → 检查 `NEXT_PUBLIC_DOCS_URL` 环境变量是否配置正确
  - **## 支付相关**（新增）：
    - 支付宝回调收不到 → 内网穿透工具、`ALIPAY_NOTIFY_URL` 配置
    - 支付宝验签失败 → 支付宝公钥类型确认（是「支付宝公钥」不是「应用公钥」）
    - 微信支付 SIGNERROR → 私钥格式（必须 PKCS8）
    - 微信回调验签失败 → 平台公钥 vs 商户证书的区别
    - 支付记录状态没有更新 → 检查 service_role key 和 RLS 配置
  - **## Supabase 相关**（新增）：
    - RLS 导致查询返回空 → 在 Dashboard 检查 policy 定义
    - 自部署 Supabase 邮件收不到 → SMTP 配置，使用 Inbucket 调试
    - `__SCHEMA__` 占位符未替换 → 手动全局替换或使用 CLI `--schema` 参数
  - **## 构建和类型检查**：常见 `pnpm check-types` 失败原因

## 14. 创建英文占位页（8 个文件）

在 `apps/docs/content/docs/en/templates/web-nextjs/` 目录下创建以下文件：

- [x] 14. `usage.mdx`：

  ```mdx
  ---
  title: Template Development & Usage
  description: How to create a web-nextjs project with AgentDock CLI and develop locally.
  ---

  # Template Development & Usage

  > 📖 This page is available in [Chinese](/zh/docs/templates/web-nextjs/usage). English translation coming soon.
  ```

- [x] 14. `deployment.mdx`（标题：Deployment）：同样格式
- [x] 14. `supabase.mdx`（标题：Data Layer: Supabase）：同样格式
- [x] 14. `drizzle.mdx`（标题：Data Layer: Drizzle）：同样格式
- [x] 14. `alipay.mdx`（标题：Alipay Payment）：同样格式
- [x] 14. `wechat-pay.mdx`（标题：WeChat Pay）：同样格式
- [x] 14. `stripe.mdx`（标题：Stripe Payment）：同样格式
- [x] 14. `troubleshooting.mdx`（标题：Troubleshooting）：同样格式

## 15. 更新 en meta.json

文件：`apps/docs/content/docs/en/templates/web-nextjs/meta.json`

- [x] 15. 若文件不存在则创建，内容与中文 meta.json 相同：
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

## 16. 验收

- [x] 16. `pnpm build`（`apps/docs`）成功，无 MDX 编译错误
- [x] 16. `pnpm check-types`（`apps/docs`）通过
- [ ] 16. 启动 `apps/docs` 开发服务器（`pnpm dev`），访问 `/zh/docs/templates/web-nextjs`，确认左侧导航显示全部新子页面（usage、deployment、supabase、drizzle、alipay、wechat-pay、stripe、troubleshooting、i18n-navigation）
- [ ] 16. 访问 `supabase.mdx`、`alipay.mdx`、`wechat-pay.mdx` 页面，确认 Mermaid 图表正常渲染（客户端渲染，页面加载后出现 SVG 图形）
- [ ] 16. 确认 `index.mdx` 已精简，末尾显示子页面导航链接，无「开发工作流」「故障排查」等原始章节
- [ ] 16. 确认 `i18n-navigation.mdx` 内容未被修改
- [x] 16. `openspec validate web-nextjs-docs-restructure` 通过
- [ ] 16. PR 合并 main，删除分支
