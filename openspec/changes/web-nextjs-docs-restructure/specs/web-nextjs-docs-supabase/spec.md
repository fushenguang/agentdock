## ADDED Requirements

### Requirement: 自部署 Supabase 完整文档

`apps/docs/content/docs/zh/templates/web-nextjs/supabase.mdx` MUST 提供完整的自部署 Supabase 配置指南。

文档 MUST 覆盖以下章节：

- Supabase Cloud vs 自部署对比
- Docker Compose 自部署步骤（前置条件、克隆配置、环境变量、启动、验证）
- 身份认证配置（SMTP、GitHub OAuth、Google OAuth、微信登录、阿里云短信、腾讯云短信）
- 数据表与 RLS 安全（迁移执行、`__SCHEMA__` 替换、RLS 最佳实践）
- 文件存储（Storage 配置与使用示例）
- 数据备份（pg_dump、Docker volume、cron 自动化）
- Realtime（启用与客户端订阅示例）
- Edge Functions（部署与使用）
- AI 功能（pgvector 扩展与向量检索）
- MCP Server（VS Code/Cursor 配置）
- 安全注意事项
- 常见问题（FAQ）

#### Scenario: supabase.mdx 可正常渲染

- **WHEN** 访问 `/zh/docs/templates/web-nextjs/supabase`
- **THEN** 页面正常渲染所有章节，代码块语法高亮正确

#### Scenario: Docker Compose 自部署步骤完整可执行

- **WHEN** 用户按文档步骤操作
- **THEN** 可成功克隆、配置、启动自部署 Supabase 实例
