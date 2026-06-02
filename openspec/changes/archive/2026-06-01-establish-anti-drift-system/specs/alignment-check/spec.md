## ADDED Requirements

### Requirement: Alignment check script

平台 MUST 提供对齐脚本，经 `pnpm align:check` 调用，校验机器可判定的反漂移不变量并以明确退出码区分硬失败与告警。

脚本 MUST 校验以下不变量：

1. **孤儿 change** — 每个非归档 change 必须 link 一个存在于 `roadmap.yaml` 的 `id` — **硬失败**
2. **孤儿 feature** — 每个 `src/features/*` 必须对应一个 change（**模板输出适用**；本元仓库自身豁免）— **硬失败**
3. **WIP 上限** — `in-progress` epic ≤ 1 — **告警**
4. **僵尸 change** — 处于 `draft` 且超期的 change — **告警**
5. **Non-goals 在场** — 每个 change 的 proposal 必须含非空 Non-goals 段 — **硬失败**

脚本 MUST 只校验机器可判定的事实，不做"代码是否符合规格"的模糊判断。

**`draft` 的唯一机器可判定定义**：一个 change 处于 `draft`，当且仅当它同时满足——(a) 位于 `openspec/changes/`（非 `archive/`），且 (b) 其 `tasks.md` 存在未勾选任务（即未实现完成）。仅当无 `tasks.md` 时，视为 `draft`。**超期**定义为：从 `.openspec.yaml` 的 `created` 字段起算，超过可配置阈值（默认 30 天）。脚本 MUST 不依赖任何不存在的 `status` 字段；draft 与超期均从上述既有事实（目录位置、tasks 勾选、created 时间）推导。

**元仓库豁免的可执行条件**：当且仅当仓库根存在文件 `.agentdock-meta`（或 `package.json` 含 `agentdock.metaRepo: true` 标记）时，孤儿 feature 不变量被跳过。该条件 MUST 是显式标记，不依赖实现者主观判断"这是不是元仓库"。

#### Scenario: 孤儿 change 硬失败

- **WHEN** 某 change 未引用任何 roadmap id，或引用了不存在的 id
- **THEN** `pnpm align:check` 以非零退出码失败并指明该 change

#### Scenario: 缺 Non-goals 硬失败

- **WHEN** 某 change 的 proposal 缺失或为空 Non-goals 段
- **THEN** `pnpm align:check` 以非零退出码失败并指明该 change

#### Scenario: WIP/僵尸仅告警

- **WHEN** 触发 WIP 超限或僵尸 change 条件
- **THEN** 脚本输出告警但退出码为 0（不阻断）

#### Scenario: 僵尸 change 从既有事实推导

- **WHEN** 一个非归档 change 的 `tasks.md` 仍有未勾选项，且其 `.openspec.yaml` 的 `created` 距今超过阈值（默认 30 天）
- **THEN** 脚本将其报告为僵尸 change（告警），且全程不读取任何 `status` 字段

#### Scenario: 已实现的 change 不算 draft

- **WHEN** 一个 change 的 `tasks.md` 全部勾选完成
- **THEN** 无论其 `created` 多久，均不被判为 draft/僵尸

#### Scenario: 元仓库豁免孤儿 feature

- **WHEN** 仓库根存在显式元仓库标记（`.agentdock-meta` 或 package.json `agentdock.metaRepo: true`）
- **THEN** 孤儿 feature 不变量被跳过且不致失败

#### Scenario: 非元仓库不豁免

- **WHEN** 仓库根无元仓库标记，且存在未对应 change 的 `src/features/*`
- **THEN** 孤儿 feature 不变量以硬失败报告

### Requirement: Alignment check wiring

对齐脚本 MUST 注册到 `package.json` 并接入两个检查点：

- `pre-commit` — 仅跑秒级子集（孤儿 change + WIP）
- `commit → main`（CI）— 跑全量对齐报告

#### Scenario: pre-commit 快速子集

- **WHEN** 本地提交触发 pre-commit
- **THEN** 仅运行孤儿 change 与 WIP 检查，秒级完成

#### Scenario: main 全量报告

- **WHEN** 向 main 的 CI 运行
- **THEN** 运行全部不变量并产出完整对齐报告
