---
roadmap-id: web-nextjs-builtin-suite
---

## Why

auth 系统跑通后，有两个立即可见的残缺：

1. **密码忘了怎么办**——没有重置密码流程，用户账号事实上锁死
2. **用户不知道自己是谁**——dashboard 只有邮箱，没有 profile 页，无法修改显示名 / 查看账号信息

同时，dashboard-01 block 直接安装后侧边栏充满 shadcn 的 demo 内容（Lifecycle、Analytics、Projects、Capture/Proposal/Prompts、Data Library 等），全部指向 `#`，这些内容对下游项目毫无意义，必须清理为**通用 web 应用的基础导航**（Settings / Help / Privacy / About）。

本 change 同时测试中国 LLM（deepseek v4 pro / qwen max）在中等复杂度全栈功能上的编码能力。

核心原则延续：**功能跑通优先，UI 复用 shadcn，禁止造轮子，表单必须 react-hook-form + zod**。

## What Changes

- **密码重置流程**：忘记密码页 → Supabase 发送重置邮件 → 重置密码页（输入新密码）→ 成功跳转登录
- **用户 Profile 页**：`/(protected)/settings/profile`——展示头像（OAuth 自动获取）、修改显示名（`display_name`）、修改密码入口
- **Dashboard 侧边栏清理**：
  - 移除：Lifecycle / Analytics / Projects / Team（无页面的 demo 链接）
  - 移除整节：navClouds（Capture/Proposal/Prompts）、NavDocuments（Data Library/Reports/Word Assistant）
  - 保留 + 补路由：Dashboard → `/${locale}/dashboard`，Settings → `/${locale}/settings/profile`
  - navSecondary 更新为通用 web 基础项：Help（`/help`）、Privacy Policy（`/privacy`）、About（`/about`）
  - nav-user 下拉清理：Account → `/${locale}/settings/profile`；移除 Billing / Notifications（未实现）
- **静态占位页**：`/help`、`/privacy`、`/about`——简单 Server Component，内容占位，可被搜索引擎索引

## Capabilities

### New Capabilities

- `account-password-reset`：忘记密码 + 重置密码完整流程（Supabase Auth 内置，2 个页面 + 1 个 Server Action + auth callback 扩展）
- `account-profile`：用户 profile 设置页——显示名修改（react-hook-form + zod）、头像展示、修改密码入口（跳转重置流程）
- `dashboard-nav-cleanup`：侧边栏从 demo 内容重构为通用 web 应用导航；新增 help / privacy / about 静态占位页

### Modified Capabilities

- `auth-routing`：扩展 `(auth)` route group 加入 forgot-password / reset-password 页；`(protected)` 加入 settings/profile 页
- `auth-core`：`IAuthRepository` 扩展 `updateDisplayName` 方法；`SupabaseAuthRepository` 实现

## Non-goals

- **不实现**头像上传（文件上传独立功能，复杂度高，押后）
- **不实现** Billing / 订阅管理（payments 独立 change）
- **不实现** Notifications 系统（独立 change）
- **不做** help / privacy / about 页的真实内容（占位即可，真实内容是业务工作）
- **不做** 邮箱修改（涉及 Supabase Auth 邮箱验证重新发送，复杂度高）
- **不做**自定义 UI 设计，全部用 shadcn 组件

## Roadmap & Sequence

- Roadmap 锚点：`web-nextjs-builtin-suite`（Now，in-progress）
- 顺序：`add-auth-to-web-nextjs` 之后；本 change 完成后 auth 系统完整（login/signup/reset/profile），sidebar 清洁，可作为真实产品基底

## Impact

- 影响范围：`templates/web-nextjs/apps/web/`——新增页面、修改 app-sidebar / nav-user / nav-secondary 组件
- 分支：`feat/add-user-account-features`（独立分支开发，PR 合并到 main）
- 风险：Supabase `updateUser` 修改密码需要用户已通过 recent session 验证，若 token 过期需要重新登录——在 profile 页提示用户
