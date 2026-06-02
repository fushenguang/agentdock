## Context

Change ② 已落地：`roadmap.yaml`、`align:check`（不变量 1–5）、`lefthook.yml`（pre-commit `align-fast`）、`align-check.yml`（CI 全量对齐）。`packages/` 目录为空，无 ESLint 共享包，无 arch guard，无 secretlint，无 ci-fast/ci-full workflow。

本 change（③）在 ② 的执行器骨架上**叠加工程约束层**：规则定义（eslint-config/tsconfig/arch-guard/secretlint）+ 执行接线（lefthook 扩展 + 两个新 workflow）。⑤（web-nextjs 模板）消费这些规则，所以 ③ 是 ⑤ 的强依赖。

约束：

- `packages/` 目前为空，本 change 新建 `packages/eslint-config` 与 `packages/tsconfig`。
- ② 的 `lefthook.yml` 已存在，③ MUST 扩展而非重写。
- `align-check.yml` 已负责对齐报告，③ 不重复运行 align:check。
- 规则分两级：**架构不变量**（分层边界/契约）从第一天 `error`；**质量/风格类规则**先 `warn`，⑤ 验证后再升。架构规则针对 `src/features/`（仅 ⑤ 存在），现有代码无误伤风险。

## Goals / Non-Goals

**Goals:**

- `packages/eslint-config`（含 `no-direct-db-in-features`、`require-feature-contract`、`@ts-ignore` 限制）。
- `packages/tsconfig`（strict 基线，`extends` 友好）。
- `dependency-cruiser` 配置（no-cross-feature-import、no-core-mutation 规则）。
- `secretlint` 配置（全仓密钥扫描）。
- 扩展 `lefthook.yml`（pre-commit 新增 lint-staged，并行 align-fast）。
- `ci-fast.yml`（PR 上并发 type-check/lint/arch）与 `ci-full.yml`（main 上 secretlint/dep-health）。

**Non-Goals:**

- 不实现 forge-rules 语义投影、e2e/Playwright、PR AI review workflow。
- 不定义业务测试，只定义工程契约门禁。
- 不对质量/风格类规则直接设 error（先 warn，⑤ 验证后再升）。
- 不为架构不变量规则设置 warn 过渡——warn 等同于无牙齿，架构规则必须从第一天有牙齿。

## Decisions

### D1. packages/eslint-config 结构

输出多个命名导出（`base`、`features`、`next`），模板按需 extends。`features` 配置含有牙齿规则，`base` 含通用 TS 严格补充。

- 备选：单一配置全合并。否决——元仓库与模板的激活范围不同，需要可按层组合。

### D2. 有牙齿规则的激活方式

`no-direct-db-in-features` 与 `require-feature-contract` 在模板（有 `src/features/`）中激活，元仓库通过 `ignorePatterns` 或不 extends `features` 配置豁免。不依赖运行时检测目录是否存在（避免静默跳过）——模板 MUST 显式 extends `features` 配置才能生效。

### D3. lefthook 扩展策略

在现有 `pre-commit` 块下新增 `lint-staged` 命令（仅跑暂存 `.ts/.tsx`），启用 `parallel: true`。`type-check` 不放 pre-commit（太慢）——只放 CI。

- 备选：新建 pre-push 阶段运行 type-check。否决——pre-push 与 ci-fast 重复；本地开发体验优先快速反馈。

### D4. CI workflow 拆分

三个 workflow 职责不重叠：`align-check.yml`（对齐，② 产出，不动）→ `ci-fast.yml`（type-check/lint/arch，PR 上秒级反馈）→ `ci-full.yml`（secretlint/dep-health，main 上全量安全扫描）。

- 备选：合并进一个大 workflow。否决——职责混合导致 ② 与 ③ 产出耦合，且 PR 上不需要 secretlint 的全量扫描。

### D5. dependency-cruiser 规则的范围

规则只覆盖 `src/{core,features,infra}` 分层，不覆盖 `app/`（Next.js App Router 目录，框架约定优先于手动 arch 规则）。

- `infra-approval-label` 以 warn 而非 error，因为 infra 变更频率低、有人工 review 兜底。

### D6. secretlint 运行时机

放 `ci-full.yml`（main 合并后）而非 PR 门禁——避免误报阻断合规的配置变更，同时在最终防线上不放行真实密钥。

## Risks / Trade-offs

- [no-direct-db-in-features 误匹配类型声明文件] → 在规则配置中 `exclude` `.d.ts` 与 test fixtures。
- [dependency-cruiser 在 App Router 项目误报] → D5 限制范围到 `src/`，`app/` 不纳入检测。
- [lefthook 并行 lint-staged 与 align-fast 冲突] → 两者读不同文件集，无冲突；并行安全。
- [规则过严拖慢 ⑤ 早期开发] → 架构规则只覆盖机器可判定的边界（分层/契约），不扩散到业务逻辑；质量/风格类规则先 warn。架构规则针对尚不存在的 `src/features/`，⑤ 未落地前不会触发。

## Migration Plan

1. 新建 `packages/tsconfig`（base.json），根 `tsconfig` extends 它。
2. 新建 `packages/eslint-config`（base/features/next 三个导出）。
3. 新增 `.dependency-cruiser.cjs` 规则配置。
4. 新增 `secretlint.config.js`（或 `.secretlintrc`）。
5. 扩展 `lefthook.yml`（pre-commit parallel + lint-staged）。
6. 新增 `ci-fast.yml` 与 `ci-full.yml`。
7. 在 `package.json` 注册 `lint`（ESLint）与 `arch:check`（dependency-cruiser）脚本。
8. 验证 pnpm check-types / lint / arch:check 全绿。

- 回滚：纯新增/扩展，删除新增文件 + 还原 lefthook 扩展即可。

## Open Questions

（无——关键分层/激活策略已在 D1–D6 定档）
