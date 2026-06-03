## 1. monorepo 骨架

- [x] 1.1 在 `templates/web-nextjs/` 创建 `pnpm-workspace.yaml`（packages: `apps/*`、`packages/*`）
- [x] 1.2 创建根 `turbo.json`（tasks: build/dev/lint/test/check-types，pipeline 见 design D3）
- [x] 1.3 替换根 `package.json`：name `@cogito.ai/template-web-nextjs`，scripts（build/dev/lint/test/check-types/docs:sync），无实现代码依赖
- [x] 1.4 创建 `packages/.gitkeep`（为未来共享包预留空目录）

## 2. apps/web 迁移

- [x] 2.1 创建 `apps/web/` 目录，将以下文件/目录从根移入：`src/`、`messages/`、`middleware.ts`、`next.config.ts`、`tsconfig.json`、`vitest.config.ts`、`tailwind.config.ts`、`eslint.config.js`、`next-env.d.ts`、`.github/copilot-instructions.md`（移入 `apps/web/.github/`）
- [x] 2.2 创建 `apps/web/package.json`（name: `@cogito.ai/web`，scripts: dev/build/start/lint/test/check-types，dependencies 与现有一致，devDependencies 中 `@cogito.ai/eslint-config` 和 `@cogito.ai/tsconfig` 改为 `workspace:*`）
- [x] 2.3 删除根目录下已移走的文件（`src/`、`messages/`、`middleware.ts` 等），清理根的旧 `.next/`
- [x] 2.4 确认 `apps/web/tsconfig.json` 的 `@/` alias 路径正确（`"@/*": ["./src/*"]`，相对 apps/web）
- [x] 2.5 确认 `apps/web/eslint.config.js` Layer 2 规则 `files` 字段为 `src/features/**`
- [x] 2.6 在根运行 `pnpm install`，确认依赖全部解析无误
- [x] 2.7 在根运行 `pnpm lint`，确认 Layer 2 error 规则在 `apps/web/src/features/` 继续生效
- [x] 2.8 在根运行 `pnpm test`，确认 `features/hello/hello.test.ts` 通过
- [x] 2.9 在根运行 `pnpm build`，确认 `apps/web` 构建成功

## 3. apps/docs 建立

- [x] 3.1 创建 `apps/docs/` 目录，初始化 `package.json`（name: `@cogito.ai/docs`，dependencies: fumadocs-core/fumadocs-ui/fumadocs-mdx/next/react）
- [x] 3.2 配置 `apps/docs/source.config.ts`（`defineDocs({ dir: 'content/docs' })`，与平台 apps/docs 一致）
- [x] 3.3 配置 `apps/docs/next.config.ts`（withMdx）
- [x] 3.4 创建 `apps/docs/app/` 基础结构：layout.tsx、(home)/page.tsx、docs/layout.tsx、docs/[[...slug]]/page.tsx
- [x] 3.5 配置本地 Orama 搜索（`app/api/search/route.ts`，引用 source）
- [x] 3.6 创建 `apps/docs/app/llms.txt/route.ts` 与 `llms-full.txt/route.ts`（与平台一致）
- [x] 3.7 创建预置内容目录：
  - `content/docs/features/hello.mdx`（参考 feature 文档示例）
  - `content/docs/decisions/.gitkeep`
  - `content/docs/changelog/.gitkeep`（含注释：由 `pnpm docs:sync` 自动生成）
  - `content/docs/roadmap/.gitkeep`（含注释：由 `pnpm docs:sync` 自动生成）
- [x] 3.8 配置 docs 导航入口（Features / Decisions / Changelog / Roadmap 四个入口）
- [x] 3.9 在 `apps/docs/package.json` 添加 `@cogito.ai/openspec-docs-sync: workspace:*` 依赖
- [x] 3.10 创建模板自身的 `openspec/roadmap.yaml`（四桶结构，含一条示例条目）
- [x] 3.11 在根 `package.json` 的 `docs:sync` 脚本中，传入正确的 openspec 路径（monorepo 根的 `openspec/`）
- [x] 3.12 运行 `pnpm docs:sync`，验证 changelog/roadmap MDX 生成正常（或空结果无报错）
- [x] 3.13 在根运行 `pnpm build`，确认 `apps/docs` 构建成功

## 4. 自配置更新

- [x] 4.1 更新根 `.github/copilot-instructions.md`：目录契约路径改为 `apps/web/src/...`，新增"Docs Co-evolution"节（feature 文档落点、ADR 落点、docs:sync 使用说明）
- [x] 4.2 更新根 `AGENTS.md`：新增"创建/更新 `apps/docs/content/` 下的 MDX"为 AI 自主操作范围
- [x] 4.3 更新根 `openspec/config.yaml` context：反映 monorepo 结构（apps/web + apps/docs）与 docs 共同成长约定

## 5. 验收

- [x] 5.1 根 `pnpm install`：退出码 0，所有 workspace 成员依赖解析
- [x] 5.2 根 `pnpm lint`：Layer 2 error 规则在 `apps/web/src/features/` 生效；`apps/docs/` 不误报
- [x] 5.3 根 `pnpm test`：hello feature 测试通过
- [x] 5.4 根 `pnpm check-types`：apps/web 与 apps/docs 均无 TS error
- [x] 5.5 根 `pnpm build`：apps/web（Next.js 16）与 apps/docs（Fumadocs）均构建成功
- [x] 5.6 根 `pnpm docs:sync`：无报错，changelog/roadmap 目录正常处理
- [x] 5.7 `apps/docs` dev server 可访问，Features/Decisions/Changelog/Roadmap 四个导航入口可见
- [x] 5.8 `apps/web` dev server 可访问，`/en/hello` 正常渲染
- [x] 5.9 `openspec validate restructure-web-nextjs-to-monorepo` 通过
- [x] 5.10 自检：未触及 Non-goals（无 auth / 业务 feature / 双语 / 平台包修改）
