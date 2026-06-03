### Requirement: docs 与 web 共同成长机制
模板 MUST 提供标准化的"文档共同成长"机制，使 AI Agent 和人类开发者在开发新 feature 时，自然地将决策和文档写入 `apps/docs/`。

机制包含：
- **文档目录约定**：`content/docs/features/<feature-name>.mdx`（feature 说明）、`content/docs/decisions/<adr-id>.mdx`（ADR）——这些是约定，不是强制（不添加 lint 规则）
- **copilot-instructions.md 引导**：明确告知 AI Agent：新 feature 开发时，应同步在 `apps/docs/content/docs/features/` 下创建对应 MDX；架构决策应写入 `content/docs/decisions/`
- **AGENTS.md 更新**：声明"创建/更新 docs/content/ 下的 MDX"为 AI 可自主操作范围（无需人工确认）

#### Scenario: AI Agent 收到文档共同成长引导
- **WHEN** Copilot 在 `apps/web/src/features/` 下创建新 feature
- **THEN** `copilot-instructions.md` 的上下文提示 AI 同步创建 `apps/docs/content/docs/features/<name>.mdx`

#### Scenario: 人类开发者写 ADR 有标准位置
- **WHEN** 开发者做架构决策（如"选择 next-auth 还是 Supabase Auth"）
- **THEN** 有 `apps/docs/content/docs/decisions/` 目录作为标准落点，且 docs 站收录后可被搜索

### Requirement: 模板自配置更新（monorepo 适配）
`copilot-instructions.md`、`AGENTS.md` MUST 更新，反映 monorepo 结构与 docs 共同成长约定。

更新内容：
- 目录契约更新为 `apps/web/src/core|features|infra|_experiments`
- 新增：docs 共同成长约定（feature 文档落点、ADR 落点）
- 新增：`pnpm docs:sync` 的使用说明（何时运行、运行后效果）
- AGENTS.md：新增"创建/更新 apps/docs/content/ MDX"为自主操作范围

#### Scenario: 更新后 copilot-instructions 反映 monorepo 路径
- **WHEN** Copilot 读取 `.github/copilot-instructions.md`
- **THEN** 目录路径为 `apps/web/src/...`，Layer 2 规则描述与实际 ESLint config 一致

#### Scenario: docs:sync 说明完整
- **WHEN** 开发者或 AI Agent 读取 copilot-instructions 或 README
- **THEN** 知道在归档 change 后运行 `pnpm docs:sync` 可更新 changelog/roadmap 页
