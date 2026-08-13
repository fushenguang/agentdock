## ADDED Requirements

> **移植来源**：thefoolai `src/routes/_authed/pricing.tsx` / `payment/checkout.tsx` / `payment/$paymentId.tsx` / `account/subscription.tsx` + 3 个组件
> **主要改动**：TanStack Router → Next.js App Router（`useNavigate` → `next/navigation`，`createFileRoute` → page.tsx），`useTranslation(react-i18next)` → `next-intl`，TanStack Query hooks 保留逻辑迁移

### Requirement: 定价页（`/[locale]/pricing`）

`src/app/[locale]/(protected)/pricing/page.tsx` MUST 提供：

- 月付/年付 Tab 切换（shadcn `<Tabs>`）
- 从 `getActiveSubscriptionPlans()` 读取计划（支持 Free / Pro / Enterprise 任意配置）
- 当前用户订阅状态高亮（当前计划卡片显示"当前方案"badge）
- 点击"升级/购买"→ 跳转 `/[locale]/payment/checkout?plan=pro&cycle=yearly`
- 支持 URL 参数个性化（`source` / `feature` / `trigger`）来自 `UpgradeButton` 跳转

**i18n**：页面文案使用 `next-intl`，locale 文件新增 `pricing.*` 命名空间键。

#### Scenario: 已订阅 Pro 的用户进入定价页

- **WHEN** Pro 用户访问 `/zh/pricing`
- **THEN** Pro 卡片显示"当前方案"badge，不显示"升级"按钮（或显示"管理订阅"）

#### Scenario: 年付/月付切换价格实时更新

- **WHEN** 用户点击"月付"Tab
- **THEN** 所有计划卡片的价格切换为月付价格，无需刷新页面

### Requirement: 结算页（`/[locale]/payment/checkout`）

`src/app/[locale]/(protected)/payment/checkout/page.tsx` MUST 提供：

- URL search params：`?plan=pro&cycle=yearly`（缺失时 redirect 到 /pricing）
- 订单摘要：计划名、计费周期、金额
- 支付方式选择：支付宝 / 微信（`<RadioGroup>`）
- 优惠码输入框（可选，提交时调用后端验证；验证失败显示错误，不阻塞支付流程）
- "确认支付"按钮 → 调用 `createPaymentRecord()` 创建数据库记录 → 调用对应支付初始化函数

**结算流程**：

1. 创建 `payments` 记录（status: pending）
2. 调用 `POST /api/payments/alipay/create` 或 `/api/payments/wechat/create`
3. 支付宝 PC → 注入 formHtml 并 submit；支付宝 H5 → redirect
4. 微信 PC → 跳转到 `/payment/[paymentId]` 页面显示二维码；微信 H5 → redirect

#### Scenario: 支付方式选择支付宝后点击确认

- **WHEN** 用户选择支付宝，点击"确认支付"
- **THEN** 按钮显示 loading 状态，数据库记录创建成功后，页面跳转到支付宝收银台（或二维码页）

### Requirement: 支付状态页（`/[locale]/payment/[paymentId]`）

`src/app/[locale]/(protected)/payment/[paymentId]/page.tsx` MUST 提供：

- **pending/processing 状态**：
  - 微信 Native：渲染二维码（`qrcode.react`），每 3 秒轮询 `/api/payments/wechat/query`
  - 支付宝：一般不停留在此页（已跳转支付宝），支付宝 returnUrl 回来后查询结果
- **paid 状态**：成功卡片 + "进入应用"按钮（→ `/dashboard`）
- **failed 状态**：失败卡片 + "重新支付"按钮（→ `/pricing`）

#### Scenario: 微信扫码支付完成后自动跳转

- **WHEN** 用户扫码付款，前端轮询检测到 status = 'paid'
- **THEN** 页面自动切换为成功状态，停止轮询，显示"进入应用"按钮

### Requirement: 账户订阅管理页（`/[locale]/(protected)/settings/subscription`）

订阅管理页 MUST 提供完整的订阅信息和支付历史：

订阅管理页 MUST 提供完整的订阅信息和支付历史：

> 移植自 thefoolai `account/subscription.tsx`，挂载到已有的 settings 路由下

`src/app/[locale]/(protected)/settings/subscription/page.tsx` MUST 提供：

- 当前订阅状态卡片（计划名、到期时间、状态 badge）
- 使用量 / 配额进度条（若 `user_subscriptions` 有配额字段）
- 支付历史列表（`getUserPayments(userId)`，含订单号 / 金额 / 状态 / 时间）
- Free 用户：显示"升级 Pro"入口（→ /pricing）
- Pro 用户：显示"取消自动续费"按钮（`cancel_at_period_end = true`，当前周期内仍有效）

**导航集成**：在 settings sidebar 添加"订阅与账单"导航入口。

#### Scenario: 用户查看支付历史

- **WHEN** Pro 用户访问 /settings/subscription
- **THEN** 页面显示所有历史订单（含成功和失败的），每条含状态 badge

### Requirement: 公共组件（`src/features/subscription/components/`）

公共组件 MUST 从 thefoolai 移植并适配：

**`UpgradeButton`**：

- Props 保持不变（`source`, `feature`, `trigger`, `icon`, `text`, `highlight`）
- `useNavigate`（TanStack）→ `useRouter().push`（next/navigation）

**`ProBadge`**：无路由依赖，原样移植。

**`ProFeatureComparison`**：

- `useTranslation`（react-i18next）→ `useTranslations`（next-intl）
- i18n key 结构保持不变

**`QuotaWarningBanner`**：轻度改造，适配 next.js，移除 TanStack Router 依赖。

这些组件对外导出自 `src/features/subscription/components/index.ts`，供 dashboard 和其他页面按需使用。

#### Scenario: UpgradeButton 在任意页面可用

- **WHEN** 在 dashboard 某个功能卡片中放置 `<UpgradeButton feature="export" />`
- **THEN** 点击跳转到 `/zh/pricing?source=upgrade_button&feature=export`，无 JS 错误
