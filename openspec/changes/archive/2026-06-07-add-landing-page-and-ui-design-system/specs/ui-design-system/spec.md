## ADDED Requirements

### Requirement: CSS 设计 token 体系（AI Coding Agent 可理解）

`apps/web/src/styles/tokens.css` MUST 定义设计 token 体系，作为整个应用的 CSS 单一数据源（SSOT），AI Coding Agent 通过读取 `copilot-instructions.md` 中的 token 规范来选择正确的值，而非随意写 Tailwind 类名。

**色彩系统（OKLCH）**：

```css
@layer base {
  :root {
    /* Brand tokens — 下游项目覆盖这两个变量即可换色 */
    --color-brand-h: 262; /* 色相，OKLCH */
    --color-brand-c: 0.26; /* 饱和度 */
    --color-brand-l: 0.56; /* 亮度 */

    /* Semantic tokens */
    --color-primary: oklch(var(--color-brand-l) var(--color-brand-c) var(--color-brand-h));
    --color-primary-foreground: oklch(0.98 0 0);

    /* Neutral（带色调，不用纯灰） */
    --color-surface: oklch(0.985 0.003 262);
    --color-surface-elevated: oklch(1 0 0);
    --color-muted: oklch(0.94 0.004 262);
    --color-muted-foreground: oklch(0.52 0.012 262);
    --color-border: oklch(0.88 0.006 262);
  }

  [data-theme='dark'] {
    --color-surface: oklch(0.13 0.008 262);
    --color-surface-elevated: oklch(0.18 0.007 262);
    --color-muted: oklch(0.22 0.007 262);
    --color-muted-foreground: oklch(0.62 0.01 262);
    --color-border: oklch(0.28 0.008 262);
  }
}
```

**间距系统**（基于 4px 基线，语义命名）：

- `--space-1: 4px` / `--space-2: 8px` / `--space-4: 16px` / `--space-8: 32px` 等
- Section 间距：`--space-section: clamp(64px, 10vw, 120px)`（响应式）

**字体系统**：

- heading 字体：`Geist` 或 `Plus Jakarta Sans`（非 Inter 独占）
- body 字体：`Inter`（可读性基准，可被覆盖）
- 字号层级：`--text-xs` / `--text-sm` / `--text-base` / `--text-lg` / `--text-xl` / `--text-2xl` / `--text-4xl`

**Tailwind v4 `@theme` 映射**：在 `globals.css` 中用 `@theme` 把 CSS custom properties 注册为 Tailwind utility 类，使 `bg-surface`、`text-muted-foreground`、`border-border` 等可直接使用。

#### Scenario: 下游项目一键换主色

- **WHEN** 下游项目在根 CSS 中覆盖 `--color-brand-h/c/l`
- **THEN** 所有使用 `--color-primary` 的元素自动变色，不需要改代码

#### Scenario: shadcn 组件与 tokens.css 不冲突

- **WHEN** shadcn Button 使用 `--primary` 变量，tokens.css 使用 `--color-primary`
- **THEN** 两套命名空间不冲突，shadcn 正常渲染

#### Scenario: copilot-instructions 中的 token 规范被 AI 遵循

- **WHEN** AI Agent 需要添加背景色
- **THEN** 选择 `bg-surface` 或 `bg-muted`（来自 tokens），不随意写 `bg-gray-100`

### Requirement: next-themes 多主题（light / dark）

`apps/web/` MUST 集成 `next-themes`，支持 light / dark 主题切换，主题切换不触发页面闪烁（SSR-safe）。

- 安装：`pnpm add next-themes`
- `apps/web/src/app/[locale]/layout.tsx` 包裹 `ThemeProvider`（`attribute="data-theme"`，`defaultTheme="system"`）
- 主题切换按钮：集成到 dashboard sidebar 或 landing page nav，使用 `lucide-react` 的 `Sun` / `Moon` icon

#### Scenario: 刷新页面不闪烁（no flash of unstyled content）

- **WHEN** 用户刷新页面（已选 dark 主题）
- **THEN** 页面直接以 dark 主题渲染，不先出现白色再切换

#### Scenario: 系统偏好自动跟随

- **WHEN** 用户系统设置为深色模式
- **THEN** 首次访问页面自动显示 dark 主题

### Requirement: mobile-first 响应式（H5 优先）

CSS 设计系统 MUST 遵循 mobile-first 响应式策略，以 375px 作为最小基准，向上渐进增强。

响应式原则（写入 `copilot-instructions.md`）：

- **默认写移动端样式**，用 `md:` / `lg:` 前缀叠加桌面端增强
- **禁止**先写桌面端再用 `max-md:` 做降级（这是反向响应式）
- Section 间距使用 `clamp()`：`padding: clamp(32px, 8vw, 80px)`
- 字体大小使用 `clamp()`：Hero title `clamp(2rem, 5vw + 1rem, 4rem)`
- 触摸目标最小 `44px × 44px`（链接、按钮）
- Container query 用于组件级响应（`@container`）：Feature Card 在宽容器内自动多列

#### Scenario: landing page 在 375px 无水平溢出

- **WHEN** 在 375px 视口渲染 landing page
- **THEN** `document.documentElement.scrollWidth === window.innerWidth`（无水平滚动）

#### Scenario: Feature Card 在宽容器自动多列

- **WHEN** Features section 容器宽度 > 600px
- **THEN** Feature Card 自动排成 2 列或 3 列（container query 驱动，不依赖视口断点）

#### Scenario: AI Agent 按 mobile-first 原则写样式

- **WHEN** AI 在 copilot-instructions 约束下写 Tailwind 类
- **THEN** 默认写移动端样式（无前缀），桌面端增强用 `md:` / `lg:`，不出现 `max-md:` / `max-lg:` 降级写法
