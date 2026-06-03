### Requirement: turborepo + pnpm monorepo 骨架
`templates/web-nextjs/` MUST 重构为 turborepo 2.x + pnpm workspace monorepo，结构如下：

```
templates/web-nextjs/
  apps/
    web/          ← 原 Next.js 主应用（全量现有代码迁移）
    docs/         ← 内置 Fumadocs 文档站
  packages/       ← 共享逻辑（暂空，含 .gitkeep）
  turbo.json      ← pipeline: build / dev / lint / test / check-types
  pnpm-workspace.yaml
  package.json    ← 根 package（无实现代码，只含 workspace scripts）
```

`apps/web/` MUST 保留所有现有代码：四层目录契约（core/features/infra/_experiments）、hello feature、Supabase 仓储抽象、i18n 骨架（next-intl）。迁移后 ESLint、tsconfig、vitest 配置路径适配 monorepo 结构。

#### Scenario: monorepo 根级 pnpm install 成功
- **WHEN** 在 `templates/web-nextjs/` 根执行 `pnpm install`
- **THEN** 所有 workspace 成员依赖全部安装，无缺失

#### Scenario: turbo build 并行构建 web 与 docs
- **WHEN** 在根执行 `pnpm build`（turbo pipeline）
- **THEN** `apps/web` 与 `apps/docs` 均构建成功，无依赖顺序冲突

#### Scenario: web 应用现有代码迁移后测试通过
- **WHEN** 在根执行 `pnpm test`（turbo pipeline）
- **THEN** `apps/web/src/features/hello/hello.test.ts` 通过，Layer 2 ESLint 规则仍 error 级生效

#### Scenario: Layer 2 ESLint 规则路径适配正确
- **WHEN** 在根执行 `pnpm lint`
- **THEN** `apps/web/src/features/` 内的 Layer 2 规则继续 error 级生效，`apps/docs/` 不受 features 规则误报
