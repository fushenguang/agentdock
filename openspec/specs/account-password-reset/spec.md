# account-password-reset Specification

## Purpose
TBD - created by archiving change add-user-account-features. Update Purpose after archive.
## Requirements
### Requirement: 忘记密码页
`src/app/[locale]/(auth)/forgot-password/page.tsx` MUST 提供忘记密码页，使用 Supabase Auth 发送重置邮件。

页面要求：
- shadcn 组件：Card + Form + Input + Button（无专用 block，自行组合，保持风格一致）
- react-hook-form + zod：`forgotPasswordSchema`（`email: z.string().email()`）
- Server Action `requestPasswordReset(email)`：调用 `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/auth/callback?next=/reset-password' })`
- 成功后：页面显示"重置链接已发送至 <email>，请查收邮件"确认状态（不跳转）
- 在 login 页底部添加"忘记密码？"链接 → `/${locale}/forgot-password`

#### Scenario: 有效邮箱提交后显示确认提示
- **WHEN** 用户输入已注册邮箱并提交
- **THEN** Supabase 发送重置邮件，页面显示确认文案，不重定向

#### Scenario: 未注册邮箱也显示相同确认提示（防枚举）
- **WHEN** 用户输入未注册的邮箱
- **THEN** 页面仍显示"重置链接已发送"（防止邮箱枚举攻击，不区分已注册/未注册）

#### Scenario: 邮箱格式错误被前端拦截
- **WHEN** 输入格式错误邮箱（如 `abc`）
- **THEN** zod 校验拦截，显示 inline 错误，不调用 Server Action

### Requirement: 重置密码页
`src/app/[locale]/(auth)/reset-password/page.tsx` MUST 提供新密码设置页，在用户点击重置邮件链接后访问。

页面要求：
- react-hook-form + zod：`resetPasswordSchema`（password + confirmPassword，min 8，refine 一致性）
- Server Action `resetPassword(password)`：调用 `supabase.auth.updateUser({ password })`
- 成功后：重定向到 `/${locale}/login`，展示 toast "密码已更新，请重新登录"
- 重置链接过期/无效时：`/auth/callback` 处理失败 → 重定向到 `/${locale}/forgot-password?error=link_expired`

#### Scenario: 新密码不一致被拦截
- **WHEN** confirmPassword 与 password 不一致
- **THEN** zod refine 拦截，inline 错误提示，不调用 Server Action

#### Scenario: 重置成功后自动跳转登录页
- **WHEN** 新密码符合要求，Server Action 成功
- **THEN** 重定向到 login 页，提示"密码已更新"

#### Scenario: 重置链接过期时引导重新申请
- **WHEN** 用户点击过期的重置链接
- **THEN** 重定向到 forgot-password 页，显示"链接已过期，请重新申请"提示

### Requirement: auth callback 扩展（支持 next 参数）
`src/app/auth/callback/route.ts` MUST 扩展，支持 `next` query param，用于重置密码后的路由跳转。

- callback URL 含 `?next=/reset-password` → exchange code 成功后重定向到 `/${locale}/reset-password`
- 保持现有 OAuth callback 行为不变

#### Scenario: 密码重置 callback 跳转到 reset-password 页
- **WHEN** 用户点击重置邮件链接（含 `?next=/reset-password`）
- **THEN** callback 成功后重定向到 `/en/reset-password`（而非 dashboard）

