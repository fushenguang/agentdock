## Context

`apps/web/` 已有：Supabase Auth（邮箱/密码 + GitHub OAuth）、`IAuthRepository` 接口（5 个方法）、`SupabaseAuthRepository`、`features/auth/` Server Actions、`(auth)` / `(protected)` route groups、`middleware.ts`（session 刷新 + next-intl）、`dashboard-01` block（含 app-sidebar、nav-user 等组件）、react-hook-form + zod、Lucide icons（shadcn 已初始化）、`@tabler/icons-react`（dashboard-01 block 引入）。

**实现分工**：规划（Claude）→ 实现（deepseek v4 pro / qwen max）→ 独立 git 分支 `feat/add-user-account-features`。

## Goals / Non-Goals

**Goals:**
- 密码重置完整流程（forgot-password → 邮件 → reset-password → login）
- 用户 profile 页（显示名修改 + 头像展示 + 修改密码入口）
- 侧边栏 demo 内容清理，重构为通用 web 应用导航
- help / privacy / about 静态占位页

**Non-Goals:**
- 头像上传、邮箱修改、Billing、Notifications（押后）
- help / privacy / about 真实内容（业务工作）
- 自定义 UI 设计

## Decisions

### D1. 修改密码策略：跳转 forgot-password，不做 inline 修改
Supabase `updateUser({ password })` 在同一 session 内可直接调用，但有"recent authentication"要求——若 session 已过一定时间，Supabase 会拒绝。**不做**错误处理分支，直接走 forgot-password 重置流程（简单可靠）。Profile 页"修改密码"按钮 → 跳转 `/${locale}/forgot-password`，清晰明确。

### D2. 防邮箱枚举：forgot-password 无论邮箱是否注册，始终显示"链接已发送"
Supabase `resetPasswordForEmail` 在邮箱未注册时不报错（返回 200），直接展示确认状态，不暴露注册状态。这是 auth 安全基线。

### D3. 重置密码 callback 用 `next` query param 路由
`requestPasswordReset` 中的 `redirectTo` 设为 `${baseUrl}/auth/callback?next=/reset-password`。callback route 读取 `next` param，code exchange 成功后 `redirect(\`/${locale}${next}\`)`（next 值白名单校验：只允许 `/reset-password`，防 open redirect）。

### D4. 图标库：@tabler/icons-react（dashboard-01 已引入），新增 IconShield / IconInfoCircle
dashboard-01 block 已使用 `@tabler/icons-react`，navSecondary 新增的 Privacy（`IconShield`）和 About（`IconInfoCircle`）直接从同库 import，无需引入 Lucide——保持图标风格统一。

### D5. locale 传递给 AppSidebar：navMain/navSecondary 路由需要 locale 前缀
`app-sidebar.tsx` 已接收 `locale` prop（来自 dashboard page），navMain 的 url 从静态字符串改为模板字符串（`/${locale}/dashboard`）。navSecondary 的 help/privacy/about 是 `[locale]` 下的公开页，url 也用 locale 前缀。

### D6. profile 页布局：shadcn Card 组合，不用专用 block
无对应 shadcn block，使用 Card + CardHeader + CardContent + Form 组合，保持风格与 login-03 / signup-03 一致。Page 是 Server Component（读取 user），内部 form 是 Client Component（react-hook-form）。

### D7. settings layout：简单包装 + 未来 Tab 导航预留
`(protected)/settings/layout.tsx`：MVP 只有一层，加 `<nav>` 预留 Tab（Profile | Security 等），当前只显示 Profile tab（active）。访问 `/settings` 时 `redirect` 到 `/settings/profile`。

### D8. zod validations 扩展：在 `src/lib/validations/auth.ts` 新增 schemas
在已有的 `signInSchema` / `signUpSchema` 同文件新增：
- `forgotPasswordSchema`：`{ email: z.string().email() }`
- `resetPasswordSchema`：`{ password: z.string().min(8), confirmPassword: z.string() }.refine(...)`
- `displayNameSchema`：`{ name: z.string().min(1).max(50) }`

### D9. `open redirect` 防护：callback `next` 白名单
`/auth/callback?next=<value>` 的 next 值 MUST 通过白名单校验：
```ts
const ALLOWED_NEXT = ['/reset-password']
const next = searchParams.get('next') ?? '/dashboard'
const safePath = ALLOWED_NEXT.includes(next) ? next : '/dashboard'
```
防止攻击者构造 `?next=https://evil.com` 的 open redirect。

## Migration Plan

1. `git checkout -b feat/add-user-account-features`
2. 扩展 `IAuthRepository` + `SupabaseAuthRepository`（新增 `updateDisplayName`）
3. 新增 `forgotPasswordSchema` / `resetPasswordSchema` / `displayNameSchema`
4. 新增 Server Actions：`requestPasswordReset`、`resetPassword`、`updateDisplayName`
5. 扩展 `/auth/callback/route.ts`（next param + 白名单）
6. 新建 auth 页面：forgot-password / reset-password
7. 新建 protected 页面：settings layout + settings/profile
8. 新建公开页面：help / privacy / about
9. 清理 app-sidebar（移除 demo 内容，补真实路由）；清理 nav-user（移除 Billing/Notifications，Account 加链接）
10. login 页添加"忘记密码？"链接
11. 验收 → PR → merge → delete branch

## Open Questions

（无）
