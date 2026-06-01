---
roadmap-id: growth-trace-docs
---

## Why

我们要让项目的"成长轨迹"清晰明确：OpenSpec changes 是 Single Source of Truth，但它对人和外部 LLM 不友好。需要把归档的 changes 与人拥有的 roadmap **投影**到 `apps/docs`，形成可读的演化历史与 changelog，并产出 `llms.txt`/`llms-full.txt` 落地 GEO 的可理解性基础。这是 ADR/Intent 作为"真正资产"的载体。

## What Changes

- 新增 `packages/openspec-docs-sync`：读取 `openspec/changes/`（及归档）→ 生成 `apps/docs` 的 changelog 内容；读取 `roadmap.yaml` → 生成 roadmap 页内容。
- 生成 `llms.txt`（索引，不是全文）与 `llms-full.txt`（压缩全文），遵循 llms.txt 规范。
- `apps/docs` 新增两个页面：**roadmap 页**（从 `roadmap.yaml` 渲染）与 **changelog 页**（从 changes 投影）。
- 同步在合适时机执行（与 ②③ 的 CI/对齐接线协调，作为 docs-build 步骤）。
- 搜索/检索默认走本地 Orama（不依赖 Algolia，规避国内不稳定）。

## Capabilities

### New Capabilities

- `openspec-docs-sync`: `packages/openspec-docs-sync` 同步引擎 + `llms.txt`/`llms-full.txt` 生成。
- `docs-growth-pages`: `apps/docs` 的 roadmap 页与 changelog 页（从 roadmap.yaml 与 changes 投影）。

### Modified Capabilities

- （无；`apps/docs` 由 ① 建立定位，此处新增页面与数据源）

## Non-goals

- 不实现 Fumadocs MCP Server（对外可发现性/即时可得，需有外部受众，押后）。
- 不实现 Skills 系统及其文档投影（独立、押后）。
- 不做对外 GEO 推广（先内部）。
- 不实现 change frontmatter 的 `ai_context` 全套写作规范工具链，MVP 仅做基础字段投影。
- 不双语全量维护 docs（英文优先，中文占位）。

## Roadmap & Sequence

- Roadmap 锚点：`growth-trace-docs`（Now）。
- 顺序：**④**，依赖 ①（docs 定位）与 ②（roadmap.yaml 数据源）。

## Impact

- 影响范围：新增 `packages/openspec-docs-sync`、`apps/docs` 新页面与路由、`llms.txt`/`llms-full.txt` 产物、docs 同步 CI 步骤。
- 风险：changes 归档结构变化会影响同步脚本 → 以 frontmatter 契约解耦；同步应幂等、生成物可 git-ignore 或可重建。
