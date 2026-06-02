---
roadmap-id: web-nextjs-template
---

## Why

AgentDock 的第一个、也是 MVP 唯一的模板是 `web-nextjs`，团队内部马上要用它构建真实服务。按"模型 C"，模板本身是一个**可运行的通用参考应用**——它的"真实性"来自内置通用能力是生产级、被 CI 测试、被团队真实使用；企业业务代码只活在从模板生成的**下游私有仓**里。本 change 只做**地基**，把平台需要真实项目验证的部分先验一遍。

## What Changes

- 在 `templates/web-nextjs/` 建立目录契约：`src/core/`（只读稳定层）、`src/features/`（AI 主战场，含 `__contract__.ts` 约定）、`src/infra/`（需审批）、`src/features/_experiments/`（物理隔离沙盒）。
- 数据层：实现 Supabase 的 `core/repositories` **仓储抽象**，`infra/db` 为实现层；预留 Drizzle 扩展边界（不实现，仅保证"加实现"而非"重构层"）。
- 提供 **1 个参考 feature**（最小、自包含、含 contract + tests + index），验证目录契约与 Layer 2 规则真实可用、不别扭。
- 模板自带：`.github/copilot-instructions.md` + `AGENTS.md`（消费 ③ 的 eslint-config/arch 规则）、自己的 `openspec/`、自己的 `apps/docs`（模板内 docs，区别于平台 `apps/docs`）。
- i18n 骨架：英文优先，中文占位（`t('key')` value=key），不双语全量维护。
- 消费 ③ 的 `packages/eslint-config`/`packages/tsconfig` 与 ② 的对齐/roadmap 机制。

## Capabilities

### New Capabilities

- `template-directory-contract`: `core/features/infra/_experiments` 目录契约 + `__contract__.ts` 约定 + 1 个参考 feature。
- `template-data-layer`: Supabase 仓储抽象（`core/repositories` + `infra/db`），Drizzle 扩展边界。
- `template-self-config`: 模板自带的 Copilot/AGENTS/openspec/docs + i18n 骨架。

### Modified Capabilities

- （无）

## Non-goals

- **不实现** production 级 auth/用户中心/注册/验证码/帮助页全套——那是真实产品工作量，放 roadmap `Later`，本 change 不建。
- 不实现 `__contract__.ts` 的强制写作顺序硬 hook（先软约束，标注"需真实开发验证不别扭"）。
- 不实现 Drizzle（仅留边界）。
- 不做 Tauri/Electron/Expo/Rust 等其它模板。
- 不做 shadcn 全套业务组件库封装，MVP 仅引入 ui 基线 + 1 个参考 composed 组件。
- 不做 Dokploy/docker 部署全套（押后，标注"需真实项目验证"）。

## Roadmap & Sequence

- Roadmap 锚点：`web-nextjs-template`（Now）；production 功能套 → `web-nextjs-builtin-suite`（Later，不现在建）。
- 顺序：**⑤**，依赖 ①（拓扑）与 ③（约束规则）；建议 ④ 之后，使模板的演化也被 docs 记录。

## Impact

- 影响范围：新增 `templates/web-nextjs/**` 全量地基；消费 `packages/eslint-config`、`packages/tsconfig`、对齐脚本。
- 风险：目录契约可能与 Next.js App Router/约定有摩擦 → 必须在 1 个参考 feature 上验证日常开发不别扭，再固化为模板默认。
