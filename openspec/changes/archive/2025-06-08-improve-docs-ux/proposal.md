---
roadmap-id: web-nextjs-builtin-suite
---

## Why

`apps/docs` 有两个关键功能不可用，以及 UI 设计专题缺乏可落地的实践内容：

1. **Search 不可用（中文内容无法搜索）**：`/api/search/route.ts` 的 Orama 配置 `language: 'english'`，导致中文文档内容无法被正确分词和索引。随着 docs 内容越来越多（changelog、ui-design、cli 等），搜索是最高频的导航方式，不可用等于 docs 无从发现。

2. **AI Chat 不可用**：`/api/chat/route.ts` 使用 OpenRouter + burn.hair 代理，但模型名称（`anthropic/claude-3.5-sonnet`）和 burn.hair 支持的模型 ID 可能不匹配；同时缺少 `OPENROUTER_MODEL` 环境变量配置说明，实现 LLM 无法正确调试。

3. **UI 设计专题缺实践内容**：`research/index.mdx` 定义了调研框架，但执行 LLM 从未按框架执行素材搜集和深度调研。缺少可落地的实践教程（当前只有理论）。用户最需要的是：看了就能照着做、能应用到当前项目和 web-nextjs 模板的操作指南。

## What Changes

- **Search 修复**：更新 `search/route.ts` 的 Orama 语言配置，支持中英文混合内容搜索
- **Chat 修复**：
  - 验证并修正 `chat/route.ts` 的模型名称（burn.hair 兼容格式）
  - 将 `OPENROUTER_MODEL` 添加到 `.env.local.example`（或 `.env.example`），说明可用模型列表
  - 添加 chat 错误边界：当 API key 未配置时给出明确提示，不静默失败
- **UI 设计专题实践内容**：
  - `research/findings.mdx`：由执行 LLM 按 `research/index.mdx` 框架执行后产出（素材记录 + 分析）
  - `ui-design/tutorial.mdx`：基于 findings 产出的综合实践教程（对新手友好，可直接应用到项目）

## Capabilities

### New Capabilities

- `docs-search-fix`：Search 支持中英文混合，中文文档可被正确搜索
- `docs-chat-fix`：AI Chat 可用，模型配置正确，错误边界清晰
- `ui-design-research-execution`：执行 LLM 按研究框架完成素材搜集调研，产出 findings + 实践教程

### Modified Capabilities

- `ui-design-docs`：新增 `research/findings.mdx`（调研产物）和 `tutorial.mdx`（实践教程）

## Non-goals

- **不做** Fumadocs 双语 i18n 路由重构（独立 change：`add-docs-i18n`）
- **不改** search UI 组件（Fumadocs 内建，仅修 API 层）
- **不实现** 自建搜索索引（继续用 Fumadocs + Orama，修语言配置即可）
- **不做** chat 功能的 RAG 升级（当前 flexsearch 方案继续使用）
- **不实现** 用户反馈、chat 历史持久化

## Roadmap & Sequence

- Roadmap 锚点：`web-nextjs-builtin-suite`（Now，in-progress）
- 顺序：`add-landing-page-and-ui-design-system` 之后；本 change 完成后，docs 站 search 和 chat 可用，UI 设计专题有实践内容；`add-docs-i18n` 在此之后独立进行

## Impact

- 影响范围：`apps/docs/app/api/search/`、`apps/docs/app/api/chat/`、`apps/docs/content/docs/ui-design/`
- 分支：`feat/improve-docs-ux`
- 风险：burn.hair 的模型兼容性需要运行时验证；Orama 中文分词效果可能不如专用中文搜索引擎，但对文档站够用
