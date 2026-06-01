---
roadmap-id: layer2-constraints
---

## Why

企业级生产（安全、稳定第一）要求 AI 违反架构/安全约定时由**机器直接拦截**，而不是靠人 review 发现——人审查带宽有限，且 AI 互审是主观的。Layer 2 的"有牙齿的约束"是 AgentDock"防退化"的核心杠杆，也是 codex review 之前的客观闸门（机器能判的不浪费 codex token）。

## What Changes

- 新增共享 `packages/eslint-config`，内含**有牙齿**的规则：`no-direct-db-in-features`（feature 层禁止直接用 DB 客户端）、`require-feature-contract`（feature 必须有 `__contract__.ts`）等。
- 新增架构守卫：`dependency-cruiser` 配置，固化分层边界——`core` 只读、`features` 之间不得互引、`infra` 变更需人工审批标签。
- 新增安全门禁：`secretlint`（密钥扫描）+ 新依赖健康度检查（低周下载量/异常包告警）。
- 新增共享 `packages/tsconfig`（strict 基线）。
- 接线执行层：`lefthook`（本地 pre-commit/pre-push，秒级反馈）+ `ci-fast`（type-check/lint/arch/unit）与 `ci-full`（集成/安全/对齐报告）两个 GitHub Actions workflow。

## Capabilities

### New Capabilities

- `code-constraints`: eslint-config（有牙齿规则）+ dependency-cruiser 架构守卫 + secretlint + 依赖健康检查（规则定义层）。
- `ci-gates`: lefthook 本地门禁 + ci-fast / ci-full 两个 workflow（执行/接线层）。

### Modified Capabilities

- （无）

## Non-goals

- 不实现 forge-rules 语义投影层（Copilot-only，暂无多工具漂移，押后）。
- 不实现 e2e/Playwright 全套（MVP 只在模板成熟后按需加）。
- 不实现 PR 的 AI review workflow（codex review 暂由人工在流程中触发，不进 CI）。
- 不在本 change 定义业务测试，只定义"工程契约"门禁。
- arch 规则集只覆盖已能在真实模板验证的边界，过度细化的规则押后。

## Roadmap & Sequence

- Roadmap 锚点：`layer2-constraints`（Now）。
- 顺序：**③**，依赖 ①；与 ② 并行可行；是 ⑤（模板消费这些规则）的前置。

## Impact

- 影响范围：新增 `packages/eslint-config`、`packages/tsconfig`、根 `.dependency-cruiser.cjs`、`lefthook.yml`、`.github/workflows/ci-fast.yml` 与 `ci-full.yml`。
- 风险：规则过严会拖慢早期开发 → **架构不变量规则**（`no-direct-db-in-features`、`require-feature-contract`、`no-cross-feature-import`、`no-core-mutation`）从第一天即 `error`——它们只对模板 `src/features/` 生效（⑤ 才存在），现有代码不会误伤，且"有牙齿"是其全部意义；**质量/风格类规则**（import 排序等）先 `warn`，经 ⑤ 真实验证后再升 `error`。与 ② 的 CI 接线需统一编排避免重复。
