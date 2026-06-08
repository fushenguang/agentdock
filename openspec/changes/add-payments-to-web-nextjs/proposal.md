---
roadmap-id: web-nextjs-builtin-suite
---

## Why

web-nextjs 模板目前具备完整的 auth 和 user account 体系，但缺少变现能力。对于使用该模板构建 SaaS 的开发者，支付和订阅是不可或缺的闭环：有了付费机制，才能从"可演示"变成"可上线"。

国内用户首选支付宝 + 微信支付，这是 SaaS 变现的核心渠道。参考实现来自已验证的 thefoolai 项目（`alipay-sdk@^4.14.0` + 支付宝原生 SDK，已在生产运行），支付宝部分可直接移植，微信 Native 扫码从零实现。

## What Changes

- **Supabase 数据层**：新增 `subscription_plans`、`user_subscriptions`、`payments` 表（含 RLS），以及 `usage_quotas` 简化配额结构
- **支付宝集成**（从 thefoolai 移植）：PC 页面支付（`alipay.trade.page.pay`）+ H5 手机网站支付（`alipay.trade.wap.pay`）+ 异步通知验签 + 订单查询
- **微信 Native 扫码**（新实现）：`wechatpay-node-v3` SDK，Native 扫码（生成二维码 URL）+ H5 支付（手机浏览器唤起微信）+ 异步通知验签 + 订单查询
- **订阅 UI**（从 thefoolai 迁移适配）：定价页、结算页、支付状态页、账户订阅管理页、`UpgradeButton` / `ProBadge` / `ProFeatureComparison` 组件

## Capabilities

### New Capabilities

- `subscription-data-layer`：Supabase 数据库表 + RLS + TypeScript 类型定义 + 服务层函数
- `alipay-integration`：支付宝 PC + H5 支付全链路（Route Handlers，从 thefoolai 移植）
- `wechat-native-pay`：微信 Native 扫码 + H5 支付（从零实现）
- `subscription-ui`：定价页 + 结算页 + 支付状态页 + 账户订阅管理 + 公共组件

## Non-goals

- **不做 Stripe**：国际支付单独 change，面向出海场景
- **不做微信 JSAPI**（公众号内支付）：需要额外微信公众号资质，超出 MVP 范围
- **不做优惠券系统**：thefoolai 有 coupon-service，但过于业务化，不纳入通用模板
- **不做发票功能**：Payment 表保留 `invoice_url` 字段预留，但实现留后
- **不做 usage quota 强制限制**：数据层预留字段，但模板不硬编码业务配额逻辑
- **不做支付分析 dashboard**：管理端功能，超出用户侧模板范围

## Roadmap & Sequence

- Roadmap 锚点：`web-nextjs-builtin-suite`（Now，in-progress）
- 分支：`feat/add-payments-to-web-nextjs`
- 顺序：① subscription-data-layer → ② alipay-integration → ③ wechat-native-pay → ④ subscription-ui（UI 依赖数据层和支付逻辑）

## Impact

- 影响范围：`templates/web-nextjs/apps/web/`（新增 `src/features/subscription/`）+ Supabase 数据库（新表）
- 风险等级：中（支付宝移植成熟，微信新实现有不确定性；Supabase 表结构需在开发环境测试后确认）
- 本地开发：异步通知（notify_url）需要 Cloudflare Tunnel 或 ngrok 提供公网 URL
