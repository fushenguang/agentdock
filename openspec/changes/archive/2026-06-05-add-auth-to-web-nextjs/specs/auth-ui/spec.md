## ADDED Requirements

### Requirement: shadcn/ui 初始化

`apps/web/` MUST 安装并初始化 shadcn/ui，作为 UI 组件来源，不自写组件 CSS 逻辑。

初始化要求：

- 运行 `npx shadcn@latest init`（支持 Tailwind v4，选 `Default` style，`neutral` base color）
- 安装 Lucide icons（shadcn 默认图标库，`lucide-react`）——**禁止**在 auth 页面自写 SVG icon
- 安装 `react-hook-form`、`@hookform/resolvers`、`zod`
- **规则**：凡是超过 1 个输入字段的表单，MUST 使用 react-hook-form + zod schema

#### Scenario: shadcn Button 可在 apps/web 中正常 import

- **WHEN** 在任意页面 `import { Button } from '@/components/ui/button'`
- **THEN** 组件正常渲染，Tailwind 样式生效

#### Scenario: Lucide icon 可用，不出现 SVG 手写

- **WHEN** 需要图标时
- **THEN** 从 `lucide-react` import（如 `GithubIcon`、`MailIcon`、`EyeIcon`），不手写 `<svg>` 标签

### Requirement: login 页（login-03 block）

`src/app/[locale]/(auth)/login/page.tsx` MUST 使用 shadcn `login-03` block，GitHub 登录按钮替换原 Apple 登录，优先展示。

页面要求：

- 安装：`npx shadcn@latest add login-03`
- GitHub OAuth 按钮：调用 `signInWithGithub` Server Action，获取 URL 后 `router.push(url)`
- email/password 表单：react-hook-form + zod schema（email: `z.string().email()`，password: `z.string().min(8)`）
- 表单错误展示：每个字段 inline 错误提示（`FormMessage`）+ 全局 server error（toast 或 alert）
- 成功后 Server Action 重定向到 `/dashboard`
- 链接"没有账号？注册"指向 `/signup`

#### Scenario: 邮箱格式错误在提交前被拦截

- **WHEN** 用户输入 `notanemail` 并点击登录
- **THEN** zod 在客户端报 "请输入有效邮箱"，不发起 Server Action 请求

#### Scenario: 密码错误时显示 server 错误

- **WHEN** 邮箱/密码不匹配，Server Action 返回 `{ error: "邮箱或密码错误" }`
- **THEN** 页面显示错误提示，表单不清空

#### Scenario: GitHub 按钮触发 OAuth 跳转

- **WHEN** 用户点击"使用 GitHub 登录"
- **THEN** 浏览器跳转到 GitHub OAuth 授权页

### Requirement: signup 页（signup-03 block）

`src/app/[locale]/(auth)/signup/page.tsx` MUST 使用 shadcn `signup-03` block。

页面要求：

- 安装：`npx shadcn@latest add signup-03`
- react-hook-form + zod schema：
  - `email`：`z.string().email("请输入有效的邮箱地址")`
  - `password`：`z.string().min(8, "密码至少 8 位")`
  - `confirmPassword`：与 password 一致性校验（`.refine`）
- 邮箱前置提示：在邮箱字段 helper text 写"请使用真实邮箱，注册后需验证"（**不做**实时 DNS 查询，仅格式 + 文案引导）
- 提交成功后：显示"请查收验证邮件"提示页（不自动登录，等待邮箱验证）
- 链接"已有账号？登录"指向 `/login`

#### Scenario: confirm password 不一致被前端拦截

- **WHEN** 两次密码输入不一致时提交
- **THEN** zod refine 拦截，显示 "两次密码不一致"，不调用 Server Action

#### Scenario: 注册成功后提示查收邮件

- **WHEN** 邮箱/密码格式正确，Server Action signUp 成功
- **THEN** 页面显示"注册成功！请查收 <email> 的验证邮件"，不跳转到 dashboard（需先验证邮箱）

### Requirement: i18n auth 文案

auth 相关 UI 文案 MUST 加入 `messages/en.json`（真实英文内容）与 `messages/zh.json`（占位，value=key），使用 `useTranslations('auth')` 命名空间。

#### Scenario: 切换 locale 后 auth 页面文案对应变化

- **WHEN** 访问 `/zh/login`
- **THEN** 页面渲染 zh.json 中的 auth 文案（占位 key，不报缺失翻译错误）
