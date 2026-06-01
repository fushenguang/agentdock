## Purpose

定义 `roadmap.yaml` 作为 AgentDock 的唯一意图地图与 WIP 节奏边界，并对其结构与修改权限提供可验证约束。

## Requirements

### Requirement: roadmap.yaml schema
平台根 MUST 提供单一 `roadmap.yaml` 作为"人拥有的意图地图"，采用 `Now / Next / Later / Won't` 四桶模型。

每个条目 MUST 含字段：
- `id`（kebab-case，全局唯一，供 change 引用）
- `title`（人类可读）
- `status`（枚举：`planned` / `in-progress` / `done`）
- `owner`（负责人标识）

#### Scenario: roadmap 可被解析且字段完整
- **WHEN** 对齐脚本读取 `roadmap.yaml`
- **THEN** 四桶结构被识别，且每个条目均含 `id`/`title`/`status`/`owner`，缺字段时报错

#### Scenario: id 唯一
- **WHEN** 存在两个相同 `id` 的条目
- **THEN** 对齐脚本以硬失败报告重复 id

### Requirement: Initial roadmap anchors
初始 `roadmap.yaml` MUST 在 `Now` 桶包含 5 个 MVP 锚点：`platform-foundation`、`anti-drift-system`、`layer2-constraints`、`growth-trace-docs`、`web-nextjs-template`；并在 `Later` 桶包含 `web-nextjs-builtin-suite`（production 功能套，刻意延后）。

#### Scenario: MVP 锚点齐备
- **WHEN** 检查初始 `roadmap.yaml`
- **THEN** `Now` 含上述 5 个 id，`Later` 含 `web-nextjs-builtin-suite`

#### Scenario: 已归档锚点状态正确
- **WHEN** 检查 `platform-foundation` 条目（change ① 已实现归档）
- **THEN** 其 `status` 为 `done`

### Requirement: WIP limit
`roadmap.yaml` SHALL 强制在制品上限：`status: in-progress` 的 epic 数量 MUST <= 1。该上限以告警（非硬失败）方式由对齐脚本执行。

#### Scenario: 超出 WIP 上限告警
- **WHEN** 存在 2 个或更多 `in-progress` 条目
- **THEN** 对齐脚本输出 WIP 超限告警（不阻断）

### Requirement: roadmap modification protection
`roadmap.yaml` 的修改权 MUST 受保护：AI 不得在普通 change 中顺手修改它。该保护通过 `.github/CODEOWNERS` 与 CI 规则实现，要求人工审查。

#### Scenario: roadmap 变更需人工 owner 审查
- **WHEN** 一个 PR 修改了 `roadmap.yaml`
- **THEN** CODEOWNERS 要求指定人工 owner 审批，未获批不可合并