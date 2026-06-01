---
roadmap-id: anti-drift-system
---

## Why

团队用 AI 快速迭代时吃过大亏：AI 生成了大量 OpenSpec changes 和功能，最终方向偏移、过度设计严重，内部使用困难、人工验证难做。根因是**人的审查带宽 < AI 的产出带宽**，且漂移在 AI 加持下被放大、加快、更隐蔽。这是 AgentDock 真正要解决的核心问题，必须在地基之后**第一优先**落地，让后续每个 change 都被它治理。

## What Changes

- 引入 `roadmap.yaml`（人拥有、机器可校验）：`Now/Next/Later/Won't` 四桶，每项含 `id`、`status`、`owner`；强制 WIP 上限（`in-progress` 的 epic ≤ **1**）。
- 引入**对齐脚本**（`pnpm align:check`），校验机器可判定的反漂移不变量：
  1. 孤儿 change（每个 change 必须 link 一个存在的 roadmap id）— 硬失败
  2. 孤儿 feature（每个 `src/features/*` 必须对应一个 change）— 硬失败
  3. WIP 上限 — 告警
  4. 僵尸 change（draft 超期堆积）— 告警
  5. Non-goals 在场（每个 change 必须有非空 Non-goals）— 硬失败
- 强制 OpenSpec change 模板含 `roadmap-id` 与 `Non-goals` 字段（写进 `openspec/config.yaml` rules）。
- 固化 **builder workflow**：人批准 roadmap 条目（闸门①）→ Opus 在已批准 id 下写 change → 人审 scope/Non-goals（闸门②）→ Sonnet 实现 → 机器门禁先跑（闸门③）→ codex review 机器审不了的 → 人 merge（闸门④）。
- 通过 CODEOWNERS/CI 规则保护 `roadmap.yaml`：**AI 不能在普通 change 里顺手改 roadmap**。
- 接入检查点：`pre-commit`（孤儿+WIP，秒级）与 `commit→main`（全量对齐报告）。

## Capabilities

### New Capabilities

- `roadmap`: `roadmap.yaml` 的 schema、四桶模型、WIP 上限、修改权保护。
- `alignment-check`: 不变量 1–5 的校验脚本、`package.json` 脚本注册、pre-commit 与 main 检查点接线。
- `builder-workflow`: 四闸门协作流程文档 + change 模板强制字段（roadmap-id / Non-goals）+ config.yaml rules。

### Modified Capabilities

- （无）

## Non-goals

- 不实现"单次抽象 lint"（不变量 6）— 误报率需真实代码验证，押后并标注"需真实项目验证"。
- 不把"任务开始前闸门"做成强制 git hook — MVP 先用 copilot-instructions 软约束。
- 不实现 research-preview 快速上下架机制（与企业级稳定天然冲突，押后等真实信号）。
- 不做 Skills 生命周期/过期/`verify_command` 机制。
- 对齐脚本只校验**机器可判定**的不变量，不做"代码是否符合规格"的模糊判断。

## Roadmap & Sequence

- Roadmap 锚点：`anti-drift-system`（Now，本平台的核心价值主张）。
- 顺序：**②**，依赖 ①。是后续所有 change 的治理基础，应早于 ④⑤。

## Impact

- 影响范围：仓库根新增 `roadmap.yaml`、`scripts/align-check`、`package.json` 脚本、`.github/CODEOWNERS`、`openspec/config.yaml` rules、lefthook/CI 接线（CI 细节与 ③ 协调）。
- 风险：闸门过严可能拖慢节奏 → WIP 与硬失败项需可配置；本仓库自身作为"元仓库"对部分不变量（如孤儿 feature）可豁免。
