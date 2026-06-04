## Context

`apps/web/` 已有 `@supabase/ssr`（SSR-safe Supabase client）、四层目录契约、next-intl（`/[locale]/` 路由前缀）、Tailwind v4、Vitest。无 shadcn/ui、无 react-hook-form/zod、无 auth 逻辑、无路由保护。

核心原则：**功能跑通优先，数据层稳固，UI 复用 shadcn blocks，禁止自造轮子**。

## Goals / Non-Goals

**Goals:**
- Supabase Auth（邮箱/密码 + GitHub OAuth）完整跑通，含邮箱验证
- shadcn/ui 初始化 + `login-03`/`signup-03`/`dashboard-01` blocks
- react-hook-form + zod 表单（所有多字段表单强制使用）
- 四层目录契约中的 `features/auth/` 完整实现（Server Actions）
- middleware 更新（session 刷新 + 路由保护），与 next-intl 共存
- `(auth)` / `(protected)` route groups 路由分层

**Non-Goals:**
- 忘记密码 / 重置密码（下一个 change）
- 用户资料 / 头像 / 账号设置（独立 change）
- RBAC / 角色权限（独立 change）
- 自定义 UI 设计（全用 shadcn blocks）
- 邮件模板自定义（Supabase 默认）
- 实时邮箱 DNS 验证（仅格式验证 + 文案引导）

## Decisions

### D1. shadcn 初始化策略：在 apps/web 目录内运行，选 Tailwind v4 兼容模式
shadcn 最新版（2024+）已支持 Tailwind v4。在 `apps/web/` 下运行 `npx shadcn@latest init`，选择：
- Style: `Default`
- Base color: `Neutral`
- CSS variables: yes
- Tailwind config: 已有 `tailwind.config.ts`，shadcn 自动检测

生成的组件放 `src/components/ui/`（`@/components/ui/...`，alias 已配置）。

### D2. GitHub OAuth 替换 Apple：仅改按钮文案与 icon，不改 block 结构
`login-03` block 中将 Apple 按钮改为 GitHub 按钮：
- icon：`import { Github } from 'lucide-react'`（不写 SVG）
- 文案：`"使用 GitHub 登录"` / `"Sign in with GitHub"`
- onClick：调用 `signInWithGithub` → 获取 URL → `router.push(url)`

GitHub 按钮排在 email/password 表单**上方**（优先展示）。

### D3. zod schema 集中管理：`src/lib/validations/auth.ts`
登录/注册的 zod schema 放 `src/lib/validations/auth.ts`，在 UI 层和 Server Action 层共用同一套 schema（DRY，避免前后端校验规则不一致）：
```ts
export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
export const signUpSchema = signInSchema.extend({
  confirmPassword: z.string(),
}).refine(...)
```

Server Action 用 `schema.safeParse(data)` 做第二道校验，不信任客户端传来的数据。

### D4. Server Actions 返回值格式统一
所有 auth Server Actions 返回 `ActionResult<T>`：
```ts
type ActionResult<T = void> = { data: T; error: null } | { data: null; error: string }
```
UI 层统一处理：无错误则继续，有错误则展示 server error alert（不 throw，不用 try/catch 在 UI 层）。

### D5. middleware chain：next-intl 在前，Supabase session 刷新在后
```ts
// middleware.ts
export default async function middleware(request: NextRequest) {
  // 1. Supabase session 刷新（更新 cookie）
  const { response, supabase } = await updateSession(request)
  // 2. next-intl locale 处理（在刷新后的 response 上操作）
  return intlMiddleware(response)
}
```
`updateSession` 使用 `@supabase/ssr` 的 `createServerClient`，在 middleware 中读写 cookie。

注意：middleware 中**不做路由保护重定向**——路由保护放在 `(protected)/layout.tsx` 服务端（更安全，可访问完整 session）。middleware 只负责 session 刷新。

### D6. (protected)/layout.tsx：服务端 session 验证，redirect 带 locale
```ts
// (protected)/layout.tsx  (Server Component)
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect(`/${locale}/login`)
```
用 `getUser()`（服务端验证）而非 `getSession()`（客户端 JWT 可伪造）——**安全关键决策**。

### D7. OAuth callback route 不含 locale prefix
Supabase 回调 URL 配置为 `/auth/callback`（无 `[locale]`），避免 Supabase dashboard 配置多个 locale 变体。callback 成功后，重定向到 `/en/dashboard`（默认 locale），由 next-intl middleware 处理 locale 协商。

### D8. 邮箱验证：signup 后显示"请查收邮件"，不自动登录
Supabase 默认配置（`email_confirm_required: true`）下，signup 后用户需点击邮件链接才算完成注册。signup 成功后页面显示确认提示，不跳转到 dashboard。用户点击邮件链接 → `/auth/callback` → exchange code → 建立 session → 重定向 `/en/dashboard`。

### D9. Supabase Dashboard 配置（实现者需手动操作）
以下配置需在 Supabase Dashboard 手动完成（不在代码实现范围）：
- Authentication → Providers → GitHub：填入 Client ID / Client Secret
- Authentication → URL Configuration → Redirect URLs：添加 `http://localhost:3000/auth/callback`（开发）和生产域名
- Email 模板：保持默认，不自定义

这些配置需写入模板 `README.md` 的"Setup"步骤。

## Risks / Trade-offs

- [Tailwind v4 + shadcn 兼容性] → shadcn 已支持 Tailwind v4 CSS-first config，运行 `npx shadcn@latest init` 时若提示版本问题，使用 `--legacy-peer-deps` 安装。
- [next-intl locale prefix 与 (protected) layout redirect 的 locale 获取] → `(protected)/layout.tsx` 从 `params.locale` 获取当前 locale（App Router 传参），传给 `redirect(\`/${locale}/login\`)`。
- [signInWithGithub 在 Server Action 中返回 URL 而非直接 redirect] → Server Action 中直接调用 `redirect()` 可能触发 next-intl 的 redirect 拦截（locale 前缀丢失）；返回 URL 给客户端用 `router.push()` 更安全可控。

## Open Questions

（无）
