## 1. packages/tsconfig

- [x] 1.1 创建 `packages/tsconfig/`，含 `base.json`（strict 基线：`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` 等）
- [x] 1.2 确保根 `tsconfig.json` 及 `apps/docs/tsconfig.json` extends `@agentdock/tsconfig/base.json`
- [x] 1.3 将 `packages/tsconfig` 注册到 pnpm workspace

## 2. packages/eslint-config

- [x] 2.1 创建 `packages/eslint-config/`，结构：`base.js` / `features.js` / `next.js` 三个命名导出
- [x] 2.2 在 `features.js` 实现 `no-direct-db-in-features` 规则（`src/features/**` 禁止 import `src/infra/db/**`）— 初始 `error`
- [x] 2.3 在 `features.js` 实现 `require-feature-contract` 规则（`src/features/<name>/` 缺 `__contract__.ts` 时报错）— 初始 `error`
- [x] 2.4 在 `base.js` 加 `@typescript-eslint/ban-ts-comment`（`@ts-ignore` 无解释注释时 `error`）
- [x] 2.5 配置元仓库豁免：根 `.eslintrc.*` 不 extends `features` 配置（或 `ignorePatterns` 覆盖 src/features）
- [x] 2.6 将 `packages/eslint-config` 注册到 pnpm workspace，根 `package.json` 注册 `lint` 脚本（`turbo run lint`）

## 3. dependency-cruiser 架构守卫

- [x] 3.1 新增根 `.dependency-cruiser.cjs`，实现 `no-cross-feature-import` 规则（`src/features/<A>` 禁止 import `src/features/<B>`）— error
- [x] 3.2 实现 `no-core-mutation`：检测 `src/core/**` 被反向依赖（如 core import features）— error
- [x] 3.3 实现 `infra-approval-label`：`src/infra/**` 新依赖关系 — warn
- [x] 3.4 检测范围限定在 `src/{core,features,infra}`，排除 `app/`（Next.js App Router）
- [x] 3.5 在 `package.json` 注册 `arch:check` 脚本（`dependency-cruiser`）

## 4. secretlint

- [x] 4.1 新增 `.secretlintrc.json`（或 `secretlint.config.js`），覆盖常见密鑰格式（AWS/GCP/Supabase/GitHub token）
- [x] 4.2 占位值白名单（`YOUR_KEY_HERE`、`<your-token>` 等不触发）
- [x] 4.3 在 `package.json` 注册 `secrets:check` 脚本

## 5. lefthook 扩展

- [x] 5.1 在现有 `lefthook.yml` 的 `pre-commit` 块下新增 `lint-staged` 命令（仅跑暂存 `.ts/.tsx`）
- [x] 5.2 启用 `parallel: true`，`align-fast` 与 `lint-staged` 并行运行
- [x] 5.3 验证 pre-commit 总耗时合理（< 15 秒）

## 6. CI workflows

- [x] 6.1 新增 `.github/workflows/ci-fast.yml`：PR 触发，jobs：`type-check` / `lint` / `arch-guard`（可并行）
- [x] 6.2 新增 `.github/workflows/ci-full.yml`：push to main 触发，jobs：`secretlint` / `dep-health-check`
- [x] 6.3 确认 `align-check.yml` 保持不动（不重复运行 align:check）

## 7. 验收

- [x] 7.1 `pnpm check-types` 通过（包含新 packages）
- [x] 7.2 `pnpm lint` 通过（元仓库自身无 features 误报）
- [x] 7.3 `pnpm arch:check` 通过（元仓库自身无 src/core 误报）
- [x] 7.4 `pnpm secrets:check` 通过（全仓无真实密鑰）
- [x] 7.5 构造一个 `no-direct-db-in-features` 违反样例，验证 lint 以 error 拦截
- [x] 7.6 构造一个 `no-cross-feature-import` 违反样例，验证 arch:check 拦截
- [x] 7.7 `openspec validate add-layer2-constraint-gates` 通过
- [x] 7.8 自检：未触及 Non-goals（forge-rules/e2e/PR AI review/业务测试）；确认架构规则为 error、质量/风格规则为 warn，两级分明
