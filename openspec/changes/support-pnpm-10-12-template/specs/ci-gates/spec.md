## ADDED Requirements

### Requirement: pnpm compatibility matrix

`web-tanstackstart` validation MUST 使用同一 lockfile 在 pnpm 10.34.5、11.27.0 和 12.4.1 上执行安装和完整 check。

#### Scenario: 最低支持版本守卫 lockfile

- **WHEN** pnpm 12 将 lockfile 重写为只有 12 可消费的格式
- **THEN** pnpm 10.34.5 CI job 通过 frozen install 失败

#### Scenario: 推荐版本保持绿色

- **WHEN** 任一受支持 pnpm 版本无法完成 check
- **THEN** 矩阵 workflow 失败并指出具体 pnpm 版本
