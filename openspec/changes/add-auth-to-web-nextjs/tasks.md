## 1. shadcn/ui 初始化与依赖安装

- [x] 1.1 在 `apps/web/` 运行 `npx shadcn@latest init`（style: Default，color: Neutral，CSS variables: yes）
- [x] 1.2 安装 react-hook-form 相关依赖：`pnpm add react-hook-form @hookform/resolvers zod`（在 apps/web）
- [x] 1.3 确认 `lucide-react` 已安装（shadcn init 通常自动安装，否则 `pnpm add lucide-react`）
- [x] 1.4 安装 shadcn form 组件：`npx shadcn@latest add form input label button`（react-hook-form 集成组件）
- [x] 1.5 安装 shadcn alert/toast 组件：`npx shadcn@latest add alert sonner`（用于错误提示）

## 2. 数据层（core + infra）

- [x] 2.1 创建 `src/core/types/auth.ts`：定义 `AuthUser`、`AuthResult`、`ActionResult<T>` 类型
- [x] 2.2 创建 `src/core/repositories/IAuthRepository.ts`：定义 auth 仓储接口（5 个方法，返回领域类型，无 Supabase 类型泄露）
- [x] 2.3 创建 `src/infra/db/SupabaseAuthRepository.ts`：实现 `IAuthRepository`，使用 `getServerClient()`，所有 Supabase error 转换为 `AuthResult.error: string`
- [x] 2.4 更新 `src/infra/db/client.ts`：确认 `getServerClient()` 支持 middleware 中的 cookie 读写（`updateSession` helper）；新增 `createMiddlewareClient(request, response)` 导出供 middleware 使用

## 3. zod schemas

- [x] 3.1 创建 `src/lib/validations/auth.ts`：`signInSchema`、`signUpSchema`（含 confirmPassword refine）
- [x] 3.2 确认 schema 可在 Server Action 和 UI 层共用（`'use server'` action 文件可 import 普通 ts 文件）

## 4. features/auth（Server Actions）

- [x] 4.1 创建 `src/features/auth/__contract__.ts`：声明 auth feature 公开 API 类型（signIn/signUp/signOut/signInWithGithub 的入参/出参）
- [x] 4.2 创建 `src/features/auth/actions.ts`（`'use server'`）：
  - `signIn(formData)`：zod 验证 → `IAuthRepository.signInWithPassword` → 成功重定向 `/${locale}/dashboard`
  - `signUp(formData)`：zod 验证 → `IAuthRepository.signUp` → 成功返回 `{ success: true, email }`（不重定向，等邮箱验证）
  - `signOut()`：`IAuthRepository.signOut` → 重定向 `/${locale}/login`
  - `signInWithGithub()`：`IAuthRepository.signInWithOAuth('github')` → 返回 `{ url }`
- [x] 4.3 创建 `src/features/auth/index.ts`：只 export 4 个 Server Actions
- [x] 4.4 确认 `no-direct-db-in-features` ESLint 规则在 actions.ts 中通过（features 层只 import IAuthRepository，不直接 import SupabaseAuthRepository）

## 5. OAuth + 邮箱验证 callback

- [x] 5.1 创建 `src/app/auth/callback/route.ts`（GET handler）：
  - 读取 `code` query param
  - `supabase.auth.exchangeCodeForSession(code)`
  - 成功：重定向到 `/en/dashboard`
  - 失败：重定向到 `/en/login?error=auth_callback_error`

## 6. middleware 更新

- [x] 6.1 更新 `src/middleware.ts`：
  - 添加 Supabase session 刷新（`updateSession`，使用 `createMiddlewareClient`）
  - 保持 next-intl `createMiddleware` 处理 locale
  - 顺序：先 session 刷新更新 cookie，再走 next-intl（见 design D5）
- [x] 6.2 更新 `config.matcher`：确保 auth 路由（`/auth/callback`）不被 next-intl 拦截

## 7. 路由 groups 与页面

- [x] 7.1 创建 `src/app/[locale]/(auth)/` 目录（无 layout，复用父级）
- [x] 7.2 **login 页**：
  - `npx shadcn@latest add login-03`（在 apps/web 目录）
  - 将生成的组件移入 `src/app/[locale]/(auth)/login/page.tsx`
  - GitHub 按钮替换 Apple：icon 改为 `<GitBranch />` from `lucide-react`，文案改为 "使用 GitHub 登录"
  - GitHub 按钮逻辑：调用 `signInWithGithub()` → `router.push(url)`
  - email/password 表单：接入 react-hook-form + `signInSchema`，`FormMessage` 展示 zod 错误
  - Server Action error 展示：用 Sonner toast 或 Alert 组件展示
  - 底部添加"没有账号？注册"链接 → `/${locale}/signup`
- [x] 7.3 **signup 页**：
  - `npx shadcn@latest add signup-03`（在 apps/web 目录）
  - 将生成的组件移入 `src/app/[locale]/(auth)/signup/page.tsx`
  - 接入 react-hook-form + `signUpSchema`（email + password + confirmPassword）
  - 邮箱字段 helper text：`"请使用真实邮箱，注册后需点击验证邮件完成注册"`
  - 提交成功后：页面切换为"请查收 <email> 的验证邮件"确认状态（不跳转）
  - 底部添加"已有账号？登录"链接 → `/${locale}/login`
- [x] 7.4 **protected layout**：
  - 创建 `src/app/[locale]/(protected)/layout.tsx`（Server Component）
  - `getUser()` 验证 session，无 session 则 `redirect(\`/${locale}/login\`)`
- [x] 7.5 **dashboard 页**：
  - `npx shadcn@latest add dashboard-01`（在 apps/web 目录）
  - 将生成的组件移入 `src/app/[locale]/(protected)/dashboard/page.tsx`
  - 从 session 读取 `user.email`，展示在 dashboard header
  - 添加"退出登录"按钮，调用 `signOut` Server Action

## 8. i18n auth 文案

- [x] 8.1 在 `messages/en.json` 添加 `auth` 命名空间（login/signup 所有文案：标题、按钮、错误提示等）
- [x] 8.2 在 `messages/zh.json` 添加相同 keys（value=key 占位）
- [x] 8.3 login/signup 页使用 `useTranslations('auth')` 渲染文案（非硬编码中文/英文字符串）

## 9. 文档更新

- [x] 9.1 更新模板 `README.md`，在"Setup"部分添加 Supabase 配置步骤（GitHub OAuth 配置、Redirect URL 配置），格式：编号步骤 + 截图说明位置
- [x] 9.2 在 `apps/docs/content/docs/features/auth.mdx` 创建 auth feature 文档（说明四层契约使用方式、Server Actions 用法、路由保护机制）——docs 共同成长

## 10. 验收

- [x] 10.1 `pnpm lint`：`features/auth/` 无 `no-direct-db-in-features` 违规
- [x] 10.2 `pnpm check-types`：无 TS error（含 shadcn 生成的组件）
- [x] 10.3 `pnpm build`：`apps/web` 构建成功
- [ ] 10.4 端到端验证（本地 + 真实 Supabase）：
  - [ ] 邮箱/密码注册 → 收到验证邮件 → 点击链接 → 跳转 dashboard ✓
  - [ ] 邮箱/密码登录 → 跳转 dashboard ✓
  - [ ] GitHub OAuth 登录全流程 ✓
  - [ ] 未登录访问 `/en/dashboard` → 重定向 `/en/login` ✓
  - [ ] 已登录访问 `/en/login` → 重定向 `/en/dashboard` ✓
  - [ ] 退出登录 → 再访问 dashboard → 重定向 login ✓
- [ ] 10.5 表单验证验收：
  - [ ] login：无效邮箱格式 → inline 错误 ✓；密码 < 8 位 → inline 错误 ✓；密码错误 → server error 提示 ✓
  - [ ] signup：confirmPassword 不一致 → inline 错误 ✓；注册成功 → 显示查收邮件提示 ✓
- [x] 10.6 无自写 SVG icon（只用 `lucide-react`）
- [x] 10.7 `openspec validate add-auth-to-web-nextjs` 通过
- [x] 10.8 自检：未触及 Non-goals（无忘记密码 / 用户资料 / RBAC / 自定义邮件模板）
