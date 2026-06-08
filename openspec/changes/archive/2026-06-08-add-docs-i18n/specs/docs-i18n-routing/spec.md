## ADDED Requirements

### Requirement: Fumadocs i18n 双语路由

`apps/docs/` MUST 配置 Fumadocs i18n，支持 `/zh/docs/...`（中文，默认）和 `/en/docs/...`（英文）双语路由，访问 `/docs/...` 自动重定向到 `/zh/docs/...`。

配置要求：

- `source.config.ts`：`defineDocs` 启用 i18n，`languages: ['zh', 'en']`，`defaultLanguage: 'zh'`
- `lib/source.ts`：`loader` 适配 i18n source，`getPage(slug, lang)` 支持语言参数
- `app/[lang]/docs/[[...slug]]/page.tsx`（路由结构变更）：从 `app/docs/[[...slug]]/` 改为 `app/[lang]/docs/[[...slug]]/`
- 根路由 `app/page.tsx`：重定向到 `/zh`

#### Scenario: 访问 /docs 自动重定向到 /zh/docs

- **WHEN** 用户访问 `/docs/builder-workflow`
- **THEN** 自动重定向到 `/zh/docs/builder-workflow`

#### Scenario: 手动切换到英文版

- **WHEN** 点击语言切换器选择 English
- **THEN** 跳转到 `/en/docs/builder-workflow`（若有英文版），或 `/en/docs/`（若无对应英文页面）

### Requirement: 内容目录双语结构

`content/docs/` MUST 重构为双语目录结构，中英文内容物理分离。

推荐结构（Fumadocs i18n 标准）：

```
content/docs/
  zh/        ← 中文主版本（默认，新内容在此编写）
    index.mdx
    builder-workflow.mdx
    ui-design/
      index.mdx
      ...
  en/        ← 英文版（现有英文内容迁移，新内容占位）
    index.mdx  ← 简单占位（"English documentation coming soon"）
    builder-workflow.mdx  ← 现有英文内容
    ...
```

已有内容处理：

- 现有英文内容（builder-workflow / cli / templates / skills 等）→ 迁移到 `en/` 保留
- 现有中文内容（ui-design/ 中文部分 / roadmap / changelog 等）→ 迁移到 `zh/`
- 纯英文文档若无中文版 → `zh/` 目录中创建简单占位文件（frontmatter + "此文档正在翻译中" 提示）

#### Scenario: 中文占位文档不破坏构建

- **WHEN** `zh/cli/index.mdx` 只有标题和"文档翻译中"占位文案
- **THEN** `pnpm build` 成功，页面正常渲染占位内容

#### Scenario: changelog/roadmap 的自动生成 MDX 适配 i18n

- **WHEN** 运行 `pnpm docs:sync`
- **THEN** 生成的 changelog/roadmap MDX 正确落入 `zh/` 目录（openspec-docs-sync 输出路径需更新）

### Requirement: 语言切换器

docs 布局 MUST 集成 Fumadocs 内建的 `<LanguageSelect>` 组件（或等效实现），允许用户手动切换中英文。

- 切换器位置：docs sidebar 底部或顶部 header
- 当前页面有对应语言版本时：直接跳转对应语言页面
- 无对应版本时：跳转目标语言的 docs 首页（`/en/docs`）

#### Scenario: 中英文切换保持当前页面路径

- **WHEN** 在 `/zh/docs/builder-workflow` 点击切换到 English
- **THEN** 跳转到 `/en/docs/builder-workflow`（若存在），或 `/en/docs`

### Requirement: openspec-docs-sync 输出路径适配

`packages/openspec-docs-sync` 的输出路径 MUST 更新，生成的 changelog/roadmap MDX 输出到 `content/docs/zh/`（中文默认语言目录）。

#### Scenario: pnpm docs:sync 生成正确路径

- **WHEN** 运行 `pnpm docs:sync`
- **THEN** changelog MDX 生成到 `apps/docs/content/docs/zh/changelog/`，而非旧的 `content/docs/changelog/`
