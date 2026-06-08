## ADDED Requirements

### Requirement: Supabase 数据表（3 张核心表）

`templates/web-nextjs/` 的 Supabase 项目 MUST 提供以下表，并附带完整 RLS 策略和迁移 SQL。

**`subscription_plans`（计划目录，管理员维护）**：

```sql
id, plan_code (text unique), plan_name (text), description (text),
price_monthly (int, 分), price_yearly (int, 分),
features (jsonb),           -- 功能标志和限制
display_order (int),
is_active (bool default true), is_featured (bool default false),
created_at, updated_at
```

RLS：所有已认证用户可 SELECT；INSERT/UPDATE/DELETE 仅 service_role。

**`user_subscriptions`（用户订阅记录）**：

```sql
id, user_id (uuid references auth.users),
plan_id (int references subscription_plans),
status (text: trial | active | expired | cancelled | pending),
billing_cycle (text: monthly | yearly),
current_period_start (timestamptz), current_period_end (timestamptz),
cancelled_at (timestamptz), cancel_at_period_end (bool default false),
last_payment_id (int), next_billing_date (date),
metadata (jsonb), created_at, updated_at
```

RLS：用户只能 SELECT/UPDATE 自己的记录；INSERT 由 service_role（webhook）执行。

**`payments`（支付流水）**：

```sql
id, user_id (uuid references auth.users),
subscription_id (int references user_subscriptions),
order_no (text unique),          -- 商户订单号，格式: WN{timestamp}{4位随机}
amount (int, 分), currency (text default 'CNY'),
payment_method (text: alipay | wechat | stripe),
payment_channel (text),          -- alipay_page | alipay_wap | wechat_native | wechat_h5
status (text: pending | paid | failed | refunded | cancelled),
provider_trade_no (text),        -- 支付宝/微信的交易流水号
provider_response (jsonb),       -- 原始回调数据
paid_at (timestamptz), refunded_at (timestamptz),
metadata (jsonb), created_at, updated_at
```

RLS：用户只能 SELECT 自己的支付记录；INSERT/UPDATE 由 service_role（webhook）执行。

**迁移文件**：`supabase/migrations/YYYYMMDD_add_subscription_tables.sql`，包含建表 + RLS + 默认计划数据（Free / Pro 两个计划）。

#### Scenario: 用户可以查询自己的订阅和支付记录

- **WHEN** 已认证用户执行 `SELECT * FROM user_subscriptions WHERE user_id = auth.uid()`
- **THEN** 返回该用户的记录，其他用户的记录不可见

#### Scenario: 异步通知 webhook 可以更新支付状态

- **WHEN** `POST /api/payments/alipay/notify` 收到支付宝回调，验签成功
- **THEN** 使用 service_role 客户端将 `payments.status` 更新为 `paid`，`user_subscriptions.status` 更新为 `active`

### Requirement: TypeScript 类型定义 MUST 导出所有业务类型

`src/features/subscription/types.ts` MUST 导出所有业务类型（参考 thefoolai 的 `subscription.types.ts`，但移除业务特定字段）：

- `SubscriptionPlan`, `UserSubscription`, `Payment`（与数据表对应）
- `PlanCode = 'free' | 'pro' | 'enterprise'`
- `BillingCycle = 'monthly' | 'yearly'`
- `PaymentMethod = 'alipay' | 'wechat' | 'stripe'`
- `PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'`

#### Scenario: TypeScript 类型定义完整可用

- **WHEN** 开发者 import `src/features/subscription/types.ts`
- **THEN** 所有订阅、支付相关类型均可正常导出，无类型错误

### Requirement: 服务层函数（纯数据库操作）

`src/features/subscription/service.ts` MUST 提供：

- `getActiveSubscriptionPlans()` — 查询所有激活计划
- `getSubscriptionPlanByCode(planCode)` — 按 code 查询单个计划
- `getUserActiveSubscription(userId)` — 查询用户当前有效订阅（status in ['trial', 'active']）
- `getUserSubscriptionHistory(userId)` — 查询所有历史订阅

`src/features/subscription/payment-service.ts` MUST 提供：

- `createPaymentRecord(params)` — 创建 payments 记录（status: pending）
- `getPaymentByOrderNo(orderNo)` — 按订单号查询
- `getUserPayments(userId)` — 查询用户支付历史

#### Scenario: 服务层函数不依赖支付 SDK

- **WHEN** 在没有配置任何支付 env 的环境中 import subscription/service.ts
- **THEN** 不报错（数据库操作只依赖 Supabase，不依赖 alipay-sdk 等）
