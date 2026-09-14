## ADDED Requirements

### Requirement: Supported pnpm range

`web-tanstackstart` MUST 声明 pnpm `>=10.34.5 <13`，MUST NOT 使用精确 `packageManager` pin 强制自动切换。Node `>=22.13.0` 要求保持不变。

#### Scenario: pnpm 10 开发者无需升级 major

- **WHEN** 开发者使用 pnpm 10.34.5 和 Node >=22.13.0
- **THEN** `pnpm install` 成功执行模板所需构建
- **AND** `pnpm check` 通过

#### Scenario: pnpm 12 推荐版本可用

- **WHEN** 开发者使用 pnpm 12.4.1
- **THEN** 同一 lockfile 可通过 frozen install
- **AND** `pnpm check` 通过

#### Scenario: 不支持的版本被拒绝

- **WHEN** 使用 pnpm 9 或 pnpm 13
- **THEN** engine 校验阻止安装并给出支持范围

### Requirement: Shared compatibility lockfile

模板 lockfile MUST 使用最低支持版本 pnpm 10.34.5 生成，且 MUST 能被 10.34.5、11.x 和 12.x 通过 `--frozen-lockfile` 消费而不产生修改。

#### Scenario: 跨版本 frozen install

- **WHEN** 对同一干净模板分别运行 pnpm 10.34.5、11.27.0 和 12.4.1 的 `install --frozen-lockfile`
- **THEN** 三次安装均退出 0
- **AND** lockfile hash 不变

### Requirement: Workspace-owned install policy

standalone 模板 MUST 在 `pnpm-workspace.yaml` 维护 engine 与构建授权设置，MUST NOT 依赖只对旧 pnpm 生效的 `.npmrc` 安装策略。

#### Scenario: 配置真源可检查

- **WHEN** 检查 standalone 模板
- **THEN** 不存在 `.npmrc`
- **AND** `pnpm-workspace.yaml` 包含 `packages: []`、`engineStrict: true` 和 `allowBuilds`
