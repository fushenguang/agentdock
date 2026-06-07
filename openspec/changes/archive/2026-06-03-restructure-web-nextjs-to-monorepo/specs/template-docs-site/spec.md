## ADDED Requirements

### Requirement: 内置 Fumadocs 文档站

`templates/web-nextjs/apps/docs/` MUST 提供一个可运行的 Fumadocs/Next.js 文档站，作为下游项目的知识沉淀位置，随 web 应用共同成长。

文档站 MUST：

- 基于 Fumadocs（与平台 `apps/docs` 技术栈一致），本地 Orama 搜索（无需 Algolia）
- 预置内容目录结构：
  - `content/docs/features/`：记录各 feature 的设计决策与使用说明
  - `content/docs/decisions/`：ADR（Architecture Decision Records）落点
  - `content/docs/changelog/`：由 openspec-docs-sync 自动生成
  - `content/docs/roadmap/`：由 openspec-docs-sync 自动生成
- 接入 `packages/openspec-docs-sync`（平台包），使 `pnpm docs:sync` 可从模板自身的 `openspec/` 生成 changelog/roadmap MDX
- 在 docs 导航中有 Features、Decisions、Changelog、Roadmap 四个入口

#### Scenario: docs 站本地可访问

- **WHEN** 在根执行 `pnpm dev`（turbo pipeline），访问 docs dev server
- **THEN** 文档站正常渲染，四个导航入口可见

#### Scenario: pnpm docs:sync 生成 changelog/roadmap MDX

- **WHEN** 在根执行 `pnpm docs:sync`
- **THEN** `apps/docs/content/docs/changelog/` 与 `apps/docs/content/docs/roadmap/index.mdx` 被生成，内容来自 `openspec/changes/archive/` 与根 `openspec/roadmap.yaml`（模板自身的，非平台的）

#### Scenario: 新 feature 文档有标准落点

- **WHEN** 开发者新增 feature `user-profile`
- **THEN** 可在 `apps/docs/content/docs/features/user-profile.mdx` 写文档，docs 站自动收录，无需改路由

#### Scenario: llms.txt 覆盖 docs 内容

- **WHEN** docs 站部署后访问 `/llms.txt`
- **THEN** changelog/roadmap/features/decisions 下的 MDX 均出现在 llms.txt 索引（Fumadocs 自动扫 content/docs/）

### Requirement: 本地 Orama 搜索

`apps/docs` 的搜索 MUST 使用 Fumadocs 内建的本地 Orama，不依赖任何外部搜索服务。

#### Scenario: 搜索功能离线可用

- **WHEN** 在 docs 站搜索 "hello feature" 或某 ADR 关键词
- **THEN** Orama 本地返回结果，无需外部 HTTP 请求
