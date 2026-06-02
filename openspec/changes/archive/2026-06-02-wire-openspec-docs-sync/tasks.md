## 1. packages/openspec-docs-sync

- [x] 1.1 创建 `packages/openspec-docs-sync/`，注册到 pnpm workspace
- [x] 1.2 实现核心读取逻辑：扫描 `openspec/changes/archive/**`，解析每个 change 的 proposal.md（frontmatter + Why/Capabilities/Non-goals 段）及归档目录名中的日期
- [x] 1.3 实现 changelog MDX 生成：按归档日期倒序，输出到 `apps/docs/content/docs/changelog/<id>.mdx`，文件头含 `<!-- AUTO-GENERATED -->` 注释，frontmatter 含 `title`/`description`（符合 Fumadocs pageSchema）
- [x] 1.4 实现 roadmap MDX 生成：读取根 `roadmap.yaml`，输出到 `apps/docs/content/docs/roadmap/index.mdx`，渲染四桶及各条目 status/owner
- [x] 1.5 幂等保证：重复运行不追加重复内容，基于 change id 覆盖写入
- [x] 1.6 在根 `package.json` 注册 `docs:sync` 脚本（`openspec-docs-sync` 入口）

## 2. 初次同步与导航

- [x] 2.1 运行 `pnpm docs:sync`，生成当前 3 个 changelog MDX（bootstrap/anti-drift/layer2）+ roadmap MDX
- [x] 2.2 在 `apps/docs/content/docs/` 导航（`meta.json` 或 source config）加入 changelog 与 roadmap 入口，确保在侧边栏可见
- [x] 2.3 本地运行 `apps/docs` dev server，验证 `/docs/roadmap` 与 `/docs/changelog` 可访问且内容正确

## 3. llms.txt 覆盖验证

- [x] 3.1 访问本地 `/llms.txt`，确认 changelog/roadmap 页出现在索引
- [x] 3.2 访问本地 `/llms-full.txt`，确认 changelog/roadmap 完整文本被包含
- [x] 3.3 确认 `app/api/search/route.ts` 引用 `source`（Orama 本地搜索），changelog/roadmap 进入搜索索引

## 4. CI 集成

- [x] 4.1 在 docs build 流程中加入 `docs:sync` 前置步骤（`predocs:build` script 或 CI step）
- [x] 4.2 确认 CI 中 `docs:sync` 在 `apps/docs` build 前执行，build 不因缺失生成文件而失败

## 5. 验收

- [x] 5.1 `pnpm docs:sync` 运行成功，生成文件无 Fumadocs frontmatter 错误
- [x] 5.2 `apps/docs` build（`pnpm build`）通过，changelog/roadmap 页静态生成正常
- [x] 5.3 新增第 4 个 change 归档后重跑 `docs:sync`，changelog 出现新条目（验证自动化）
- [x] 5.4 `openspec validate wire-openspec-docs-sync` 通过
- [x] 5.5 自检：未触及 Non-goals（MCP Server / Skills / ai_context 工具链 / 双语 / GEO）
