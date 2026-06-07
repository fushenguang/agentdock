## ADDED Requirements

### Requirement: 用户 profile 设置页

`src/app/[locale]/(protected)/settings/profile/page.tsx` MUST 提供用户账号设置页，展示并允许修改 profile 信息。

页面要求（shadcn 组件组合，不自定义设计）：

- **头像区域**：展示 OAuth 头像（`user_metadata.avatar_url`）或首字母 Fallback（Avatar 组件）；**不实现**上传功能（占位提示"头像上传功能即将推出"）
- **显示名修改**：react-hook-form + zod（`displayNameSchema`：`name: z.string().min(1).max(50)`），Form + Input + Button，Server Action `updateDisplayName(name)` 调用 `supabase.auth.updateUser({ data: { display_name: name } })`
- **邮箱展示**：只读展示（不可修改，标注"如需修改邮箱，请联系支持"）
- **修改密码**：Button → 跳转 `/${locale}/forgot-password`（触发重置流程，而非 inline 修改——避免 re-authentication 复杂性）
- **退出登录**：保留，调用 `signOut`

#### Scenario: 修改显示名成功

- **WHEN** 用户输入新显示名并提交
- **THEN** Server Action 调用 `updateUser`，成功后 toast "显示名已更新"，表单显示新值

#### Scenario: 显示名为空被拦截

- **WHEN** 用户清空显示名并提交
- **THEN** zod min(1) 拦截，inline 错误提示

#### Scenario: OAuth 用户头像正确展示

- **WHEN** 用户通过 GitHub OAuth 登录后访问 profile
- **THEN** 头像展示 GitHub 头像（来自 `user_metadata.avatar_url`），Fallback 为邮箱首字母

### Requirement: IAuthRepository 扩展

`src/core/repositories/IAuthRepository.ts` MUST 新增 `updateDisplayName` 方法：

```ts
updateDisplayName(name: string): Promise<AuthResult>
```

`SupabaseAuthRepository` 实现此方法，调用 `supabase.auth.updateUser({ data: { display_name: name } })`。

#### Scenario: features/auth 通过接口调用 updateDisplayName

- **WHEN** profile Server Action 调用 updateDisplayName
- **THEN** 只 import IAuthRepository，不直接 import Supabase SDK（Layer 2 规则）

### Requirement: Settings 路由入口

`(protected)/settings/` MUST 有 layout，为后续设置子页（profile、notifications、billing 等）预留结构。

- `settings/layout.tsx`：简单包装，可加 settings 内部标签导航（Tab 式），MVP 只有 profile 子页
- Sidebar Settings 链接 → `/${locale}/settings/profile`

#### Scenario: 访问 /settings 重定向到 /settings/profile

- **WHEN** 用户访问 `/${locale}/settings`
- **THEN** redirect 到 `/${locale}/settings/profile`（默认子页）
