## Purpose

定义 web-tanstackstart 在 AgentDock 文档站中的用户文档，使开发者能够创建、运行、扩展和验证该模板。

## ADDED Requirements

### Requirement: 双语模板文档与导航

AgentDock 文档站 MUST 提供 web-tanstackstart 的中文和英文入口，并被模板导航收录。文档 MUST 覆盖模板定位、技术栈、创建方式、目录契约、StyleX/Astryx、SQLite/Supabase、验证命令和内网部署边界。

#### Scenario: 文档站可发现模板

- **WHEN** 用户打开中文或英文 Templates 导航
- **THEN** 可以看到 web-tanstackstart 入口并进入完整模板说明

#### Scenario: Supabase 切换有可执行说明

- **WHEN** 用户按文档配置 Supabase Postgres 辅助数据源
- **THEN** 文档提供环境变量、迁移命令、provider 切换方式和回滚到 SQLite 的步骤
