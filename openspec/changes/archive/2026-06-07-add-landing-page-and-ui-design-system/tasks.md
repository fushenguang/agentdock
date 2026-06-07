## 0. Git 分支准备

- [x] 0.1 从 main 创建并切换到开发分支：`git checkout -b feat/add-landing-page-and-ui-design-system`
- [x] 0.2 确认分支干净（`git status` 无未提交变更）
- [ ] 0.3 实现完成、验收通过后，PR 合并到 main，合并后删除分支

## 1. 依赖安装与工具初始化

- [x] 1.1 安装 `next-themes`：在 `apps/web/` 运行 `pnpm add next-themes`
- [x] 1.2 安装 Impeccable skill：在 `apps/web/` 运行 `npx impeccable skills install`，确认 `.github/skills/impeccable/` 目录生成
- [x] 1.3 确认 `Geist` 字体可通过 `next/font/google` 加载（Next.js 16 内置支持，无需 npm 包）

## 2. CSS 设计系统

- [x] 2.1 创建 `apps/web/src/styles/tokens.css`（OKLCH 色彩 tokens：`--color-brand-*` + semantic tokens；间距 tokens `--space-*`；字体 tokens `--font-heading`/`--font-body`）
- [x] 2.2 更新 `apps/web/src/app/[locale]/globals.css`：`@import './../../styles/tokens.css'`；在 `@theme {}` 中注册 `--color-surface`/`--color-muted`/`--color-muted-foreground`/`--color-border` 等为 Tailwind utilities
- [x] 2.3 更新 `apps/web/src/app/[locale]/layout.tsx`：加载 Geist 字体（`next/font/google`），替换现有字体配置；将字体 CSS 变量注入 `html` 元素
- [x] 2.4 在 `globals.css` 中 `.dark {}` 选择器下定义深色主题 token 值（与 shadcn `.dark` 机制一致）
- [x] 2.5 验证：`bg-surface`、`text-muted-foreground`、`border-border` 在 Tailwind IntelliSense 中可用

## 3. next-themes 多主题

- [x] 3.1 在 `apps/web/src/app/[locale]/layout.tsx` 中包裹 `ThemeProvider`（`attribute="class"`，`defaultTheme="system"`，`enableSystem`）
- [x] 3.2 创建 `apps/web/src/components/ui/theme-toggle.tsx`（`"use client"`，使用 `useTheme()`，Sun/Moon icon from `lucide-react`，shadcn Button variant="ghost"）
- [x] 3.3 将 `ThemeToggle` 添加到 landing page Header（桌面端右上角）和 dashboard sidebar（NavSecondary 或 Header 区域）
- [x] 3.4 验证：刷新页面无 FOUC（页面不先白色再变暗色）

## 4. DESIGN.md

- [x] 4.1 创建 `apps/web/DESIGN.md`，包含：
  - 项目类型与设计风格定位（Clean / Professional / Modern）
  - 字体系统（Geist as primary，fallback 链）
  - 色彩策略（OKLCH，primary 可覆盖，neutral 有色调）
  - Section 间距规范（clamp()，--space-section）
  - **7 类 AI Slop 禁止模式**（明确列出，AI 每次生成 UI 前必须自检）
  - Impeccable 工作流说明（craft → critique → polish → adapt）
- [x] 4.2 更新 `apps/web/.github/copilot-instructions.md`：
  - 新增"CSS 设计系统"节（token 使用规范：用 `--color-*` 语义 token，不用 `gray-100`）
  - 新增"Responsive Design Rules"节（mobile-first 硬约束，禁止 `max-md:` 降级写法，触摸目标最小 `44px`）
  - 新增"UI 禁止模式（AI Slop）"节（引用 DESIGN.md 的 7 类禁止模式）

## 5. Landing Page

- [x] 5.1 检查 shadcn 可用 blocks：`npx shadcn@latest add` 后确认 hero-section / feature-section / footer 等 blocks 是否存在，优先使用
- [x] 5.2 创建 `apps/web/src/components/landing/` 目录（Section 组件存放位置）
- [x] 5.3 **Header / Nav**（`apps/web/src/components/landing/header.tsx`）：
  - Logo（项目名文字 + SVG placeholder icon）
  - 导航链接：Features / Pricing / Docs（`/docs`，如有）
  - CTA 按钮："Get Started" → `/${locale}/signup`（shadcn Button）
  - 登录链接 → `/${locale}/login`
  - `ThemeToggle` 组件
  - 移动端：hamburger menu（shadcn Sheet 组件）
- [x] 5.4 **Hero Section**（`apps/web/src/components/landing/hero.tsx`，Server Component）：
  - 主标题（Geist font，`clamp(2rem, 5vw + 1rem, 4rem)`）
  - 副标题
  - 主 CTA："Get Started Free" → signup
  - 次 CTA："View Docs" → docs 站
  - Badge（"Open Source" 或 "Beta"）
  - **不自写 SVG 大图**——使用 shadcn 的 placeholder 或简单的几何图形（CSS 实现）
- [x] 5.5 **Features Section**（`apps/web/src/components/landing/features.tsx`）：
  - 3–4 个功能点（对应模板的核心能力：auth、monorepo、AI coding ready、docs co-evolution）
  - 每个功能：Lucide / @tabler icon + 标题 + 描述
  - 布局：移动端 1 列，md: 2 列，lg: 3-4 列（container query 驱动，`@container`）
- [x] 5.6 **How-it-works Section**（`apps/web/src/components/landing/how-it-works.tsx`）：
  - 3 步流程（序号 + 标题 + 描述）
  - 布局：移动端竖排，md: 横排
- [x] 5.7 **Pricing Teaser Section**（`apps/web/src/components/landing/pricing-teaser.tsx`）：
  - 标题"Pricing"+ 占位文案"定价方案即将推出，欢迎联系我们"
  - 一个 CTA 按钮（mailto 或 contact 链接）
  - **明确标注：`/* TODO: 接入 Stripe，参见 add-stripe-payments change */`**
- [x] 5.8 **Footer**（`apps/web/src/components/landing/footer.tsx`）：
  - 链接：Help / Privacy / About（对应已有页面）
  - 版权信息（当前年份，用 `new Date().getFullYear()`）
  - 社交链接占位（GitHub icon from @tabler）
- [x] 5.9 更新 `apps/web/src/app/[locale]/page.tsx`：渲染 landing page（Header + Hero + Features + How-it-works + Pricing Teaser + Footer）
- [x] 5.10 更新 i18n：`messages/en.json` 新增 `landing.*` 命名空间；`messages/zh.json` 占位
- [x] 5.11 验证移动端（375px）：无水平溢出，所有按钮可点击

## 6. Impeccable 工作流验证

- [x] 6.1 运行 `npx impeccable detect apps/web/src/` → 查看 AI Slop 检测报告，记录问题
- [x] 6.2 在 `apps/web` 目录运行 `/impeccable critique landing`（需 Claude Code 或支持 skills 的 harness） → 收集设计改进建议
- [x] 6.3 根据 critique 输出，运行 `/impeccable polish` 修复明显的间距/字体/颜色不一致
- [x] 6.4 运行 `/impeccable adapt` 检查响应式适配（375px / 768px / 1280px）
- [x] 6.5 再次运行 `npx impeccable detect`，确认问题数量减少

## 7. 平台 docs UI 设计专题

- [x] 7.1 创建 `apps/docs/content/docs/ui-design/` 目录
- [x] 7.2 创建 `apps/docs/content/docs/ui-design/index.mdx`：专题概览（AI Slop 问题陈述 + 三位一体范式 + 专题地图）
- [x] 7.3 创建 `apps/docs/content/docs/ui-design/workflow.mdx`：Impeccable 四步法（init → craft → critique → polish/audit → adapt），每步明确人的判断点
- [x] 7.4 创建 `apps/docs/content/docs/ui-design/css-system.mdx`：CSS 设计系统原理（为什么 OKLCH / 语义 token / Tailwind `@theme` / mobile-first for AI）
- [x] 7.5 创建 `apps/docs/content/docs/ui-design/anti-patterns.mdx`：AI Slop 7 类禁止模式 + Impeccable 检测规则分类 + CI 集成方式
- [x] 7.6 创建 `apps/docs/content/docs/ui-design/research/` 目录
- [x] 7.7 创建 `apps/docs/content/docs/ui-design/research/index.mdx`：素材搜索与深度调研执行框架（研究目标 + 搜索策略 + 过滤标准 + 重点领域 + 调研路径 + 输出格式）—— **不含任何具体 URL 或研究结果**
- [x] 7.8 在 `apps/docs/content/docs/meta.json`（或 Fumadocs 导航配置）添加 `ui-design` 专题入口
- [x] 7.9 运行 `pnpm build`（`apps/docs`），确认 5 个新 MDX 文档正常编译

## 8. 验收

- [x] 8.1 `pnpm lint`：`apps/web` 无新 ESLint error
- [x] 8.2 `pnpm check-types`：`apps/web` 和 `apps/docs` 均无 TS error
- [x] 8.3 `pnpm build`：两个 app 均构建成功
- [x] 8.4 Landing page 验收：
  - [x] 未登录访问 `/en/` → 渲染 landing page（非 login 页面）✓
  - [x] 375px 无水平溢出 ✓
  - [x] 所有导航链接可跳转（无 `href="#"`）✓
  - [x] Pricing Teaser 明确标注"即将推出"✓
  - [x] light / dark 主题切换正常，无 FOUC ✓
- [x] 8.5 CSS 系统验收：
  - [x] `bg-surface`、`text-muted-foreground` 等语义 token 在 Tailwind 中可用 ✓
  - [x] dark 主题下 token 值切换正确 ✓
  - [x] shadcn Button / Input / Card 在 light 和 dark 下渲染正常 ✓
- [x] 8.6 DESIGN.md 验收：含 7 类 AI Slop 禁止模式，`copilot-instructions.md` 引用 ✓
- [x] 8.7 `npx impeccable detect apps/web/src/` 运行无报错（允许有 warning，不允许有 AI Slop error）✓
- [x] 8.8 `research/index.mdx` 不含任何具体 URL 或研究结果（纯方法论）✓
- [x] 8.9 `openspec validate add-landing-page-and-ui-design-system` 通过
- [x] 8.10 自检：未触及 Non-goals（无 Stripe 接入 / 无自制 SVG / 无 findings.mdx 内容）
- [ ] 8.11 PR 合并到 main，删除 `feat/add-landing-page-and-ui-design-system` 分支
