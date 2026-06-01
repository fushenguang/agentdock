## ADDED Requirements

### Requirement: Open-source readiness

仓库从第一天 public 建设，MUST 提供开源就绪物料：`LICENSE`、可读的 `README`、`CONTRIBUTING`。

#### Scenario: 关键开源文件齐备

- **WHEN** 检查仓库根
- **THEN** 存在 `LICENSE`、`README`（说明 AgentDock 是什么/不是什么/如何用）、`CONTRIBUTING`

### Requirement: Secret hygiene baseline

平台 MUST 建立基础 secret 卫生基线，确保公开仓库不含任何真实密钥。

#### Scenario: 无明文密钥

- **WHEN** 对全仓运行 secret 扫描（如 secretlint 基础规则）
- **THEN** 不报告任何真实密钥；示例配置仅使用占位值

#### Scenario: 敏感文件被忽略

- **WHEN** 检查 `.gitignore`
- **THEN** `.env*`、本地凭据与构建产物等被正确忽略

### Requirement: Commit convention

平台 SHALL 采用 conventional commits 提交规范并在 `CONTRIBUTING` 中声明。

#### Scenario: 规范被记录

- **WHEN** 阅读 `CONTRIBUTING`
- **THEN** 明确声明使用 conventional commits 及基本示例
