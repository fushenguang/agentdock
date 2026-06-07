## ADDED Requirements

### Requirement: 路由 groups 结构

`src/app/[locale]/` MUST 使用 Next.js App Router route groups 物理分离 auth 页面与受保护页面。

```
src/app/
  [locale]/
    (auth)/          ← 未认证访问区（login, signup）
      login/page.tsx
      signup/page.tsx
    (protected)/     ← 需认证区（dashboard 及未来所有业务页面）
      dashboard/page.tsx
      layout.tsx     ← 验证 session，未认证则重定向
  auth/
    callback/route.ts  ← OAuth + 邮箱验证 callback（不含 locale）
```

Route group 要求：

- `(auth)` 无独立 layout（复用 `[locale]/layout.tsx`）
- `(protected)/layout.tsx` MUST 在服务端验证 session（`getSession()`），未认证重定向到 `/${locale}/login`

#### Scenario: 未认证访问 /dashboard 被重定向

- **WHEN** 未登录用户访问 `/en/dashboard`
- **THEN** `(protected)/layout.tsx` 检测到无 session，重定向到 `/en/login`

#### Scenario: 已认证访问 /login 被重定向

- **WHEN** 已登录用户访问 `/en/login`
- **THEN** middleware 检测到有效 session，重定向到 `/en/dashboard`

### Requirement: middleware 更新

`src/middleware.ts` MUST 更新，集成 Supabase session 刷新与路由保护逻辑。

Middleware 职责：

1. **Session 刷新**：每次请求调用 `supabase.auth.getUser()`，刷新过期 token（`@supabase/ssr` 标准做法）
2. **Auth 页面保护**：已认证用户访问 `/(auth)` 路由时，重定向到 `/${locale}/dashboard`
3. **next-intl 兼容**：middleware chain 保持 `createMiddleware`（next-intl）+ Supabase session 刷新，不互相覆盖

安全要求：

- MUST 使用 `supabase.auth.getUser()`（服务端验证），不用 `getSession()`（客户端 JWT，可伪造）
- session cookie 由 `@supabase/ssr` 自动管理（httpOnly、Secure、SameSite=Lax）

#### Scenario: Token 过期后 middleware 自动刷新

- **WHEN** 用户 access token 过期，发起请求
- **THEN** middleware 使用 refresh token 自动获取新 access token，用户无感知

#### Scenario: middleware 与 next-intl locale 路由共存

- **WHEN** 访问 `/zh/dashboard`
- **THEN** next-intl middleware 处理 locale，Supabase session 刷新正常执行，无冲突

### Requirement: dashboard 页（dashboard-01 block）

`src/app/[locale]/(protected)/dashboard/page.tsx` MUST 使用 shadcn `dashboard-01` block，展示已登录用户信息。

页面要求：

- 安装：`npx shadcn@latest add dashboard-01`
- 从 session 读取用户邮箱，展示在 dashboard（Server Component，`getSession()` 服务端调用）
- 提供"退出登录"按钮，调用 `signOut` Server Action，退出后重定向到 `/login`

#### Scenario: dashboard 展示当前用户邮箱

- **WHEN** 已登录用户访问 `/en/dashboard`
- **THEN** 页面显示用户邮箱（如 `user@example.com`），来自服务端 session

#### Scenario: 退出登录后无法访问 dashboard

- **WHEN** 用户点击退出登录
- **THEN** session cookie 清除，重定向到 `/en/login`；再次访问 `/en/dashboard` 被重定向回 login
