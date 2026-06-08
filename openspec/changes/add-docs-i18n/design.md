## Context

`apps/docs/` 基于 Fumadocs 16.x，当前单语言英文路由（`/docs/...`）。需升级为 i18n 双语路由（`/zh/docs/...` + `/en/docs/...`），默认中文。这是架构级变更，涉及 source 配置、路由层、所有现有内容文件的路径变更、以及 openspec-docs-sync 输出路径。

**前置依赖**：`improve-docs-ux` 已完成（search 和 chat 修复，content 结构稳定）。

**分支**：`feat/add-docs-i18n`（独立，不与其他 feature 并行）。

**风险等级**：高（全量路由变更）。

## Goals / Non-Goals

**Goals:** i18n 双语路由、内容目录双语结构、语言切换器、openspec-docs-sync 路径适配
**Non-Goals:** 翻译现有内容、自动语言检测、URL 参数切换语言

## Decisions

### D1. 内容目录结构：使用 `content/docs/zh/` + `content/docs/en/`（物理目录分离）
Fumadocs 16.x i18n 推荐 `source.config.ts` 配置 `dir: 'content/docs'` + `i18n: true`，然后在目录内用语言子目录或文件名后缀区分。选择**目录分离**（`zh/` + `en/`）而非文件名后缀（`index.zh.mdx`），原因：目录结构清晰，VS Code 文件夹折叠更直观，Fumadocs 官方示例也推荐此方式。

### D2. 默认语言中文（zh）
中文用户是首要受众，`defaultLanguage: 'zh'`。访问 `/docs` → redirect `/zh/docs`；未来 SEO 如需英文优先，再调整。

### D3. 英文内容：现有内容迁移到 `en/`，不重写
现有 MDX 文件（英文）整体 `git mv` 到 `content/docs/en/`，保留 git history。`zh/` 下的中文文档为新编写（已有中文部分如 ui-design 中文段落迁移过去）。

### D4. 无中文版的旧文档：zh/ 创建占位文件
不让构建失败，也不让侧边栏有"断链"。占位文件格式：
```mdx
---
title: CLI（英文版，待翻译）
---

此文档的中文版本正在建设中，请[查看英文版](/en/docs/cli)。
```

### D5. LanguageSelect：使用 Fumadocs 内建组件
在 `app/[lang]/docs/layout.tsx` 的 `<DocsLayout>` 中，通过 `i18n` prop 或 Fumadocs 导航配置加入语言切换器。具体 API 根据 Fumadocs 16.x 文档确认（实现时查阅）。

### D6. openspec-docs-sync 输出路径：改为 `zh/changelog/` 和 `zh/roadmap/`
在 `packages/openspec-docs-sync/src/` 中找到输出路径配置，从 `content/docs/changelog` 改为 `content/docs/zh/changelog`。

### D7. 内部链接审查：全量 grep 替换
i18n 路由完成后，在 `apps/docs/` 内所有 MDX 文件和 `.tsx` 中，将 `href="/docs/` 格式的绝对链接改为 `href="/zh/docs/`（或使用相对链接）。利用 grep 工具全量查找，不遗漏。

## Migration Plan

1. `git checkout -b feat/add-docs-i18n`（必须在 `feat/improve-docs-ux` merge 后创建，或从该分支 rebase）
2. 更新 `source.config.ts`：启用 i18n
3. 更新 `lib/source.ts`：适配 i18n source
4. 路由重构：`app/docs/` → `app/[lang]/docs/`（包括 layout、page、og、llms 等所有相关路由）
5. 根路由 redirect：`app/page.tsx` redirect 到 `/zh`
6. 内容目录重构：`git mv content/docs/*.mdx content/docs/en/`，创建 `zh/` 目录和中文/占位文件
7. 更新 openspec-docs-sync 输出路径
8. 内部链接全量替换（grep `href="/docs/`）
9. `pnpm check-types` + `pnpm build` 通过
10. 回归测试（中英文路由、search、chat、语言切换器、og、llms.txt）

## Open Questions

- Q1: Fumadocs 16.x `<LanguageSelect>` 的准确 API（实现时查阅 Fumadocs docs 或源码确认）
- Q2: `app/llms.txt/route.ts` 和 `app/llms-full.txt/route.ts` 是否需要区分语言版本？（暂定：两个语言的内容都输出到同一 llms.txt，由路由决策）
- Q3: `app/og/docs/[...slug]/route.tsx` 的 slug 是否需要包含语言前缀？（暂定：是，`[lang, ...rest]` 解构处理）
