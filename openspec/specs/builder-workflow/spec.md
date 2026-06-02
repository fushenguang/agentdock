## Purpose

定义 AgentDock 的四闸门协作流程，将战略意图、实现执行与机器校验解耦，确保 AI 高速产出始终在人工批准范围内。

## Requirements

### Requirement: Four-gate builder workflow

平台 MUST 以文档固化"四闸门" builder 工作流，明确人与各 AI 角色的职责与顺序：

1. **闸门①（人）** - 人维护 `roadmap.yaml`，只有人能新增/批准意图条目。
2. **规划（Opus）** - Opus 在已批准的 roadmap `id` 下撰写 change，强制含 `roadmap-id` 与 `Non-goals`。
3. **闸门②（人）** - 人审查 scope 与 Non-goals（约 30 秒）。
4. **实现（Sonnet）** - 在新 session 中编码实现。
5. **闸门③（机器）** - lefthook + `align:check` +（③ 提供的）arch/lint 先行运行，客观免费。
6. **review（codex）** - 仅审机器审不了的（逻辑/领域/过度设计气味）。
7. **闸门④（人）** - 人合并。

#### Scenario: 工作流文档可被开发者查阅

- **WHEN** 开发者查阅治理文档
- **THEN** 找到四闸门流程，含每步的执行者（人/Opus/Sonnet/机器/codex）与产出

### Requirement: Change template required fields

OpenSpec change 模板 MUST 强制包含 `roadmap-id` 与 `Non-goals` 字段，并通过 `openspec/config.yaml` 的 `rules` 声明。

**roadmap-id 承载格式（双读单写过渡）**：alignment-check MUST 同时识别两种来源-(a) 新格式：proposal frontmatter 的 `roadmap-id` 字段（**单写**：新建/更新 change 时写入此处）；(b) 旧格式：proposal 正文"Roadmap & Sequence"段中的 `Roadmap 锚点：<id>` 标记（**兼容读取**，供现存 change 过渡）。任一来源解析到存在的 roadmap id 即视为满足孤儿 change 不变量，避免一次性打挂现有全部 change。

#### Scenario: 新格式 frontmatter 被识别

- **WHEN** 某 change 的 proposal frontmatter 含 `roadmap-id: <存在的 id>`
- **THEN** alignment-check 判定其满足孤儿 change 不变量

#### Scenario: 旧格式正文标记兼容读取

- **WHEN** 某现存 change 仅在正文含 `Roadmap 锚点：<存在的 id>`，无 frontmatter 字段
- **THEN** alignment-check 仍判定其满足，不报孤儿 change 失败

#### Scenario: 两种来源均缺失则硬失败

- **WHEN** 某 change 既无 frontmatter `roadmap-id` 也无正文锚点标记
- **THEN** alignment-check 以硬失败报告该 change

#### Scenario: config rules 已声明

- **WHEN** 检查 `openspec/config.yaml`
- **THEN** `rules.proposal` 含"必须引用 roadmap id（新建写 frontmatter）"与"必须包含非空 Non-goals 段"
