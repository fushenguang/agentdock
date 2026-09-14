## ADDED Requirements

### Requirement: Explicit package-manager enforcement

registry 的 `packageManagerEnforced` MUST 可以独立于模板是否存在 `packageManager` 字段声明。移除版本 pin MUST NOT 允许 npm、yarn 或 bun。

#### Scenario: 无 packageManager pin 仍只允许 pnpm

- **WHEN** `web-tanstackstart` 移除精确 `packageManager` 并保留 enforced 元数据
- **THEN** `agentdock init --pm pnpm` 成功
- **AND** `agentdock init --pm npm` 在写文件前失败

### Requirement: Runtime range metadata

registry MUST 暴露模板 `engines.pnpm`，workspace mode MUST 使用该范围判断根 workspace 是否兼容。

#### Scenario: 根 workspace 使用 pnpm 10

- **WHEN** 根 workspace 声明 pnpm 10.34.5，模板范围是 >=10.34.5 <13
- **THEN** workspace member 可以生成

#### Scenario: 根 workspace 使用 pnpm 9

- **WHEN** 根 workspace 声明 pnpm 9
- **THEN** init 在写文件前返回 WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE
