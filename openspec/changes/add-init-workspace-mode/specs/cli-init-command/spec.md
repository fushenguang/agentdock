## ADDED Requirements

### Requirement: Init placement modes

`agentdock init` MUST 支持 `--mode auto|workspace|standalone`，默认值为 `auto`。`auto` MUST 从目标路径向上寻找最近的 `pnpm-workspace.yaml`，并依据其中 `packages` 的正负 glob 决定目标是否为 workspace member。

#### Scenario: workspace 内自动选择 workspace mode

- **WHEN** 目标路径匹配最近父 workspace 的正 glob
- **THEN** placement mode 为 `workspace`
- **AND** 不生成子级 `pnpm-workspace.yaml`、`pnpm-lock.yaml` 或 `.npmrc`

#### Scenario: workspace 外自动选择 standalone mode

- **WHEN** 目标路径没有祖先 pnpm workspace
- **THEN** placement mode 为 `standalone`
- **AND** 模板的 workspace、lockfile 与 npmrc 文件完整生成

#### Scenario: negative glob 排除目标

- **WHEN** 目标先匹配正 glob 又匹配 `!` 负 glob
- **THEN** 目标被视为非成员
- **AND** auto mode 选择 standalone

#### Scenario: 显式 standalone 与父 workspace 冲突

- **WHEN** 目标匹配父 workspace 且用户指定 `--mode standalone`
- **THEN** init 在写文件前失败并返回 `WORKSPACE_STANDALONE_CONFLICT`

### Requirement: Workspace member rendering

支持 workspace-member mode 的模板 MUST 以普通 workspace package 生成。生成包 MUST NOT 声明 `packageManager` 或 `engines.pnpm`，但 MUST 保留 `engines.node` 和业务依赖。

#### Scenario: 生成包移除根所有权字段

- **WHEN** 使用 workspace mode 生成 `web-tanstackstart`
- **THEN** `package.json` 不包含 `packageManager`
- **AND** `engines.pnpm` 不存在
- **AND** `engines.node` 保持模板要求

#### Scenario: 不支持 workspace member 的模板被拒绝

- **WHEN** 用户对没有 workspaceMember 元数据的模板指定 workspace mode
- **THEN** init 返回 `WORKSPACE_MODE_UNSUPPORTED` 且不写文件

### Requirement: Write-before compatibility gate

workspace mode MUST 在写文件前校验根 `packageManager`、模板 pnpm 要求和当前 Node 版本。任何不兼容 MUST 阻止创建目标目录。

#### Scenario: 根 pnpm 版本低于模板最低支持版本

- **WHEN** 根 `packageManager` 是 `pnpm@10.0.0` 且模板要求 `>=10.34.5 <13`
- **THEN** init 返回 `WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE`
- **AND** 目标目录不存在

#### Scenario: Node 版本过低

- **WHEN** 当前 Node 不满足模板 `engines.node`
- **THEN** init 返回 `WORKSPACE_NODE_INCOMPATIBLE`
- **AND** 目标目录不存在

### Requirement: Root changes are reported, not applied

workspace mode MUST 计算根 `allowBuilds` 差异但 MUST NOT 默认修改根配置。缺少的布尔规则 MUST 进入 `requiredRootChanges`；已与期望值一致的规则 MUST NOT 重复进入；不同值或非布尔值 MUST 进入 `rootConfigConflicts`。

#### Scenario: 根 allowBuilds 缺失

- **WHEN** 根 workspace 未声明模板要求的 native build approval
- **THEN** JSON 结果的 `requiredRootChanges` 包含对应 `mergeAllowBuilds` 条目
- **AND** 根 `pnpm-workspace.yaml` 内容不变

#### Scenario: 根 allowBuilds 冲突

- **WHEN** 根配置把要求的键设为 `false` 或占位字符串
- **THEN** JSON 结果的 `rootConfigConflicts` 包含当前值和期望值
- **AND** CLI 不覆盖该值

### Requirement: Agent-readable workspace context

workspace mode MUST 在生成项目内写入 `.agentdock/workspace.json`，并在 `AGENTS.md` 顶部加入 workspace 安装与验证说明。standalone mode MUST NOT 注入该说明。

#### Scenario: 后续 Agent 读取 workspace 边界

- **WHEN** workspace mode 完成生成
- **THEN** `.agentdock/workspace.json` 包含 workspaceRoot、lockfileOwner 和 packageManager
- **AND** `AGENTS.md` 明确要求从 workspace 根安装并推荐 `pnpm --filter <package> check`

### Requirement: Structured init result

每次 init 结果 MUST 包含实际 `mode`。standalone 结果 MUST 给出本地 lockfile owner；workspace 结果 MUST 给出根 lockfile owner、workspaceRoot、requiredRootChanges 与 rootConfigConflicts。

#### Scenario: Agent JSON 输出

- **WHEN** Agent 使用 `--json` 完成 workspace mode 初始化
- **THEN** stdout 是有效 JSON
- **AND** 包含 `mode: "workspace"`、`workspaceRoot`、`lockfileOwner`、`requiredRootChanges` 和 `rootConfigConflicts`
