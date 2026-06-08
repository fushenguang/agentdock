## 0. Git 分支准备

- [x] 0.1 从 main 创建并切换到开发分支：`git checkout -b feat/improve-docs-ux`
- [x] 0.2 确认分支干净（`git status` 无未提交变更）

## 1. Search 修复（改动极小）

- [x] 1.1 编辑 `apps/docs/app/api/search/route.ts`：移除 `language: 'english'`，`createFromSource(source, {})` 或 `createFromSource(source)` （不传 language 选项）
- [x] 1.2 本地重启 `pnpm dev`（docs），在搜索框输入中文关键词（如"认证"、"仓储"、"脚手架"），确认有结果返回
- [x] 1.3 输入英文关键词（如 "auth"、"middleware"），确认仍有结果

## 2. Chat 修复

- [x] 2.1 登录 burn.hair 控制台，查看可用模型列表，选择一个默认模型（推荐 deepseek 系列）
- [x] 2.2 编辑 `apps/docs/app/api/chat/route.ts`：
  - 将默认模型从 `'anthropic/claude-3.5-sonnet'` 改为确认可用的模型 ID
  - 在函数开头添加 API key 缺失检查（early return 400，见 design D3）
- [x] 2.3 新建 `apps/docs/.env.local.example`（格式见 design D4，不含真实密钥）
- [x] 2.4 检查 `components/ai/search.tsx` 的错误处理：400 响应时是否有用户提示；如无，添加简单的 catch 显示"AI 服务暂不可用"
- [x] 2.5 本地测试 chat：发送消息"什么是 builder workflow？"，确认 AI 调用 search tool 并返回引用文档的回答
- [x] 2.6 验证错误场景：临时注释掉 `OPENROUTER_API_KEY`，确认 chat UI 显示错误提示而非空白

## 3. UI 设计调研执行（research/findings.mdx）

> **重要**：本组任务需要实现 LLM **联网搜索**，按 `research/index.mdx` 定义的框架执行调研。

- [x] 3.1 阅读 `apps/docs/content/docs/ui-design/research/index.mdx`（调研框架）
- [x] 3.2 阅读 `.materials/1-how-to-design-beautiful-ui.md`（已有实践经验，作为重要参考）
- [x] 3.3 按框架执行素材搜集（必读来源优先）：
  - Impeccable GitHub README + DESIGN.md + 7 个 domain reference files（typography/color/spatial/motion/interaction/responsive/ux-writing）
  - Anthropic frontend-design SKILL.md
  - 按英文/中文关键词在 GitHub / 专家 blog / HN 搜索，筛选出符合质量标准的素材
- [x] 3.4 创建 `apps/docs/content/docs/ui-design/research/findings.mdx`，按格式记录每条素材（含：是什么 / 为什么被记录 / 核心理念 / AI Coding Agent 新视角 / 可行动结论），至少 8 条，按主题分组，附综合洞察段落
- [x] 3.5 在 findings.mdx 末尾添加"综合洞察"段落：跨素材的共同主题 + 矛盾点 + 对本项目的启示

## 4. 实践教程（tutorial.mdx）

> **基于 findings 内容编写，对新手友好，每步有可执行命令。**

- [x] 4.1 创建 `apps/docs/content/docs/ui-design/tutorial.mdx`，包含 6 个章节：
  - **Chapter 1（15min）环境准备**：安装 Impeccable skill，创建 DESIGN.md（模板内容），配置 tokens.css，更新 copilot-instructions.md
  - **Chapter 2（30min）第一个页面从零到精美**：以 Hero section 为例，展示 `/impeccable craft` → 截图初稿 → `/impeccable critique` → 采纳建议 → `/impeccable polish` → `/impeccable adapt` 的完整流程，包含 before/after 对比说明
  - **Chapter 3（20min）CSS 设计系统实战**：如何添加新 semantic token（含真实 tokens.css 代码片段），如何在 `@theme` 注册，如何在 `copilot-instructions.md` 中说明 token 使用规范让 AI 遵守
  - **Chapter 4（20min）响应式设计的 AI 陷阱**：mobile-first 原则为什么 AI 容易违反，如何写进约束文件，container queries 实战示例（Feature Card 多列）
  - **Chapter 5（15min）AI Slop 检测与修复**：运行 `npx impeccable detect src/`，解读报告，按优先级（error > warning）修复，常见的 5 个 AI Slop pattern 修复示例
  - **Chapter 6（10min）在 web-nextjs 模板中应用**：checklist 形式，5 分钟快速验证你的项目是否已应用本教程的核心原则
- [x] 4.2 每个章节的每个步骤必须包含：可运行的命令或代码 block + 预期效果说明 + 至少 1 条常见坑提示

## 5. 导航更新

- [x] 5.1 检查 `apps/docs/content/docs/ui-design/` 目录是否有 `meta.json`，若无则创建
- [x] 5.2 在 `meta.json` 或 Fumadocs source 配置中，添加 `tutorial` 和 `research/findings` 的导航入口（在 research/index 之后）

## 6. 验收

- [x] 6.1 Search：中文搜索"认证"有结果；英文搜索"auth"有结果；`pnpm build` 无搜索相关报错
- [x] 6.2 Chat：发送消息可正常得到 AI 回复，回答引用 docs 内容；key 缺失时显示错误提示
- [x] 6.3 `.env.local.example` 存在且不含真实密钥，格式正确
- [x] 6.4 `findings.mdx`：至少 8 条素材，每条含 5 个字段，按主题分组，含综合洞察
- [x] 6.5 `tutorial.mdx`：6 个章节，每个步骤有命令/代码 block，对新手可独立跟随完成
- [x] 6.6 `pnpm check-types`（docs）无错误；`pnpm build`（docs）成功
- [x] 6.7 `openspec validate improve-docs-ux` 通过
- [ ] 6.8 PR 合并到 main，删除 `feat/improve-docs-ux` 分支
