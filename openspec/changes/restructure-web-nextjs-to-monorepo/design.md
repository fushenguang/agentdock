## Context

`templates/web-nextjs/` 现在是单 Next.js 应用（无 monorepo）。现有代码：四层目录契约（`src/core|features|infra|_experiments`）、参考 feature `hello`（contract + service + index + test + page）、Supabase 仓储抽象（`IGreetingRepository` + `SupabaseGreetingRepository`）、next-intl i18n 骨架、ESLint Layer 2 error 规则、模板自配置（`.github/copilot-instructions.md`、`AGENTS.md`、`openspec/`）。模板 `package.json` 使用包名 `@cogito.ai/template-web-nextjs`，消费平台 `@cogito.ai/eslint-config`、`@cogito.ai/tsconfig`。

目标：把这个单应用**提升**为 turborepo monorepo，现有所有代码移入 `apps/web/`，新增 `apps/docs/`（Fumadocs），不丢失任何现有实现。

## Goals / Non-Goals

**Goals:**
- turborepo + pnpm workspace 骨架，apps/web + apps/docs + packages/（空）
- `apps/web/` 是原有代码的完整迁移（路径、import alias、ESLint config 适配）
- `apps/docs/` 是可运行的 Fumadocs 站，接入 openspec-docs-sync，预置 features/decisions/changelog/roadmap 四个内容目录
- copilot-instructions.md、AGENTS.md、openspec/config.yaml 更新反映 monorepo 结构与 docs 共同成长约定

**Non-Goals:**
- 不实现 auth / payments / analytics / 任何业务 feature
- 不改变四层目录契约的逻辑（仅路径变化）
- 不做模板 docs 站的双语
- 不修改平台 `packages/openspec-docs-sync`（直接消费）

## Decisions

### D1. 迁移策略：先建 monorepo 骨架，再迁移 apps/web，最后加 apps/docs
分三步执行，每步可独立验证：
1. 建 turbo.json + pnpm-workspace.yaml + 根 package.json（无实现代码）
2. 把现有所有文件移入 `apps/web/`，更新路径与配置，跑通 lint/test/build
3. 新建 `apps/docs/`（Fumadocs），接入 openspec-docs-sync，验证 docs:sync + docs build

### D2. 包名策略：保持 @cogito.ai 命名空间
- 根 package：`@cogito.ai/template-web-nextjs`（monorepo 根，无实现代码）
- `apps/web` package：`@cogito.ai/web`
- `apps/docs` package：`@cogito.ai/docs`
- 与平台包（`@cogito.ai/eslint-config`、`@cogito.ai/tsconfig`）命名空间一致

### D3. turbo pipeline 设计
```json
{
  "tasks": {
    "build":       { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev":         { "persistent": true, "cache": false },
    "lint":        {},
    "test":        { "outputs": ["coverage/**"] },
    "check-types": {}
  }
}
```
根 package.json scripts：`build | dev | lint | test | check-types | docs:sync`。`docs:sync` 调用 `openspec-docs-sync`，非 turbo task（直接 node 脚本，幂等）。

### D4. apps/web 的 ESLint config 路径适配
`apps/web/eslint.config.js` 中 Layer 2 规则的 `files` 字段改为 `src/features/**`（相对 `apps/web/`），与当前单应用一致——monorepo 中各 app 有自己的 eslint config，不共用根级 config。

### D5. apps/docs 技术栈与平台 apps/docs 保持一致
使用 Fumadocs（`fumadocs-core`、`fumadocs-ui`、`fumadocs-mdx`）+ Next.js 15（docs 站不需要 Next.js 16 的 RSC features，可用稳定版）+ 本地 Orama（无 Algolia）。复用平台 `apps/docs` 的已验证配置模式（`source.config.ts` defineDocs、`llms.txt` 路由）。

### D6. openspec-docs-sync 消费方式
模板的 `apps/docs/` 消费平台 `packages/openspec-docs-sync`（workspace 包 `@cogito.ai/openspec-docs-sync`）。`docs:sync` 脚本读取模板自身的 `openspec/`（`openspec/changes/archive/`、`openspec/roadmap.yaml`），输出到 `apps/docs/content/docs/changelog/` 与 `apps/docs/content/docs/roadmap/index.mdx`。
- 注意：模板的 `openspec/roadmap.yaml` 需要新建（模板自身的 roadmap，非平台 roadmap）

### D7. 预置内容目录约定（非强制）
`apps/docs/content/docs/` 预置四个子目录：
- `features/`：含 `hello.mdx`（参考 feature 文档示例）
- `decisions/`：含 `.gitkeep`（ADR 落点）
- `changelog/`：由 docs:sync 生成（初始空，含注释说明）
- `roadmap/`：由 docs:sync 生成（初始空，含注释说明）

### D8. copilot-instructions 更新内容
新增两节：
- **Docs Co-evolution**：开发新 feature 时同步在 `apps/docs/content/docs/features/<name>.mdx` 写文档；架构决策写 `apps/docs/content/docs/decisions/<adr-id>.mdx`；归档 change 后运行 `pnpm docs:sync`
- **Monorepo 路径**：目录契约路径更新为 `apps/web/src/core|features|infra|_experiments`

## Risks / Trade-offs

- [现有 pnpm lock 与 node_modules 迁移] → 迁移时重新 `pnpm install`，不手动移动 node_modules。
- [apps/web 中 import alias `@/` 可能失效] → `apps/web/tsconfig.json` 中 paths `"@/*": ["./src/*"]` 保留，相对 apps/web/ 根，无需改变。
- [apps/docs 的 openspec-docs-sync 调用路径] → `docs:sync` 脚本需要传入正确的 openspec 根路径（`../../openspec`，相对 apps/docs/），或从 monorepo 根运行时用绝对路径。

## Migration Plan

1. 在 `templates/web-nextjs/` 建 `turbo.json`、`pnpm-workspace.yaml`、新根 `package.json`（替换现有的）
2. 创建 `apps/web/` 目录，把除 `openspec/`、`.github/`、`AGENTS.md`、`README.md` 之外的所有现有文件移入（src/、messages/、middleware.ts、next.config.ts、tsconfig.json、vitest.config.ts、tailwind.config.ts、eslint.config.js、next-env.d.ts、.next/删除重建）
3. 更新 `apps/web/package.json`（name: `@cogito.ai/web`，移除 workspace: 依赖中指向平台包的路径，改为 `workspace:*`）
4. 在根运行 `pnpm install`，在根运行 `pnpm lint && pnpm test && pnpm build`——必须全部通过
5. 新建 `apps/docs/`（Fumadocs + Next.js），接入 openspec-docs-sync，验证 `pnpm docs:sync` 与 `apps/docs` build
6. 更新 `.github/copilot-instructions.md`、`AGENTS.md`、`openspec/config.yaml`
- 回滚：`git checkout -- templates/web-nextjs/`（迁移前 commit 保留完整快照）

## Open Questions

（无）
