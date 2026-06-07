## Context

`apps/web/` 已有：shadcn/ui（含 Tailwind v4）、四层目录契约、Supabase Auth、next-intl、`@tabler/icons-react`、`lucide-react`。平台 `apps/docs/` 已有 Fumadocs 文档站，`content/docs/` 下有 builder-workflow、changelog、roadmap、skills、templates、cli 等子节。

**实现分工**：规划（Claude）→ 实现（deepseek v4 pro / qwen max）→ 独立分支 `feat/add-landing-page-and-ui-design-system`。

## Goals / Non-Goals

**Goals:**

- Landing page（6 个 section）+ Impeccable skill + `DESIGN.md`
- CSS 设计 token 体系（OKLCH + 语义层 + Tailwind v4 `@theme`）+ next-themes 多主题
- Mobile-first 响应式规范写入 `copilot-instructions.md`
- 平台 `apps/docs` UI 设计专题（5 个文档：index / workflow / css-system / anti-patterns / research/index）

**Non-Goals:**

- Stripe payments / 真实定价（占位）
- 自定义图形设计
- 实际素材搜索调研（框架定义，实现 LLM 执行）

## Decisions

### D1. Tailwind v4 CSS token 策略：语义层隔离，不覆盖 shadcn 变量

shadcn/ui 使用 `--background`、`--foreground`、`--primary` 等 CSS 变量（Tailwind v4 @theme 风格）。tokens.css 使用 `--color-surface`、`--color-primary`（前缀 `color-`）作为语义层，**不覆盖** shadcn 的变量——两套系统并存，Tailwind `@theme` 中同时注册两套，shadcn 组件用 shadcn 变量，自写组件用 `color-*` 语义 token。

实现时：shadcn 的深色模式用 `.dark` class，next-themes 的 `attribute="class"`（而非 `data-theme`），保持与 shadcn 一致。tokens.css 的深色主题改为 `.dark` 选择器。

### D2. 字体选择：Geist Sans（Next.js 官方推荐，内置优化）

`next/font/google` 加载 `Geist` 字体（Next.js 15/16 默认推荐，非 Inter 烂大街），heading 使用 Geist，body 使用 Geist 同族。Geist 有辨识度且与 Next.js 深度集成（自动子集化、无 FOUT）。在 DESIGN.md 中明确记录此选择，AI 不得自行改为 Inter。

### D3. Landing page 实现策略：shadcn blocks 优先，手写组件次之

1. 先查 `npx shadcn@latest add` 可用的 blocks，能用就用（hero-section-01 等）
2. 无对应 block 时，用 shadcn Card/Button/Badge 组合写 Section 组件，放 `src/components/landing/` 目录
3. 所有 landing section 组件都是 Server Components（无 `"use client"`），CTA 按钮的跳转用 Link，不需要 JS

### D4. Impeccable 安装位置：`apps/web/.github/skills/`

Impeccable skill 文件放 `apps/web/.github/skills/impeccable/`，对应 GitHub Copilot 的 skills 读取路径（与平台 `.github/skills/` 隔离）。实现命令：`cd apps/web && npx impeccable skills install`。

### D5. DESIGN.md 位置：`apps/web/DESIGN.md`（Impeccable 标准位置）

Impeccable 的 `init` 命令在项目根生成 DESIGN.md，这里是 `apps/web/DESIGN.md`。DESIGN.md 不进 gitignore，作为设计决策的版本管理文档。

### D6. next-themes：attribute="class"，与 shadcn 一致

shadcn 的深色模式基于 `.dark` class（`class` attribute），next-themes 设置 `attribute="class"` 与之一致，`ThemeProvider` 包裹 `[locale]/layout.tsx` 的内容区（不包裹 HTML 根，避免 SSR hydration 问题）。

### D7. Mobile-first 规范写入 copilot-instructions，作为 AI 硬约束

在 `apps/web/.github/copilot-instructions.md` 新增"Responsive Design Rules"节，明确：

- DEFAULT：写移动端样式（无前缀 Tailwind 类）
- ENHANCEMENT：桌面端用 `md:` / `lg:`
- FORBIDDEN：`max-md:` / `max-lg:` 降级写法；硬编码 `px` 值（Section 间距用 `clamp()`）
- TOUCH TARGETS：按钮/链接最小 `min-h-[44px] min-w-[44px]`

### D8. 平台 docs 的 UI 设计专题：5 个文档，全部英文（中文注释占位）

平台 `apps/docs` 的 UI 设计专题用英文写（与其他 docs 一致），技术术语不翻译，复杂概念加中文注释行说明。研究框架文档（`research/index.mdx`）是唯一纯方法论文档，无研究结果，由实现 LLM 在调研完成后创建 `findings.mdx`。

### D9. (public) route group：landing page 与 (auth) / (protected) 明确分离

新增 `src/app/[locale]/(public)/` route group，landing page 在 `(public)/page.tsx`（实际作为 `[locale]` 的 index 页，通过 `src/app/[locale]/page.tsx` 重定向或直接渲染）。

实现上：`[locale]/page.tsx` 直接渲染 landing page 内容（无需单独 route group），`(public)` 只是逻辑标注，不改变路由路径。如果 next-intl 的 locale layout 已处理，则 `[locale]/page.tsx` 就是 landing page。

## Risks / Trade-offs

- [Tailwind v4 `@theme` 与 shadcn CSS variables 冲突] → D1 明确用语义层隔离，shadcn 用 `--primary`，自写组件用 `--color-primary`，测试中验证 Button 和 Input 不受影响
- [Geist 字体加载失败降级] → `next/font` 的 `fallback` 设置为 `['system-ui', 'sans-serif']`，DESIGN.md 中记录 fallback 链
- [Impeccable CLI detect 在 CI 中误报] → 先 `--fast`（正则，无 LLM）运行，输出 JSON 供人工判断，不设为 CI hard fail（MVP 阶段）
- [research/index.mdx 与 findings.mdx 的边界] → index.mdx 不含任何 URL 或具体素材（验收时检查）；findings.mdx 由实现 LLM 执行调研后创建

## Migration Plan

1. `git checkout -b feat/add-landing-page-and-ui-design-system`
2. 安装依赖：`next-themes`；Geist 字体（next/font，无需 npm 安装）
3. 在 `apps/web` 运行 `npx impeccable skills install`（Impeccable skill 写入 `.github/skills/`）
4. 手写 `DESIGN.md`（品牌上下文 + 禁止模式，不用 `impeccable init` 自动生成，因为需要确定性内容）
5. 建立 `src/styles/tokens.css`（OKLCH tokens + Tailwind @theme 映射）
6. 集成 next-themes（ThemeProvider + 主题切换 toggle）
7. 实现 landing page sections（Header/Hero/Features/How-it-works/Pricing Teaser/Footer）
8. 更新 `copilot-instructions.md`（CSS 系统规范 + mobile-first 规则 + AI Slop 禁止模式）
9. 创建平台 docs UI 设计专题（5 个 MDX 文档）
10. 验收（见 tasks.md）→ PR → merge → delete branch

## Open Questions

（无——D1–D9 已覆盖关键决策）
