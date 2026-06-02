# docs-growth-pages Specification

## Purpose

TBD - created by archiving change wire-openspec-docs-sync. Update Purpose after archive.

## Requirements

### Requirement: Roadmap page

`apps/docs` MUST 提供 roadmap 页面（路由 `/docs/roadmap`），从 `docs:sync` 生成的 MDX 渲染，展示四桶（Now/Next/Later/Won't）与各条目状态。

页面 MUST：

- 来源于 `docs:sync` 产出的 `content/docs/roadmap/index.mdx`，不手写内容。
- 以人类可读形式展示 `id`、`title`、`status`、`owner`。
- 在 `apps/docs` 导航中有入口。

#### Scenario: 访问 roadmap 页可见当前状态

- **WHEN** 访问 `/docs/roadmap`
- **THEN** 页面渲染 roadmap.yaml 四桶内容，各条目含 status 标记

#### Scenario: roadmap 更新后 re-sync 可见新状态

- **WHEN** `roadmap.yaml` 变更后重新运行 `docs:sync` 并重建 docs
- **THEN** roadmap 页反映最新内容

### Requirement: Changelog page

`apps/docs` MUST 提供 changelog 页面（路由 `/docs/changelog`），以时间倒序列出已归档 changes，展示每个 change 的 Why / 核心 Capabilities / Non-goals。

页面 MUST：

- 来源于 `docs:sync` 产出的 `content/docs/changelog/` 下各 MDX，不手写内容。
- 以时间倒序排列（最新归档在前）。
- 在 `apps/docs` 导航中有入口（与 roadmap 同级）。

#### Scenario: 已归档 change 出现在 changelog

- **WHEN** 访问 `/docs/changelog`
- **THEN** 已归档的 3 个 changes（①②③）均出现，按归档时间倒序

#### Scenario: 新归档后 changelog 自动更新

- **WHEN** 新 change 归档且重新运行 `docs:sync`
- **THEN** changelog 页新增该 change 条目，排在最前

### Requirement: Local search

`apps/docs` 的搜索/检索 MUST 使用本地 Orama（Fumadocs 内建），不依赖 Algolia 或任何外部搜索服务。

#### Scenario: 搜索功能可用且离线

- **WHEN** 在 docs 站搜索 "roadmap" 或某 change 的 id
- **THEN** 本地 Orama 返回相关结果，无需外部 HTTP 请求
