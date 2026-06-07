## ADDED Requirements

### Requirement: UI 设计专题主文档

`apps/docs/content/docs/ui-design/index.mdx` MUST 作为 UI 设计专题的入口，阐明为什么 AI Coding Era 的 UI 设计是最大困境之一，以及本专题的知识体系。

内容结构：

- **为什么这个问题如此重要**：AI 时代编码能力被解放，但设计能力瓶颈被放大——没有设计系统约束的 AI 只会产出 AI Slop
- **本专题解决什么问题**：让开发者（和 AI Agent）能够系统性地做出有辨识度、精美、可维护的 UI
- **人 + 机器 + AI Agent 三位一体的新交互范式**：人定方向和审美判断 → AI 生成和实现 → 机器（CI/Impeccable CLI）做确定性质量检测
- **专题地图**：指向设计工作流、CSS 系统、Anti-patterns、研究框架四个子节

#### Scenario: 开发者读完 index.mdx 知道从哪里开始

- **WHEN** 新开发者访问 `/docs/ui-design`
- **THEN** 明确了解 AI Slop 问题、本专题的方法论、以及第一步行动（运行 `impeccable init`）

### Requirement: 设计工作流文档（Impeccable 四步法）

`apps/docs/content/docs/ui-design/workflow.mdx` MUST 记录在 AI Coding Agent 辅助下做 UI 设计的完整工作流，来源于真实实践（`.materials/1-how-to-design-beautiful-ui.md` 和 Impeccable 文档）。

工作流四步（每步说明目的、命令、人的判断点）：

1. **`/impeccable init`**：一次性初始化——采集品牌上下文，生成 `DESIGN.md` 和 `PRODUCT.md`，配置 Live Mode
2. **`/impeccable craft` 或 `/impeccable shape` + `/impeccable craft`**：起稿——AI 根据 DESIGN.md 生成有辨识度的初稿（而非默认模板）。关键：给 AI 明确的风格方向，讨论几轮，定好基调
3. **`/impeccable critique`**：专业审查——AI 站在设计师角度多维度评分（排版/配色/间距/对比度/一致性/可访问性），人来判断采纳哪些建议
4. **`/impeccable polish` + `/impeccable audit`**：打磨——间距/字号/颜色值统一；性能/可访问性/响应式检查
5. **`/impeccable adapt`**：响应式适配——不同断点布局/字体/间距调整

文档 MUST 强调：**AI 提供分析，人做取舍——这是人在设计中不可替代的价值**。

#### Scenario: 开发者按 workflow.mdx 完成一个页面的 UI 设计

- **WHEN** 开发者新建一个页面，按文档步骤操作
- **THEN** 经过 init→craft→critique→polish→adapt 流程，页面 UI 质量明显优于"直接让 AI 写"

### Requirement: CSS 设计系统原理文档

`apps/docs/content/docs/ui-design/css-system.mdx` MUST 记录面向 AI Coding Agent 的 CSS 设计系统设计原理，解释 **为什么** 这样设计，而非只记录 **如何使用**。

内容：

- **为什么 AI Coding Agent 需要 CSS 设计系统**：没有 SSOT，AI 每次生成用不同的颜色/间距，积累后一团混乱
- **OKLCH 色彩空间为什么优于 HSL**：感知均匀性、暗色模式自然过渡、色盲友好
- **语义 token 层**：`color-primary` vs `blue-500`——语义 token 让 AI 做正确选择
- **Tailwind v4 `@theme` 的角色**：把 CSS custom properties 桥接到 Tailwind utility，保持两套系统同步
- **Mobile-first vs Desktop-first**：为什么 H5 优先在 AI Coding Era 更重要（AI 倾向于先写桌面端，需要明确约束）
- **Container queries 的角色**：组件级响应，解耦组件与视口

#### Scenario: 开发者读完 css-system.mdx 知道如何添加新的 token

- **WHEN** 开发者需要新增一个"危险色"语义 token
- **THEN** 知道在 `tokens.css` 中定义 OKLCH 值，在 Tailwind `@theme` 中映射，在 `copilot-instructions.md` 中说明

### Requirement: Anti-patterns 文档（AI Slop 检测）

`apps/docs/content/docs/ui-design/anti-patterns.mdx` MUST 记录 AI 产生的常见 UI 缺陷（AI Slop）及其检测方法，对应 Impeccable 的 27 条确定性规则。

内容分类：

- **AI Slop 外观特征**（7 类明确禁止，来自 DESIGN.md）：字体、渐变、卡片嵌套、颜色、动画、发光效果、icon tile 模式
- **技术质量问题**（a11y / 性能 / 响应式）：对比度不足、触摸目标过小、图片未优化、水平滚动
- **自动检测**：`npx impeccable detect src/`（CLI，无需 API key，确定性检测）
- **人工审查清单**：在 code review 时检查 UI 的 checklist

#### Scenario: 团队 CI 集成 Impeccable CLI 检测 AI Slop

- **WHEN** CI 运行 `npx impeccable detect src/ --json`
- **THEN** 检测报告输出为 JSON，可被 CI 判断是否 fail

### Requirement: 素材搜索与深度调研执行框架（研究子专题）

`apps/docs/content/docs/ui-design/research/index.mdx` MUST 定义**给实现 LLM（deepseek/qwen）的素材搜索与深度调研执行框架**。

> ⚠️ 本文档是**方法论框架**，不是研究结果。规划 LLM 不执行搜索，实现 LLM 按此框架执行。

框架结构：

**一、研究目标与边界定义**

- 核心问题：在 AI Coding Era，如何让 AI Coding Agent 做出有辨识度、精美、可维护的 UI？
- 解决的边界：仅关注"人类设计师 + AI Agent 协作做 UI"的工作流和工具，不涉及纯人工设计流程
- 不研究：纯设计工具（Figma 技巧）、前端框架选型、后端系统

**二、搜索策略**

- 主题关键词（英文）：`AI coding agent UI design`, `design system for LLM`, `CSS architecture AI era`, `OKLCH design tokens`, `Impeccable design skill`, `frontend-design skill Claude`
- 主题关键词（中文）：`AI Coding Agent UI设计`, `AI辅助前端设计`, `设计系统 LLM`, `AI时代CSS规范`
- 搜索渠道优先级：① GitHub（stars > 500）→ ② arXiv（CSS/UI/HCI 方向）→ ③ 专家 blog（Paul Bakaus/Josh W Comeau/Adam Wathan）→ ④ X/Twitter（UI/CSS 社区）→ ⑤ HN/Reddit（讨论帖）

**三、素材质量过滤标准**

- 优先：有可执行 workflow（有命令/步骤/工具），有 before/after 案例，有 GitHub 仓库（可 star 数量验证）
- 次优：有系统性原理论述（非仅观点），有设计师或工程师真实实践记录
- 过滤掉：纯理论 / 无具体指导 / 发布时间早于 2023 / 纯 Figma 教程 / 纯 CSS 框架介绍

**四、重点关注领域**

1. **设计系统 + LLM 理解性**：如何让 LLM 理解设计意图（token 命名、DESIGN.md 等）
2. **AI Slop 检测与预防**：反模式识别，自动化检测工具
3. **人机协作 UI 工作流**：哪些步骤必须人介入，哪些可以 AI 自主
4. **CSS 架构现代实践**：OKLCH、container queries、cascade layers（@layer）
5. **H5/移动端 AI 设计挑战**：AI 倾向写桌面端，如何强制 mobile-first

**五、深度调研路径**

1. 读 Impeccable 的 7 个 domain reference files（typography / color / spatial / motion / interaction / responsive / ux-writing）→ 提炼核心原则
2. 读 Anthropic frontend-design SKILL.md → 对比 Impeccable 的增强点
3. 搜索 "CSS design tokens AI" + "OKLCH" → 找实践案例
4. 搜索 GitHub "design system copilot instructions" → 找真实项目的 AI 引导规范

**六、研究输出格式**

- 每条素材：来源 URL / 标题 / 核心洞察（1-3 句）/ 可直接行动的结论
- 输出文件：`apps/docs/content/docs/ui-design/research/findings.mdx`（由实现 LLM 创建，本框架文档不创建）

#### Scenario: 实现 LLM 按框架执行搜索后输出结构化 findings

- **WHEN** deepseek/qwen 按 research/index.mdx 执行搜索调研
- **THEN** 产出 `findings.mdx`，每条素材含 URL + 核心洞察 + 可行动结论，符合过滤标准

#### Scenario: 框架文档本身不包含任何研究结果

- **WHEN** 读取 `research/index.mdx`
- **THEN** 只有方法论（搜索策略、过滤标准、调研路径），不含任何具体 URL 或结论
