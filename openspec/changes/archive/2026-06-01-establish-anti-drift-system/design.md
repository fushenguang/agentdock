## Context

Change ① 已建立 monorepo 地基并归档。本 change（②）落地 AgentDock 的**核心价值主张：反漂移系统**。团队吃过的大亏是"人的审查带宽 < AI 产出带宽"，导致方向偏移与过度设计。解法是**非对称分工**：人审查"地图"（roadmap，小/慢/稳），机器校验"对齐"（机器可判定的不变量）。让 AI 在实现层全速狂奔，但狂奔的方向只有人能改。

约束：

- 对齐脚本只能校验机器可判定的事实，不做模糊的"是否符合规格"判断。
- CI 的具体 workflow 文件与 ③（Layer 2）协调，避免重复编排；本 change 聚焦"对齐逻辑 + 接线点"，门禁执行器（lefthook/workflow 骨架）若 ③ 尚未落地则先提供最小可用接线。
- 本仓库是元仓库，对"孤儿 feature"不变量豁免。

## Goals / Non-Goals

**Goals:**

- 产出初始 `roadmap.yaml`（5 个 Now 锚点 + Later 的 builtin-suite，`platform-foundation` 标 `done`）。
- 产出 `pnpm align:check` 对齐脚本，实现不变量 1–5，硬失败/告警分级。
- 通过 CODEOWNERS/CI 保护 `roadmap.yaml` 修改权。
- 固化四闸门 builder workflow 文档 + change 模板强制字段（config rules）。

**Non-Goals:**

- 不实现不变量 6（单次抽象 lint）、不做强制 pre-task git hook、不做 research-preview、不做 Skills 生命周期。

## Decisions

### D1. roadmap.yaml 为唯一意图源，人拥有

单文件、四桶、扁平 id。选 YAML 而非 JSON：人写友好、注释友好。

- 备选：用 OpenSpec 自身字段表达 roadmap。否决——roadmap 需独立于 change 生命周期，且要被 CODEOWNERS 单独保护。

### D2. 对齐脚本用 Node/TS 实现，零重型依赖

脚本读 `roadmap.yaml` + 扫 `openspec/changes/*/proposal.md` 的 frontmatter/正文，做纯静态校验。退出码：硬失败→非零，告警→0。

- 备选：写成 OpenSpec 插件。否决——MVP 不引入插件机制，保持可移植。

### D3. roadmap-id 的承载方式（双读单写过渡）

现状：现有待办 change 均在 proposal 正文"Roadmap & Sequence"段用 `Roadmap 锄点：<id>` 引用。直接切换到 frontmatter 会一次性打挂全部现有 change（与 tasks 7.1 验收冲突）。决策采用**双读单写**：

- **单写**：今后新建/更新 change 时，roadmap-id 写入 proposal frontmatter 的 `roadmap-id` 字段（唯一推荐格式）。
- **双读**：alignment-check 同时识别 frontmatter 新格式与正文旧标记，任一解析到存在的 id 即满足。
- 过渡收口：可选在本 change 内将现有 4 个待办 change 迁移到 frontmatter（任务 4.3），但即使不迁移，双读也保证 7.1 通过。
- 避免自由文本解析脆弱：两种格式均为固定可解析结构（frontmatter 键 / 固定前缀行）。

### D4. 硬失败 vs 告警的分级

不变量 1/2/5 硬失败（孤儿 change、孤儿 feature、缺 Non-goals），3/4 告警（WIP、僵尸）。理由：1/2/5 是"方向正确性"的客观底线；3/4 是"节奏健康度"，过严会误伤正常并行。

### D5. 检查点分层

pre-commit 只跑秒级子集（孤儿 change + WIP）保证开发体验；main CI 跑全量。与 ③ 的 lefthook/workflow 统一编排。

### D6. 元仓库豁免实现（显式标记）

豁免不依赖实现者主观判断"是不是元仓库"。采用**显式标记**：仓库根存在 `.agentdock-meta` 文件（或 `package.json` 含 `agentdock.metaRepo: true`）时，跳过孤儿 feature 不变量。本 change 实现时为本元仓库添加该标记，呼应 `config.yaml` 已声明的 meta-repo self-exception。

- 备选：检测是否存在 `src/features/*` 目录。否决——"正好没有 feature"与"豁免"语义不同，隐式推断易误判。

### D7. draft 状态的机器可判定来源

change 元数据（`.openspec.yaml`）只有 `schema` 与 `created`，无 `status` 字段。不新增 `status`（避免多一个需维护、易不一致的状态源），而是从既有事实推导：

- **draft** = 位于非 `archive/` 且 `tasks.md` 有未勾选项（或无 tasks.md）。
- **超期** = `.openspec.yaml.created` 距今 > 阈值（默认 30 天，可配）。
- 僵尸 change = draft 且超期。已实现（tasks 全勾选）或已归档的 change 永不算僵尸。
- 负责维护：无人手动维护状态——状态由目录位置 + tasks 勾选 + created 时间全自动推导。

## Risks / Trade-offs

- [自由文本解析 roadmap-id 脆弱] → D3 双读单写：frontmatter 单写 + 正文标记兼容读取，两者皆为固定可解析结构。
- [闸门过严拖慢节奏] → 硬失败项最小化（仅 1/2/5）；WIP/僵尸仅告警；阈值可配置。
- [与 ③ 的 CI 接线重复] → 本 change 只定义 `align:check` 脚本与接线"点"，实际 workflow 文件由 ③ 统一收口；若 ③ 未到先放最小 workflow。
- [roadmap 保护可被绕过] → CODEOWNERS + CI 必需审查双保险。

## Migration Plan

1. 新增 `roadmap.yaml`（初始锚点）。
2. 新增 `scripts/align-check`（TS）+ `package.json` 注册 `align:check`。
3. 新增 `.github/CODEOWNERS` 保护 roadmap.yaml；新增/接入最小 CI 步骤。
4. 写 config.yaml `rules`（roadmap-id + Non-goals 必填）。
5. 写四闸门 workflow 文档。
6. 自校验：对现有 4 个待办 change 跑 `align:check`，应全部通过（均有 roadmap 锚点与 Non-goals）。

- 回滚：纯新增，删除新增文件即可还原。

## Open Questions

（无——codex 评审提出的三个开放问题已在 D3/D6/D7 定档：draft 来源全自动推导、roadmap-id 双读单写、元仓库豁免用显式标记）
