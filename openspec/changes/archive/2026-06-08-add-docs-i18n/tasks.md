## 0. Git 分支准备

> **前置条件**：`feat/improve-docs-ux` 已 merge 到 main。

- [x] 0.1 切换到 main 并拉取最新：`git checkout main && git pull`
- [x] 0.2 创建并切换到新分支：`git checkout -b feat/add-docs-i18n`

## 1. Fumadocs i18n 配置

- [x] 1.1 查阅 Fumadocs 16.x i18n 文档（[https://fumadocs.vercel.app/docs/ui/internationalization](https://fumadocs.vercel.app/docs/ui/internationalization)），确认 `source.config.ts` 和 `lib/source.ts` 的准确 API
- [x] 1.2 编辑 `apps/docs/source.config.ts`：
  - 在 `defineDocs` 中加入 `i18n: { languages: ['zh', 'en'], defaultLanguage: 'zh' }`
  - 若 Fumadocs 16.x API 不同，按文档调整
- [x] 1.3 编辑 `apps/docs/lib/source.ts`：
  - `loader` 函数适配 i18n source，`getPage` 接受 `(slug, lang)` 参数
  - 导出 `getPages(lang)` 用于 sitemap / llms 路由

## 2. 路由结构重构

> 所有 `app/docs/` 下的路由移至 `app/[lang]/docs/`，[lang] 参数约束为 `['zh', 'en']`

- [x] 2.1 创建 `apps/docs/app/[lang]/docs/` 目录结构：
  - `layout.tsx`（从 `app/docs/layout.tsx` 迁移，加入 LanguageSelect，lang prop 传给 DocsLayout）
  - `[[...slug]]/page.tsx`（从 `app/docs/[[...slug]]/page.tsx` 迁移，`getPage(slug, lang)`）
- [x] 2.2 创建 `apps/docs/app/[lang]/` 层级布局（若 Fumadocs 需要）：
  - `layout.tsx`（i18n provider 或语言 context）
- [x] 2.3 更新 `apps/docs/app/(home)/` 路由：根据 Fumadocs i18n 要求，landing page 是否需要 `[lang]` 参数
- [x] 2.4 更新 `apps/docs/app/page.tsx`：redirect 到 `/zh`
- [x] 2.5 更新 `apps/docs/app/og/docs/[...slug]/route.tsx`：slug 解构为 `[lang, ...rest]`，按语言获取页面
- [x] 2.6 更新 `apps/docs/app/llms.txt/route.ts` 和 `apps/docs/app/llms-full.txt/route.ts`：输出所有语言的文档内容（两语言内容合并输出）
- [x] 2.7 更新 `apps/docs/app/llms.mdx/docs/[[...slug]]/route.ts`：适配 i18n 路由
- [x] 2.8 删除旧的 `app/docs/` 目录（`git rm -r app/docs/`）

## 3. 内容目录重构

- [x] 3.1 创建 `apps/docs/content/docs/en/` 目录：`mkdir -p apps/docs/content/docs/en/`
- [x] 3.2 创建 `apps/docs/content/docs/zh/` 目录：`mkdir -p apps/docs/content/docs/zh/`
- [x] 3.3 将现有英文 MDX 内容迁移到 `en/`（保留 git history）：
  ```
  git mv apps/docs/content/docs/*.mdx apps/docs/content/docs/en/
  git mv apps/docs/content/docs/ui-design apps/docs/content/docs/en/ui-design
  git mv apps/docs/content/docs/meta.json apps/docs/content/docs/en/meta.json
  # ... 其他子目录
  ```
- [x] 3.4 创建中文主版本文件（`zh/` 目录），初始文件清单：
  - `zh/index.mdx`：docs 首页（中文，提纲挈领介绍平台）
  - `zh/builder-workflow.mdx`：Builder Workflow 中文版（新写或英文版中文翻译）
  - `zh/meta.json`：中文导航结构（与 `en/meta.json` 保持页面列表一致）
  - 其余英文文档（cli/templates/skills/testing/roadmap/changelog/llm-eval 等）→ 在 `zh/` 中创建占位文件（格式见 design D4）
- [x] 3.5 中文版 `ui-design/` 处理：
  - `zh/ui-design/` 是中文优先内容，直接新建（中文），包含 index/workflow/css-system/anti-patterns/research/ 等已有中文内容
  - `en/ui-design/` 保留现有英文版

## 4. LanguageSelect 集成

- [x] 4.1 在 `app/[lang]/docs/layout.tsx` 中集成 Fumadocs `<LanguageSelect>` 或等效实现：
  - 使用 Fumadocs 16.x 推荐 API（查阅文档确认）
  - 配置 `languages: [{ locale: 'zh', name: '中文' }, { locale: 'en', name: 'English' }]`
- [x] 4.2 验证切换器：在 /zh/docs 点击切换到 English → 跳转 /en/docs（同路径或首页）

## 5. openspec-docs-sync 输出路径更新

- [x] 5.1 找到 `packages/openspec-docs-sync/src/` 中的输出路径配置
- [x] 5.2 将 `content/docs/changelog` → `content/docs/zh/changelog`
- [x] 5.3 将 `content/docs/roadmap` → `content/docs/zh/roadmap`（若有）
- [x] 5.4 运行 `pnpm docs:sync` 确认文件生成到正确位置

## 6. 内部链接修复

- [x] 6.1 在 `apps/docs/` 内全量 grep：`grep -r 'href="/docs/' apps/docs/ --include="*.tsx" --include="*.mdx" --include="*.ts"`
- [x] 6.2 将所有绝对路径 `/docs/...` 改为 `/zh/docs/...`（或对应的 i18n 路径生成函数）
- [x] 6.3 在 MDX 文件中检查 `[link text](/docs/...)` 格式的链接并修复

## 7. 验收

- [x] 7.1 `pnpm check-types`（在 `apps/docs/` 目录）：无 TypeScript 错误
- [x] 7.2 `pnpm build`（在 `apps/docs/` 目录）：构建成功，无路由冲突
- [x] 7.3 路由测试：
  - `/docs/builder-workflow` → redirect 到 `/zh/docs/builder-workflow`
  - `/zh/docs/builder-workflow` → 正常渲染中文内容
  - `/en/docs/builder-workflow` → 正常渲染英文内容
  - `/zh/docs/cli` → 渲染中文占位页（不报 404）
- [x] 7.4 语言切换器：在 /zh/docs 页面点击 English → 跳转正确
- [x] 7.5 Search：搜索"认证"有中文结果；搜索"auth"有英文结果
- [x] 7.6 Chat：发送消息正常响应（不受路由变更影响）
- [x] 7.7 OG 图：访问 `/og/docs/zh/builder-workflow` 返回有效图片（不报错）
- [x] 7.8 `openspec validate add-docs-i18n` 通过
- [x] 7.9 PR 合并到 main，删除 `feat/add-docs-i18n` 分支
