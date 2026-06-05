---
roadmap-id: web-nextjs-builtin-suite
---

## Why

模板现在有四层目录契约、Supabase 数据层、monorepo + docs 共生结构，但**没有身份认证**——这是真实应用的硬性前提。没有 auth，路由无法保护、数据无法归属、任何用户相关功能都无法展开。

本 change 的核心原则：**功能跑通优先，数据层要稳，UI 复用成熟开源方案，禁止从头造轮子**。
- Auth 逻辑：Supabase Auth（与已有 `@supabase/ssr` 天然配套，无需换方案）
- UI：shadcn/ui blocks（`login-03`、`signup-03`、`dashboard-01`），不做自定义设计
- 表单：react-hook-form + zod（所有超过 1 个字段的表单强制使用）
- 图标：Lucide（shadcn 推荐，不自写 SVG）

## What Changes

- **shadcn/ui 初始化**：`apps/web/` 安装 shadcn/ui（含 Lucide icons、react-hook-form、zod）
- **auth feature**：`src/features/auth/`（contract + Server Actions + index），遵循四层目录契约
- **auth 页面**：
  - `/[locale]/(auth)/login`：`login-03` block，GitHub 替换 Apple，email/password 表单 + zod 验证
  - `/[locale]/(auth)/signup`：`signup-03` block，邮箱前置 zod 验证（格式 + 真实性校验提示）
  - `/auth/callback`：OAuth redirect + 邮箱验证 callback 统一处理
- **protected 路由**：`/[locale]/(protected)/dashboard`，`dashboard-01` block
- **middleware 更新**：session 检查，未认证重定向 `/login`，已认证访问 `/(auth)` 重定向 `/dashboard`
- **i18n**：auth 相关文案加入 `en.json`/`zh.json`

## Capabilities

### New Capabilities

- `auth-core`：Supabase Auth 业务逻辑层——`IAuthRepository`（`core/repositories/`）、`SupabaseAuthRepository`（`infra/db/`）、`features/auth/`（Server Actions: signIn / signUp / signOut / signInWithGithub）、邮箱验证 callback、session 管理
- `auth-ui`：shadcn/ui 初始化 + auth 页面——`login-03`（GitHub OAuth + email/password）、`signup-03`（含 zod 邮箱验证）、react-hook-form + zod、Lucide icons
- `auth-routing`：路由保护机制——`(auth)` / `(protected)` route groups、middleware 重定向逻辑、`/auth/callback` 统一处理、`dashboard-01`

### Modified Capabilities

- `template-directory-contract`：新增 `features/auth/` 作为 auth feature 示例（丰富参考实现）
- `template-self-config`：`copilot-instructions.md` 更新，记录 auth 使用约定和 shadcn/forms 规则

## Non-goals

- **不实现** 忘记密码 / 重置密码流程（独立 change）
- **不实现** 用户资料页 / 头像上传 / 账号设置（独立 change）
- **不实现** 角色权限 / RBAC（独立 change）
- **不实现** Magic Link / OTP / 手机号登录（独立 change）
- **不做** 自定义 UI 设计（全部使用 shadcn blocks，UI 统一处理放后）
- **不做** 邮件模板自定义（使用 Supabase 默认邮件模板）
- **不做** 第三方服务 Resend 集成（自部署 Supabase 已支持真实邮件发送）

## Roadmap & Sequence

- Roadmap 锚点：`web-nextjs-builtin-suite`（Now，in-progress）
- 顺序：`restructure-web-nextjs-to-monorepo` 之后；本 change 完成后，dashboard 有了落地页，auth 机制到位，后续 feature（用户资料、权限、payments）均可依赖 auth context

## Impact

- 影响范围：`templates/web-nextjs/apps/web/**`（新增 shadcn/ui、auth feature、auth 页面、middleware 更新）
- 风险：Tailwind v4 + shadcn/ui 兼容性（shadcn 最新版已支持 Tailwind v4，需验证）；`next-intl` locale 路由与 `(auth)/(protected)` route group 嵌套需验证无冲突
