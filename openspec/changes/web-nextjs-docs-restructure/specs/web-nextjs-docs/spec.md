## MODIFIED Requirements

### Requirement: web-nextjs 文档站导航结构

`apps/docs/content/docs/zh/templates/web-nextjs/` 下的 `index.mdx` MUST 精简为仅保留架构概览和已完成功能列表，其余内容移入 `usage.mdx` 和 `troubleshooting.mdx` 子页面。

文档站 MUST 新增以下子页面并通过 `meta.json` 组织导航：

- `usage`（模板开发和使用）
- `deployment`（部署）
- `supabase`（数据层：Supabase）
- `drizzle`（数据层：Drizzle）
- `alipay`（支付宝支付）
- `wechat-pay`（微信支付）
- `stripe`（Stripe 支付）
- `troubleshooting`（故障排查）

`i18n-navigation.mdx` MUST 保持不变。

#### Scenario: index.mdx 已精简且末尾有导航链接

- **WHEN** 访问 `/zh/docs/templates/web-nextjs`
- **THEN** 页面不包含「开发工作流」「配置」「非目标」「迁移指南」「故障排查」章节，末尾显示 8 个子页面导航链接

#### Scenario: 左侧导航显示所有新子页面

- **WHEN** 访问 `/zh/docs/templates/web-nextjs`
- **THEN** 左侧导航显示 usage、deployment、supabase、drizzle、alipay、wechat-pay、stripe、troubleshooting、i18n-navigation 共 9 个子页面入口

#### Scenario: i18n-navigation.mdx 未被修改

- **WHEN** 比较修改前后的 `i18n-navigation.mdx`
- **THEN** 文件内容完全一致，无任何变更
