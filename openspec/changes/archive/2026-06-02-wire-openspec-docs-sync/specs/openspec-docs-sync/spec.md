## ADDED Requirements

### Requirement: openspec-docs-sync package
平台 MUST 提供 `packages/openspec-docs-sync`，作为从 `openspec/` 到 `apps/docs/content/` 的**幂等同步引擎**，运行时不依赖 Fumadocs 内部，只输出 MDX 文件。

该包 MUST：
- 读取 `openspec/changes/archive/**` 中每个已归档 change 的 `proposal.md`（及可选的 `design.md`），提取 frontmatter + 正文关键段（Why / Capabilities / Non-goals）。
- 读取根 `roadmap.yaml`（四桶结构），投影为 roadmap MDX。
- 输出到 `apps/docs/content/docs/changelog/` 与 `apps/docs/content/docs/roadmap/`（目录由同步引擎创建，不手写）。
- 生成结果 MUST 幂等：重复运行不累积重复内容，文件内容由 change `id`/`created` 决定。
- 生成产物 MUST 可被 git-ignore 或可重建（不进版本管理，或显式声明进版本管理并标"自动生成勿手改"）。

#### Scenario: 归档 change 被投影为 changelog 条目
- **WHEN** 运行 `pnpm docs:sync`
- **THEN** `apps/docs/content/docs/changelog/` 下出现以 change id 命名的 MDX 文件，含 Why / Capabilities / Non-goals

#### Scenario: roadmap 被投影为 roadmap MDX
- **WHEN** 运行 `pnpm docs:sync`
- **THEN** `apps/docs/content/docs/roadmap/index.mdx` 被更新，反映 `roadmap.yaml` 四桶最新状态

#### Scenario: 幂等性
- **WHEN** 连续运行 `pnpm docs:sync` 两次，`roadmap.yaml` 与 archive 无变化
- **THEN** 生成文件内容不变，无重复条目追加

### Requirement: llms.txt coverage
`apps/docs` 现有的 `llms.txt`/`llms-full.txt` 路由基于 Fumadocs `source`（扫描 `content/docs`）。④ 产出的 changelog/roadmap MDX 落入 `content/docs/` 后，MUST **自动**被现有路由覆盖，无需修改路由文件。

#### Scenario: changelog 内容出现在 llms.txt
- **WHEN** `docs:sync` 运行后访问 `/llms.txt`
- **THEN** 响应包含 changelog 页面的条目

#### Scenario: roadmap 内容出现在 llms-full.txt
- **WHEN** `docs:sync` 运行后访问 `/llms-full.txt`
- **THEN** 响应包含 roadmap 页面的完整文本
