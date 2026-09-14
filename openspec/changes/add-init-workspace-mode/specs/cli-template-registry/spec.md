## ADDED Requirements

### Requirement: Workspace member template metadata

registry MUST 支持可选的 workspace-member 元数据，包括 opt-in 标志和根 `allowBuilds` 需求。模板未声明该元数据时 MUST 保持 standalone-only 行为。

#### Scenario: 单包模板声明 workspace-member 支持

- **WHEN** 模板显式声明 workspace-member 支持且包管理器为 pnpm
- **THEN** init 可以在 workspace mode 使用该模板

#### Scenario: monorepo 模板保持 standalone-only

- **WHEN** 模板未声明 workspace-member 支持
- **THEN** CLI 不以删除 workspace 文件的方式伪造成员模式

### Requirement: Registry runtime constraints

registry MUST 暴露模板 packageManager 版本、`engines.pnpm` 和 `engines.node`，供 init 在写入前执行 workspace 兼容性检查。

#### Scenario: workspace 兼容性检查读取 registry

- **WHEN** CLI 检查根 workspace 是否可承载模板
- **THEN** 使用 registry 中的模板运行时约束
- **AND** 不通过执行模板脚本或安装依赖来探测兼容性
