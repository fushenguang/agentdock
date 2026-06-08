---
roadmap-id: web-nextjs-builtin-suite
---

## Why

`apps/docs/` 当前是英文为主的单语言文档站，但 AgentDock 的核心用户群（尤其是开发阶段）以中文使用者为主。已有部分文档用中文编写（如 `llm-eval/`、`roadmap/` 的中文内容），但没有系统的双语支持：不同文档混用中英文，用户无法按偏好切换语言，缺乏一致性体验。

目标：Fumadocs 双语路由（`/zh/docs/...` + `/en/docs/...`）+ 默认中文 + 开发阶段只写中文（英文占位），商用前再补全英文内容。

已有英文内容保留，不删除或降级。

## What Changes

- **Fumadocs i18n 路由配置**：`source.config.ts` 启用 `i18n` 选项，`lib/source.ts` 适配 i18n source，路由从 `/docs/...` 变为 `/zh/docs/...`（默认）和 `/en/docs/...`
- **内容目录结构调整**：`content/docs/` 下每个 MDX 文件对应中英两版（如 `index.zh.mdx` + `index.en.mdx`），或用 Fumadocs i18n 推荐的目录结构（`content/docs/zh/` + `content/docs/en/`）
- **默认语言**：中文（`defaultLanguage: 'zh'`），访问 `/docs/...` 重定向到 `/zh/docs/...`
- **英文版占位**：现有英文内容移入 `en/` 结构，中文版为新文档的主版本；对只有英文的旧文档，中文版可以是简单占位（`<!-- 中文版正在翻译中 -->`）
- **语言切换器**：Fumadocs 内建 `<LanguageSelect>` 组件，加入 docs 布局
- **Search 双语支持**：基于 `improve-docs-ux` 的 search 修复（中英文混合已支持），不需要额外改动

## Capabilities

### New Capabilities

- `docs-i18n-routing`：Fumadocs 双语路由（zh/en），默认 zh，LanguageSelect 切换器

### Modified Capabilities

- `docs-search-fix`（来自 `improve-docs-ux`）：i18n 后 search route 需适配多语言 source
- `ui-design-docs`：中文内容迁移到 `zh/` 结构，`en/` 为占位

## Non-goals

- **不翻译**现有英文内容为中文（反之亦然）——各版本独立维护，不做机器翻译
- **不做**自动语言检测（用户主动切换）
- **不做** URL 参数语言切换（只用路径前缀 `/zh/` / `/en/`）
- **不改**搜索 UI 的语言（Fumadocs 内建，跟随系统/浏览器偏好）

## Roadmap & Sequence

- Roadmap 锚点：`web-nextjs-builtin-suite`（Now，in-progress）
- 顺序：**必须在 `improve-docs-ux` 之后**（search 修复是前提；content 结构调整涉及所有 MDX 文件，需在稳定状态上操作）
- 风险等级：**高**（涉及所有现有 MDX 文件路径，路由全量变更，需完整回归测试）

## Impact

- 影响范围：`apps/docs/` 全量（source.config.ts / lib/source.ts / app/ 路由 / content/docs/ 所有文件路径）
- 分支：`feat/add-docs-i18n`（独立分支，不与任何其他 feature 并行）
- 风险：Fumadocs i18n 配置复杂，路由变更后所有内部链接（`href="/docs/..."` 格式）需要全量检查；changelog/roadmap 自动生成的 MDX（来自 openspec-docs-sync）需要适配 i18n 结构
