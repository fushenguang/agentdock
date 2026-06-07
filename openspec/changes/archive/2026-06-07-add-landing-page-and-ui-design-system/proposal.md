---
roadmap-id: web-nextjs-builtin-suite
---

## Why

三个紧密关联的问题，本 change 一并解决：

**问题一：模板没有对外可展示的入口**
用户访问首页只看到 login 页面，无法了解产品、无法建立信任、无法驱动注册——没有 landing page，模板作为 SaaS starter 就是残缺的。

**问题二：AI Coding Agent 做出来的 UI 千篇一律（AI Slop）**
让 AI 直接生成 UI，得到的是 Inter 字体 + 紫蓝渐变 + 卡片套卡片 + 发光深色模式。这是 AI Slop——看上去精致但没有灵魂、没有辨识度，一眼就认出来是 AI 做的。根本原因：没有设计系统约束 AI，AI 只能用它训练数据里最常见的模板。

**问题三：团队不知道如何让 AI Coding Agent 做出精美、有辨识度的页面**
这是整个 AI Coding Era 最普遍的困境之一：工具有了，但工作流、设计规范、如何"管理"AI 设计团队的方法论还是空白。

本 change 的解法：

- **Landing page**：用 shadcn blocks 快速搭建，但在 Impeccable 设计工作流约束下完成，避免 AI Slop
- **UI 设计系统**：CSS custom properties + OKLCH 色彩 + Tailwind v4 `@theme` + next-themes 多主题 + mobile-first H5 响应式，构建 AI Coding Agent 可理解、可遵循的 CSS 规范体系；`DESIGN.md` 作为 AI 的设计上下文锚点
- **平台 `apps/docs` 新增 UI 设计专题**：沉淀"AI 时代如何设计精美 UI"的知识，涵盖设计工作流（Impeccable 四步法）、CSS 设计系统原理、人+机器+AI agent 三位一体的新交互范式，以及给实现 LLM 的素材搜索与深度调研执行框架（规划层给方法论，研究执行由实现 LLM 完成）

## What Changes

- **`templates/web-nextjs/apps/web/`**：
  - 安装 Impeccable skill（`.github/skills/impeccable/`）
  - 新建 `DESIGN.md`（品牌上下文 + 设计决策 + 禁止使用的 AI Slop 模式）
  - 建立 CSS 设计系统（`src/styles/tokens.css`：OKLCH 色彩 token + 间距 + 字体；Tailwind v4 `@theme` 映射；`next-themes` 多主题）
  - Landing page（`src/app/[locale]/(public)/`）：Hero + Features + How-it-works + CTA + Footer sections，shadcn blocks + Impeccable `craft`/`critique`/`polish`/`adapt` 工作流
  - `copilot-instructions.md` 更新：加入 CSS 设计系统规范和禁止的 AI Slop 模式
- **`apps/docs/content/docs/ui-design/`**（平台文档站新专题）：
  - 概览：为什么 AI 时代 UI 设计是最大困境之一
  - 设计工作流：人+机器+AI agent 三位一体，Impeccable 四步法
  - CSS 设计系统：AI Coding Agent 友好的 CSS 规范原理
  - 禁止模式（Anti-patterns）：27 条 AI Slop 检测规则
  - 研究子专题：素材搜索与深度调研执行框架（方法论文档，由实现 LLM 执行）

## Capabilities

### New Capabilities

- `landing-page`：公开 landing page（`/(public)/` route group），包含 Hero / Features / How-it-works / CTA / Footer，shadcn blocks + Impeccable 工作流，i18n 支持
- `ui-design-system`：CSS 设计系统（OKLCH tokens + Tailwind v4 `@theme` + next-themes + mobile-first responsive）+ `DESIGN.md` AI 上下文锚点 + Impeccable skill 安装
- `ui-design-docs`：平台 `apps/docs` UI 设计专题（工作流 + CSS 系统原理 + anti-patterns + 研究执行框架）

### Modified Capabilities

- `template-self-config`：`DESIGN.md` 新增；`copilot-instructions.md` 加入设计系统规范；`AGENTS.md` 声明 Impeccable 工作流为合法操作

## Non-goals

- **不做** Stripe payments / 定价页真实接入（定价区块为占位，payments 是下一个 change）
- **不做**自定义图形设计、插图、自制 icon
- **不做** landing page 的 A/B 测试框架
- **不做**平台 UI 设计文档的全双语（英文主，中文占位）
- **不做**实际的素材搜索和调研（研究框架文档定义 HOW，实现 LLM 负责 DO）
- **不做** Impeccable 的所有 23 个命令的完整集成，MVP 只用 4 个核心命令（craft/critique/polish/adapt）

## Roadmap & Sequence

- Roadmap 锚点：`web-nextjs-builtin-suite`（Now，in-progress）
- 顺序：`add-user-account-features` 之后；本 change 完成后，模板有完整的对外展示入口，CSS 设计系统到位，AI 做 UI 有规范可循；下一个 change（Stripe payments）依赖 landing page 的定价区块

## Impact

- 影响范围：`templates/web-nextjs/apps/web/`（新增 landing page + CSS 系统 + Impeccable）；`apps/docs/content/docs/ui-design/`（平台文档新专题）
- 分支：`feat/add-landing-page-and-ui-design-system`（独立分支开发，PR 合并到 main）
- 风险：Tailwind v4 `@theme` 与 shadcn CSS variables 命名冲突 → 在 tokens.css 中使用语义层做隔离，不直接覆盖 shadcn 的 `--background`/`--foreground` 等变量
