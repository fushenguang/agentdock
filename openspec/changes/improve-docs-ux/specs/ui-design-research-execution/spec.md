## ADDED Requirements

### Requirement: 研究执行产物（findings.mdx）

执行 LLM MUST 按 `research/index.mdx` 中的框架执行素材搜集与深度调研，产出 `research/findings.mdx`。

**执行任务指令（给实现 LLM）**：

按 `research/index.mdx` 定义的搜索策略和过滤标准，执行以下调研：

1. **搜索并收集素材**（参考渠道：GitHub stars>500 → 专家 blog → arXiv HCI → HN/Reddit）
   - 重点主题：① AI Coding Agent + UI 设计工作流；② CSS 设计系统 LLM 可理解性；③ AI Slop 检测和预防；④ OKLCH / Container Queries 现代 CSS 实践；⑤ mobile-first 在 AI Coding Era 的挑战
   - 必读资料：Impeccable 的 7 个 domain reference files（typography/color/spatial/motion/interaction/responsive/ux-writing）、Anthropic frontend-design SKILL.md
   - 参考来源：`.materials/1-how-to-design-beautiful-ui.md`（已有实践经验文章）

2. **每条素材记录格式**（findings.mdx 中每条必须包含）：
   - **来源**：URL / 标题 / 作者 / 日期
   - **是什么**：一句话描述这个资料是什么
   - **为什么被记录**：它解决了什么具体问题，为什么值得关注
   - **核心理念**：1-3 个可提炼的核心观点
   - **面向 AI Coding Agent 的新视角**：在 AI 辅助 UI 设计方面，这个资料提供了什么独特的观点或方法
   - **可行动结论**：直接可以用到项目里的 1-2 条实操建议

3. **输出要求**：
   - 至少 8-12 条高质量素材（符合过滤标准）
   - 按主题分组（工作流 / CSS 系统 / Anti-patterns / 工具）
   - 最后附"综合洞察"段落（跨素材的共同主题和矛盾点）

#### Scenario: findings.mdx 包含完整记录格式

- **WHEN** 读取 `research/findings.mdx`
- **THEN** 每条素材均包含"是什么、为什么、核心理念、AI 视角、可行动结论"五个字段

#### Scenario: findings 按主题分组

- **WHEN** 读取 findings.mdx
- **THEN** 有明确的分组（工作流 / CSS 系统 / Anti-patterns / 工具），便于按需查阅

### Requirement: 综合实践教程（tutorial.mdx）

基于 findings 产出，执行 LLM MUST 编写 `ui-design/tutorial.mdx`——**对新手友好、可直接应用到当前项目和 web-nextjs 模板的完整实践教程**。

**教程要求**：

- **目标读者**：会写 Next.js + Tailwind，但不是设计师，不知道如何让 AI 做出好看的 UI
- **不是理论文章**，每个步骤必须有：
  - 具体命令（`npx impeccable ...`、`pnpm add ...`）
  - 代码示例（真实的 tokens.css 片段、真实的 Tailwind 类）
  - 预期效果（运行后你会看到什么）
  - 常见坑（这一步容易出什么错）

**教程结构**（6 个章节）\*\*：

1. **环境准备**（15 分钟）：安装 Impeccable，创建 `DESIGN.md`，配置 `tokens.css`
2. **第一个页面从零到精美**（30 分钟）：以 landing page Hero section 为例，走完 craft → critique → polish → adapt 完整流程，展示 before/after
3. **CSS 设计系统实战**（20 分钟）：如何添加新的 semantic token，如何在 Tailwind `@theme` 中注册，如何让 AI 用你的 token 而不是 `gray-100`
4. **响应式设计的 AI 陷阱与规避**（20 分钟）：mobile-first 规则如何写进 `copilot-instructions.md`，如何强制 AI 从移动端开始，container queries 用法示例
5. **AI Slop 检测与修复**（15 分钟）：运行 `npx impeccable detect`，识别报告，按优先级修复
6. **把这套方法应用到你的项目**（10 分钟）：在 web-nextjs 模板中快速应用（checklist 形式）

#### Scenario: 新手按教程操作完成第一个精美页面

- **WHEN** 新手按 chapter 2 步骤操作（30 分钟）
- **THEN** 有一个经过 craft→critique→polish→adapt 流程的 Hero section，质量明显优于"直接让 AI 写"

#### Scenario: 教程每个步骤有可执行的命令

- **WHEN** 读取 tutorial.mdx
- **THEN** 每个主要步骤都有 code block 包裹的命令或代码，无纯文字步骤描述
