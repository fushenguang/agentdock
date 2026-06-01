## Purpose

定义分层约束落地后的 CI 与本地门禁策略，确保快速反馈与最终防线兼顾，并避免与既有 alignment 检查重复。

## Requirements

### Requirement: Lefthook local pre-commit extension
③ MUST 扩展（不替换）② 已产出的 `lefthook.yml`，在 `pre-commit` 阶段新增工程约束检查命令，与 `align-fast` 并行运行。

新增命令（pre-commit）：
- `lint-staged`：对暂存的 `*.{ts,tsx}` 文件跑 ESLint（只跑变更文件，秒级）。
- `type-check`：跑 `pnpm check-types`（全量，可配为仅在 CI 全跑，本地 pre-commit 可选 opt-in）。

MUST 保持 lefthook 的**并行执行**（`parallel: true`），不序列化拖慢提交。

#### Scenario: ESLint 在提交前拦截架构违反
- **WHEN** 暂存文件包含 `no-direct-db-in-features` 违反
- **THEN** lefthook pre-commit 因 lint-staged 失败，提交被阻断

#### Scenario: align-fast 与 lint-staged 并行
- **WHEN** 本地提交触发 pre-commit
- **THEN** `align-fast` 与 `lint-staged` 并行运行，总耗时不因串行而加倍

### Requirement: ci-fast workflow
平台 MUST 提供 `ci-fast.yml` workflow，在每个 PR 上运行工程质量门禁（type-check / lint / arch-guard），独立于 `align-check.yml`，两者并发运行不互相等待。

ci-fast MUST 包含以下 jobs（可并行）：
- `type-check`：`pnpm check-types`
- `lint`：`pnpm lint`（ESLint，含架构规则）
- `arch-guard`：`pnpm arch:check`（dependency-cruiser）

#### Scenario: PR 上 ci-fast 与 align-check 并发
- **WHEN** 向 main 提交 PR
- **THEN** `ci-fast.yml` 与 `align-check.yml` 并发触发，互不阻塞

#### Scenario: type-check 失败阻断合并
- **WHEN** PR 中有 TypeScript 类型错误
- **THEN** ci-fast `type-check` job 失败，PR 不可合并

### Requirement: ci-full workflow
平台 MUST 提供 `ci-full.yml` workflow，在 push 到 `main` 时运行完整安全扫描（secretlint + 依赖健康检查），作为最终防线。ci-full **不重复**运行 align-check（由 `align-check.yml` 负责）。

#### Scenario: secretlint 在 main 合并后扫描
- **WHEN** PR 合并到 main
- **THEN** ci-full 运行 secretlint；发现真实密钥时失败并通知

#### Scenario: 依赖健康在 main 告警
- **WHEN** PR 合并到 main，新增了低健康度依赖
- **THEN** ci-full 输出告警，退出码为 0（不回滚已合并）
