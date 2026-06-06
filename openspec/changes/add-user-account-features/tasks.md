## 0. Git 分支准备

- [x] 0.1 从 main 创建并切换到开发分支：`git checkout -b feat/add-user-account-features`
- [x] 0.2 确认分支干净（`git status` 无未提交变更）
- [ ] 0.3 实现完成、验收通过后，提 PR 合并到 main，合并后删除分支

## 1. 数据层扩展（core + infra）

- [x] 1.1 `src/core/types/auth.ts`：确认 `AuthUser` / `AuthResult` / `ActionResult<T>` 类型存在（auth change 已建，无需新建）
- [x] 1.2 `src/core/repositories/IAuthRepository.ts`：新增 `updateDisplayName(name: string): Promise<AuthResult>` 方法
- [x] 1.3 `src/infra/db/SupabaseAuthRepository.ts`：实现 `updateDisplayName`（`supabase.auth.updateUser({ data: { display_name: name } })`，error 转为 `AuthResult.error` string）

## 2. Zod schemas 扩展

- [x] 2.1 `src/lib/validations/auth.ts` 新增：
  - `forgotPasswordSchema`：`{ email: z.string().email("请输入有效邮箱") }`
  - `resetPasswordSchema`：`{ password: z.string().min(8, "密码至少 8 位"), confirmPassword: z.string() }.refine(pwd 一致, { message: "两次密码不一致", path: ['confirmPassword'] })`
  - `displayNameSchema`：`{ name: z.string().min(1, "显示名不能为空").max(50, "显示名最多 50 字符") }`

## 3. Server Actions 扩展

- [x] 3.1 `src/features/auth/__contract__.ts`：新增 `requestPasswordReset` / `resetPassword` / `updateDisplayName` 入参出参类型声明
- [x] 3.2 `src/features/auth/actions.ts` 新增：
  - `requestPasswordReset(formData)`：zod 验证邮箱 → `IAuthRepository`（通过 DI / 直接实例化 SupabaseAuthRepository）→ `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${baseUrl}/auth/callback?next=/reset-password\` })` → 始终返回成功（防枚举）
  - `resetPassword(formData)`：zod 验证新密码 → `supabase.auth.updateUser({ password })` → 成功重定向 `/${locale}/login`
  - `updateDisplayName(formData)`：zod 验证 → `IAuthRepository.updateDisplayName(name)` → 返回 `ActionResult`
- [x] 3.3 `src/features/auth/index.ts`：export 新增的 3 个 actions

## 4. auth/callback 扩展

- [x] 4.1 `src/app/auth/callback/route.ts`：读取 `next` query param，白名单校验（`ALLOWED_NEXT = ['/reset-password']`，其余 fallback 到 `/dashboard`），code exchange 成功后 `redirect(\`/${locale}${safePath}\`)`

## 5. 密码重置页面

- [x] 5.1 `src/app/[locale]/(auth)/forgot-password/page.tsx`：
  - Card + Form + Input + Button（shadcn 组件）
  - react-hook-form + `forgotPasswordSchema`
  - 提交成功后切换为"请查收 <email> 的重置邮件"确认状态（useState 控制）
  - 底部"返回登录"链接 → `/${locale}/login`
- [x] 5.2 `src/app/[locale]/(auth)/reset-password/page.tsx`：
  - Card + Form + Input(×2) + Button
  - react-hook-form + `resetPasswordSchema`
  - 提交调用 `resetPassword` Server Action，成功跳转 login + Sonner toast "密码已更新"
  - 链接过期时（从 callback 带 `?error=link_expired`）显示 Alert 提示并提供"重新申请"按钮

## 6. 登录页更新

- [x] 6.1 `src/app/[locale]/(auth)/login/page.tsx`：在 email/password 表单下方添加"忘记密码？"链接 → `/${locale}/forgot-password`（使用 `lucide-react` 无图标纯文字链接即可）

## 7. 用户 Profile 页

- [x] 7.1 `src/app/[locale]/(protected)/settings/layout.tsx`：
  - Server Component，包含简单 nav 预留（MVP 只有 Profile 一个 Tab）
  - `src/app/[locale]/(protected)/settings/page.tsx`：`redirect(\`/${locale}/settings/profile\`)`
- [x] 7.2 `src/app/[locale]/(protected)/settings/profile/page.tsx`（Server Component）：
  - 调用 `getCurrentUser()` 获取 user 信息
  - 渲染 3 个 Card 区块：
    - **头像 + 基本信息**：Avatar（`user_metadata.avatar_url` 或首字母 Fallback）+ 邮箱只读展示
    - **显示名修改**：Client Component（`ProfileForm`），react-hook-form + `displayNameSchema`，调用 `updateDisplayName` action，成功 Sonner toast
    - **密码**：Button "修改密码" → `router.push(\`/${locale}/forgot-password\`)`
- [x] 7.3 `src/components/profile/profile-form.tsx`（`"use client"`）：显示名 Form 组件，接收 `defaultName` prop

## 8. 侧边栏清理

- [x] 8.1 `src/components/dashboard/app-sidebar.tsx` 重构 data 对象：
  - `navMain`：只保留 `Dashboard`（`/${locale}/dashboard`）和 `Settings`（`/${locale}/settings/profile`），图标 `IconDashboard` / `IconSettings`
  - 移除 `navClouds` 数据对象
  - `navSecondary`：更新为 `Help`（`/${locale}/help`，`IconHelp`）、`Privacy Policy`（`/${locale}/privacy`，`IconShield`）、`About`（`/${locale}/about`，`IconInfoCircle`）
  - 移除 `NavDocuments` import 与 `<NavDocuments>` 用法
- [x] 8.2 `src/components/dashboard/nav-user.tsx` 清理下拉菜单：
  - Account 项：添加 `asChild` + `Link href={\`/${locale}/settings/profile\`}`
  - 移除 Billing `DropdownMenuItem`
  - 移除 Notifications `DropdownMenuItem`
  - 保留 Log out（现有实现不变）
  - 移除 `IconCreditCard` / `IconNotification` import

## 9. 静态占位页

- [x] 9.1 `src/app/[locale]/help/page.tsx`：Server Component，Card 展示标题"帮助中心"+ 占位文案
- [x] 9.2 `src/app/[locale]/privacy/page.tsx`：Server Component，Card 展示标题"隐私政策"+ 占位文案
- [x] 9.3 `src/app/[locale]/about/page.tsx`：Server Component，Card 展示标题"关于我们"+ 占位文案

## 10. i18n 文案

- [x] 10.1 `messages/en.json` 新增命名空间：
  - `auth.forgotPassword.*`（标题、表单标签、按钮、确认文案）
  - `auth.resetPassword.*`（标题、表单标签、按钮、成功提示、过期提示）
  - `settings.profile.*`（标题、各 section 标签、按钮文案）
  - `pages.help.*` / `pages.privacy.*` / `pages.about.*`（标题 + 占位描述）
- [x] 10.2 `messages/zh.json` 同步添加相同 keys（value=key 占位）

## 11. docs 更新

- [x] 11.1 `apps/docs/content/docs/templates/web-nextjs/` 创建：web-nextjs 模板完整文档（项目介绍、技术栈、架构、开发流程等）

## 12. 验收

- [x] 12.1 `pnpm lint`：`features/auth/` 无 Layer 2 违规（actions 不直接 import Supabase SDK）
- [x] 12.2 `pnpm check-types`：无 TS error
- [x] 12.3 `pnpm build`：`apps/web` 构建成功
- [ ] 12.4 侧边栏验收：无任何 `url: "#"` 链接，Settings / Help / Privacy / About 均可点击跳转
- [ ] 12.5 端到端验证（本地 + 真实 Supabase）：
  - [ ] 忘记密码 → 收到重置邮件 → 点击链接 → 到 reset-password 页 → 设置新密码 → 跳转 login ✓
  - [ ] 邮箱枚举防护：未注册邮箱提交 forgot-password → 同样显示"链接已发送"✓
  - [ ] 重置链接过期 → 显示过期提示 + "重新申请"按钮 ✓
  - [ ] profile 页显示名修改 → toast 成功提示 ✓
  - [ ] profile 页头像展示（GitHub OAuth 用户头像）✓
  - [ ] 未登录访问 /help、/privacy、/about → 正常渲染（不重定向 login）✓
  - [ ] nav-user 下拉：Account → 跳转 settings/profile；无 Billing / Notifications ✓
- [ ] 12.6 open redirect 安全验证：访问 `/auth/callback?next=https://evil.com` → fallback 到 dashboard，不外跳 ✓
- [x] 12.7 `openspec validate add-user-account-features` 通过
- [ ] 12.8 自检：未触及 Non-goals（无头像上传 / 邮箱修改 / Billing / Notifications）
- [ ] 12.9 PR 合并到 main，删除 `feat/add-user-account-features` 分支
