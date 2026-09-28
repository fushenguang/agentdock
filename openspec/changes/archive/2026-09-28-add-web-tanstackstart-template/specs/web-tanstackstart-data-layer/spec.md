## Purpose

定义 web-tanstackstart 的数据访问契约，使 SQLite 成为可直接运行的默认数据源，并允许企业项目平滑切换到 Supabase Postgres。

## ADDED Requirements

### Requirement: SQLite 默认仓储链路

模板 MUST 默认使用 Drizzle ORM + better-sqlite3，并通过 `core/repositories` 接口向 features 暴露数据能力。SQLite 数据库文件路径 MUST 可通过环境变量覆盖，默认值 MUST 指向项目内可忽略的数据目录。

#### Scenario: 零外部服务启动

- **WHEN** 开发者不配置任何数据库环境变量并启动模板
- **THEN** 参考 feature 能连接本地 SQLite，并完成一次读取和一次写入

#### Scenario: feature 不直接访问数据库客户端

- **WHEN** `features/**` 中出现对 `infra/db` 的直接 import
- **THEN** lint 失败并提示使用仓储接口

### Requirement: Supabase Postgres 辅助适配

模板 MUST 提供第二套 Drizzle Postgres schema 与仓储实现，用于连接 Supabase。数据源 MUST 通过环境变量切换；未配置 Supabase 时 MUST 继续使用 SQLite，且不得因为缺少 Supabase 密钥而启动失败。

#### Scenario: 配置 Supabase 后切换数据源

- **WHEN** 设置 Supabase Postgres 连接环境变量并选择 Supabase provider
- **THEN** 同一仓储接口由 Postgres 实现提供服务，参考 feature 不需要修改业务调用代码

#### Scenario: 未配置 Supabase 时默认可用

- **WHEN** 环境只包含默认 SQLite 配置
- **THEN** 应用启动、类型检查、测试和构建均不要求 Supabase URL、Key 或数据库连接

### Requirement: 数据库迁移与验证

模板 MUST 提供可重复执行的 Drizzle Kit 命令，用于生成和迁移 SQLite schema；Supabase schema MUST 有独立的迁移或生成入口。模板 MUST 提供测试，使用临时或内存 SQLite 验证仓储行为。

#### Scenario: SQLite 迁移可执行

- **WHEN** 开发者执行模板声明的 SQLite migration 命令
- **THEN** 指定数据库文件获得参考 feature 所需表结构，命令 exit 0

#### Scenario: 数据库测试不依赖外部服务

- **WHEN** 执行 `pnpm test`
- **THEN** 仓储测试使用临时 SQLite 完成并通过，不连接 Supabase 或任何远程服务
