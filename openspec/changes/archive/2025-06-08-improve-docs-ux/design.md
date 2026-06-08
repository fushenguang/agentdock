## Context

`apps/docs/` 基于 Fumadocs 16.x，Orama 本地搜索，AI Chat 用 OpenRouter（burn.hair 代理）+ flexsearch。TypeScript 无错误，问题是运行时：① Orama `language: 'english'` 导致中文失效；② chat 模型 ID 和错误处理；③ UI 设计专题只有框架无实践内容。

**实现分工**：修复（低复杂度，deepseek/qwen 实现）+ 研究执行（实现 LLM 按框架调研，产出 findings + tutorial）。分支：`feat/improve-docs-ux`。

## Goals / Non-Goals

**Goals:** Search 中文支持、Chat 运行可用、`.env.local.example`、UI 设计 findings + tutorial
**Non-Goals:** i18n 双语路由、RAG 升级、chat 历史持久化、search UI 改动

## Decisions

### D1. Search：移除 `language: 'english'`，不指定语言

Orama 在 `language: undefined` 时使用通用分词（空格/标点），对中英文混合的技术文档效果足够好。不引入专用中文分词库（如 `nodejieba`），避免增加 native 依赖复杂度。

如果效果不满足（搜索准确率低），升级路径：① 改用 `language: 'chinese'`（Orama 内置简单中文支持）→ ② 引入 `@orama/plugin-analytics`。此为后续 change 的事。

### D2. Chat：实现时在 burn.hair 控制台确认可用模型列表

实现 LLM 在实现 task 2.2 时，MUST 登录 burn.hair 控制台查看可用模型列表，选择一个默认模型（推荐优先选 deepseek 或 qwen 系列，成本低且中文能力强），写入 route.ts 默认值。`OPENROUTER_MODEL` 作为环境变量可覆盖。

### D3. Chat 错误处理：启动时检查必要 env，缺失时 early return 400

在 `POST /api/chat` 函数开头：

```ts
if (!process.env.OPENROUTER_API_KEY) {
  return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY is not configured' }), {
    status: 400,
  })
}
```

Chat UI 组件（`components/ai/search.tsx`）已有基本错误处理，检查是否需要针对 400 增加用户提示。

### D4. `.env.local.example` 新建（不含真实密钥）

在 `apps/docs/` 根创建 `.env.local.example`：

```bash
# OpenRouter / burn.hair 配置
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_BASE_URL=https://burn.hair/v1  # 或其他 OpenRouter 兼容代理
OPENROUTER_MODEL=deepseek/deepseek-chat   # 可选，默认见 route.ts
```

`.env.local` 已在 `.gitignore` 中，`.env.local.example` 进版本管理。

### D5. Tutorial 和 findings 使用中文编写

与 `research/index.mdx` 的英文框架不同，`findings.mdx` 和 `tutorial.mdx` 使用**中文**编写（与当前 docs 的语言策略一致：开发阶段默认中文）。技术术语保留英文（CSS、OKLCH、Impeccable 等）。

### D6. Tutorial 章节顺序与时间估算

每章标注预计时间（环境准备 15min / 第一个页面 30min / CSS 系统实战 20min / 响应式 20min / Slop 检测 15min / 应用到项目 10min），总计约 1.5 小时——对新手来说合理的一个下午学习量。

## Migration Plan

1. `git checkout -b feat/improve-docs-ux`
2. 修复 search（1 行改动）
3. 修复 chat（模型 ID + 错误处理 + `.env.local.example`）
4. 执行 UI 设计调研（实现 LLM 联网搜索 + 阅读 materials）→ 产出 findings.mdx
5. 基于 findings 编写 tutorial.mdx
6. 更新 `ui-design/meta.json` 加入 tutorial 和 research/findings 导航入口
7. 验收 → PR → merge

## Open Questions

（无）
