# landing-page Specification

## Purpose

TBD - created by archiving change add-landing-page-and-ui-design-system. Update Purpose after archive.

## Requirements

### Requirement: 公开路由 group 与 landing page 结构

`apps/web/src/app/[locale]/(public)/` MUST 建立公开 route group，landing page 在 `(public)/page.tsx` 渲染，不受 `(protected)` session 检查影响。

Landing page MUST 包含以下 Section（从上到下）：

1. **Header / Nav**：Logo + 导航链接（Features / Pricing / Docs）+ CTA 按钮（"开始使用"→`/${locale}/signup`）+ 登录链接
2. **Hero Section**：主标题 + 副标题 + 主 CTA + 次 CTA（"查看文档"）+ Hero 视觉（占位图或简单图形，不自写 SVG）
3. **Features Section**：3–4 个核心功能点，图标（Lucide / @tabler）+ 标题 + 描述
4. **How-it-works Section**：3 步流程图示（编号 + 标题 + 描述），展示产品使用路径
5. **Pricing Teaser Section**：占位，标注"定价方案即将推出"（不接入 Stripe，不写真实价格）
6. **Footer**：链接（Help / Privacy / About）+ 版权信息

实现策略：

- 优先使用 `npx shadcn@latest add` 可用的 blocks/components（hero-section, feature-section 等）
- 无对应 block 时，用 shadcn 基础组件（Card / Button / Badge）组合，参考 shadcn 风格，**不自定义 CSS**
- 所有 icon 来自 `lucide-react` 或 `@tabler/icons-react`，**禁止自写 SVG**
- 页面内容文案全部走 i18n（`useTranslations('landing')`）

#### Scenario: 未登录用户访问首页看到 landing page

- **WHEN** 未登录用户访问 `/${locale}/`（或 `/`，next-intl 重定向）
- **THEN** 渲染 landing page（Hero + Features + How-it-works + Pricing Teaser + Footer），不触发 session 检查

#### Scenario: landing page CTA 按钮导向注册

- **WHEN** 用户点击 Hero 区的主 CTA 按钮
- **THEN** 跳转到 `/${locale}/signup`

#### Scenario: landing page 在移动端（375px）可用

- **WHEN** 在 375px 宽度视口访问 landing page
- **THEN** 所有 section 正常渲染，文字不溢出，按钮可点击，无水平滚动

#### Scenario: DESIGN.md 被 Impeccable critique 后 landing page 质量可量化

- **WHEN** 在项目根运行 `/impeccable critique landing`
- **THEN** Impeccable 基于 DESIGN.md 上下文进行审查，给出可执行的改进建议（不是通用建议）

### Requirement: Impeccable skill 安装与 DESIGN.md

`apps/web/.github/skills/` MUST 安装 Impeccable skill（`npx impeccable skills install`），并创建 `DESIGN.md` 作为 AI 的设计上下文锚点。

`DESIGN.md` MUST 包含：

- **项目类型**：SaaS starter template，B2B/B2C 通用
- **设计风格**：Clean / Professional / Modern，不走极简也不走炫技
- **排版系统**：主字体（Inter 仅作 fallback，优先 Geist / Plus Jakarta Sans 等有辨识度字体）、字号层级（heading-xl / heading-lg / body / caption）
- **色彩策略**：基于 OKLCH，primary color 可被下游项目覆盖；neutral 使用带色调的灰色（不用纯灰）
- **禁止的 AI Slop 模式**（明确列出，AI 每次生成 UI 必须检查）：
  - 禁止 Inter + Roboto 字体独占页面
  - 禁止紫色到蓝色渐变（`from-purple-* to-blue-*`）
  - 禁止 `rounded-xl` 卡片套 `rounded-xl` 卡片
  - 禁止纯黑/纯灰文字（必须有色调）
  - 禁止弹跳/弹性动画（bounce / elastic easing）
  - 禁止深色背景 + 霓虹发光 Header 文字
  - 禁止每个标题上方放圆角方形 icon tile

#### Scenario: 新开发者运行 Impeccable audit 无报错

- **WHEN** 在 apps/web 目录运行 `npx impeccable detect src/`
- **THEN** 输出 AI Slop 检测报告，landing page 不触发已知 AI Slop 规则

#### Scenario: AI Agent 读取 DESIGN.md 后不产生 AI Slop 模式

- **WHEN** Copilot 或 deepseek 在 copilot-instructions 约束下生成 UI 代码
- **THEN** 不出现 DESIGN.md 中明确禁止的 7 类模式

### Requirement: i18n landing page 文案

`messages/en.json` MUST 新增 `landing` 命名空间（hero.title / hero.subtitle / features._ / cta._ / nav._ / footer._），`messages/zh.json` 同步添加占位 key。

#### Scenario: 切换 locale 后 landing page 文案对应变化

- **WHEN** 访问 `/zh/` 与 `/en/`
- **THEN** Hero 标题、Features 文案等随 locale 变化，不硬编码字符串
