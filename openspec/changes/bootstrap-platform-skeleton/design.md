## Context

AgentDock 仓库当前近乎空白（`README` 一行、`openspec/config.yaml` 的 `context` 为空、无 monorepo 拓扑），但根目录已存在一个 docs 应用骨架（Fumadocs/Next.js）。本 change 是 5 个 MVP change 的 **①**，为后续 ②（反漂移）③（Layer 2 门禁）④（docs 同步）⑤（web-nextjs 模板）提供共同地基。

约束：

- 第一天即 public 建设：零真实密钥、提交历史干净、关键开源文件齐备。
- MVP 工具面仅 GitHub Copilot + Copilot CLI。
- 技术栈已定：TypeScript 5.9、turborepo 2.9、pnpm 9、Node ≥18，数据层 MVP 走 Supabase（本 change 不涉及）。
- 本仓库是"元仓库/平台本体"，无法完全从自身 bootstrap，对部分模板规则需声明自我豁免。

## Goals / Non-Goals

**Goals:**

- 固化 turborepo + pnpm 顶层目录契约（`templates/`、`packages/`、`apps/docs`、`openspec/`）。
- 规整既有 docs 骨架到 `apps/docs` 平台文档站定位且保持可构建。
- 补齐开源就绪物料与 secret 卫生基线。
- 建立平台自身 Copilot/AGENTS 基线并填写 openspec `context`。

**Non-Goals:**

- 不实现模板内容、Layer 2 门禁、roadmap/对齐脚本、CLI、同步引擎、发版流水线。
- 不覆盖 Copilot 以外的 AI 工具配置。

## Decisions

### D1. 顶层布局：`templates/` + `packages/` + `apps/`

采用三类入口而非扁平包列表，使"模板 / 平台工具 / 平台应用"职责一眼可辨，并与后续 change 的落点一一对应。

- 备选：全部塞进 `packages/`。否决——丢失模板与平台工具的语义区分，AI 易混淆落点。

### D2. 既有 docs 骨架就地规整为 `apps/docs`

现有 docs 应用直接定位为平台文档站，保留其 Fumadocs 能力（供 ④ 复用 llms.txt/Orama），不重建。

- 备选：删除重做。否决——浪费且引入回归风险。

### D3. openspec `context` 现在填写

`context` 指导所有未来规划 session，属"规划基础设施"，在地基 change 落地最合适。内容覆盖：技术栈、SSOT=OpenSpec、文档=apps/docs、Copilot-only、元仓库自我豁免说明。

### D4. Copilot 指令"清单化"而非"叙述化"

`.github/copilot-instructions.md` 每次请求都注入，必须短、规则化以控 token；长背景放 `AGENTS.md` 或 docs。

### D5. 元仓库自我豁免显式声明

在治理说明中写明：本仓库对"孤儿 feature"等面向模板的不变量豁免，避免 ② 落地后误报。

## Risks / Trade-offs

- [既有 docs 重排破坏其构建] → 改动后立即对 `apps/docs` 跑一次 build 验证。
- [顶层契约过早固化，后续 change 想换位置] → 契约只定"语义入口"，不锁内部细节；变更走新 change。
- [openspec context 写得过细导致僵化] → 只写稳定事实（栈/SSOT/定位），不写易变的实现细节。

## Migration Plan

1. 引入 `pnpm-workspace.yaml`/`turbo.json` 顶层拓扑。
2. 将既有 docs 骨架纳入 `apps/docs`（若已在该路径则仅校验）。
3. 新增开源物料与 secret 基线。
4. 新增 Copilot/AGENTS + 填 openspec context。
5. 验证 install/build/check-types/format 全绿。

- 回滚：本 change 全为新增/规整，回滚即还原根配置与移动，无数据迁移。

## Open Questions

- `LICENSE` 选型（如 MIT/Apache-2.0）由人确认——实现时若未定，先放占位并标注待人确认。
