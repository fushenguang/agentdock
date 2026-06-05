# auth-core Specification

## Purpose

Define the core authentication infrastructure for AgentDock, including repository interfaces, Supabase implementation, Server Actions, and email verification callbacks. This capability establishes a clean architecture boundary between auth features and infrastructure concerns.

## Requirements

### Requirement: IAuthRepository 接口
`src/core/repositories/IAuthRepository.ts` MUST 定义 auth 仓储接口，返回领域类型（`AuthUser`），不泄露 Supabase 类型。

接口方法：
- `signInWithPassword(email: string, password: string): Promise<AuthResult>`
- `signUp(email: string, password: string): Promise<AuthResult>`
- `signOut(): Promise<void>`
- `getSession(): Promise<AuthUser | null>`
- `signInWithOAuth(provider: 'github'): Promise<{ url: string }>`

领域类型（`src/core/types/auth.ts`）：
- `AuthUser`：`{ id: string; email: string; createdAt: string }`
- `AuthResult`：`{ user: AuthUser | null; error: string | null }`

#### Scenario: features/auth 通过接口访问 Supabase Auth，不直接 import SDK
- **WHEN** `features/auth/` 中调用认证逻辑
- **THEN** 只 import `IAuthRepository`，不 import `@supabase/ssr` 或 `@supabase/auth-js`

#### Scenario: 未来替换 auth 实现（如 Auth.js）不改接口层
- **WHEN** 用 Auth.js 实现替换 `SupabaseAuthRepository`
- **THEN** `core/repositories/IAuthRepository` 接口无需修改，features/auth 无感知

### Requirement: SupabaseAuthRepository 实现
`src/infra/db/SupabaseAuthRepository.ts` MUST 实现 `IAuthRepository`，使用 `getServerClient()`，处理 Supabase Auth API 的所有 error 转换（将 Supabase error 转为 `AuthResult.error: string`，不向上层泄露 Supabase 错误格式）。

#### Scenario: 邮箱已注册时 signUp 返回明确错误
- **WHEN** 使用已注册邮箱调用 signUp
- **THEN** 返回 `{ user: null, error: "该邮箱已被注册" }`，不抛出未处理异常

### Requirement: features/auth Server Actions
`src/features/auth/` MUST 遵循四层目录契约，提供 Server Actions 作为 UI 层的唯一调用入口。

结构：
- `__contract__.ts`：声明 auth feature 的公开 API 类型
- `actions.ts`：Server Actions（`'use server'`）——`signIn`、`signUp`、`signOut`、`signInWithGithub`
- `index.ts`：只 export Server Actions（不 export 内部实现）

Server Actions 安全要求：
- 所有 actions MUST 使用 `next/headers` 的 `cookies()` 传递 session，不在 URL 中传递 token
- `signUp` MUST 在 action 层做 zod 验证（邮箱格式 + 密码最小长度 8 位），不依赖 UI 层校验作为唯一防线
- `signInWithGithub` 返回 OAuth redirect URL，由客户端跳转（不用 `redirect()` 在 Server Action 中直接跳转，避免 next-intl locale 路由冲突）

#### Scenario: signIn 成功后 session 写入 cookie
- **WHEN** 用户提交正确的邮箱/密码
- **THEN** Supabase session token 通过 `@supabase/ssr` 写入 httpOnly cookie，前端无法直接读取 token

#### Scenario: signUp 邮箱格式错误在 Server Action 层被拦截
- **WHEN** 提交格式错误的邮箱（如 `notanemail`）
- **THEN** Server Action zod 验证返回错误，不调用 Supabase API

#### Scenario: signOut 清除 session cookie
- **WHEN** 用户调用 signOut
- **THEN** `@supabase/ssr` 清除 session cookie，后续请求 `getSession()` 返回 null

### Requirement: 邮箱验证 callback
`src/app/auth/callback/route.ts` MUST 处理两类回调：
1. **OAuth callback**（GitHub OAuth code exchange）
2. **Email verification callback**（邮箱验证链接点击后）

两类 callback MUST：
- 使用 `exchangeCodeForSession`（Supabase PKCE flow）
- 成功后重定向到 `/dashboard`（带 locale prefix）
- 失败后重定向到 `/login?error=<message>`
- route 不在 `[locale]` 路由组下（callback URL 不含 locale prefix，由 Supabase 直接触发）

#### Scenario: GitHub OAuth 完整流程
- **WHEN** 用户点击"使用 GitHub 登录" → 跳转 GitHub → 授权 → callback
- **THEN** code exchange 成功，session 写入 cookie，重定向到 `/en/dashboard`

#### Scenario: 邮箱验证链接点击
- **WHEN** 新用户点击注册验证邮件中的链接
- **THEN** callback route 处理 token，session 建立，重定向到 `/en/dashboard`
