## 0. Git 分支准备

- [ ] 0.1 `git checkout main && git pull`
- [ ] 0.2 `git checkout -b feat/add-payments-to-web-nextjs`

## 1. 依赖安装

在 `templates/web-nextjs/apps/web/` 目录下：

- [ ] 1.1 安装支付 SDK：`pnpm add alipay-sdk wechatpay-node-v3`
- [ ] 1.2 安装二维码渲染：`pnpm add qrcode.react`
- [ ] 1.3 确认 `@tanstack/react-query` 已存在（无需重装）

## 2. 数据层（Supabase）

- [ ] 2.1 创建迁移文件 `supabase/migrations/YYYYMMDD_add_subscription_tables.sql`，包含：
  - `subscription_plans` 表 + RLS（SELECT all authed，INSERT/UPDATE/DELETE service_role）
  - `user_subscriptions` 表 + RLS（SELECT/UPDATE own rows，INSERT service_role）
  - `payments` 表 + RLS（SELECT own rows，INSERT/UPDATE service_role）
  - 种子数据：Free 计划（price_monthly=0, price_yearly=0）+ Pro 计划（price_monthly=3900, price_yearly=29900，价格为分）
- [ ] 2.2 在开发 Supabase 执行迁移：`supabase db push` 或在 Dashboard SQL Editor 执行
- [ ] 2.3 验证：在 Supabase Dashboard 查看三张表结构和 RLS 策略正确

## 3. TypeScript 类型 + 服务层

- [ ] 3.1 创建 `src/features/subscription/types.ts`（从 thefoolai `subscription.types.ts` 裁剪，移除业务特定字段，保留核心类型）
- [ ] 3.2 创建 `src/features/subscription/service.ts`（4 个函数：`getActiveSubscriptionPlans`, `getSubscriptionPlanByCode`, `getUserActiveSubscription`, `getUserSubscriptionHistory`）
- [ ] 3.3 创建 `src/features/subscription/payment-service.ts`（3 个函数：`createPaymentRecord`, `getPaymentByOrderNo`, `getUserPayments`）
- [ ] 3.4 创建 `src/features/subscription/payment-helpers.ts`（`generateOrderNumber` 格式 `WN{timestamp}{4位随机}`）
- [ ] 3.5 创建 `src/lib/supabase/admin.ts`（`createAdminClient()` 使用 `SUPABASE_SERVICE_ROLE_KEY`，仅服务端使用，加注释警告）

## 4. 支付宝集成（Route Handlers）

- [ ] 4.1 创建 `src/features/subscription/alipay/server.ts`：
  - `getAlipaySDK()`（`process.env.ALIPAY_APP_ID/PRIVATE_KEY/PUBLIC_KEY`，缺失 throw Error）
  - `createAlipayPagePay(params)` — `alipay.pageExecute('alipay.trade.page.pay', 'POST', ...)`
  - `createAlipayWapPay(params)` — `alipay.pageExecute('alipay.trade.wap.pay', 'GET', ...)`
  - `queryAlipayOrder(outTradeNo)` — `alipay.exec('alipay.trade.query', ...)`
  - `verifyAlipayNotify(formData)` — `alipay.checkNotifySign(data)`
- [ ] 4.2 创建 `src/features/subscription/alipay/client.ts`：
  - `initiateAlipayPayment(paymentId, userId)` — POST → formHtml submit 或 redirect
- [ ] 4.3 创建 `src/app/api/payments/alipay/create/route.ts`：
  - POST handler：检查 env → 根据 User-Agent 选 PC/H5 → 调用 alipay server → 返回 JSON
- [ ] 4.4 创建 `src/app/api/payments/alipay/query/route.ts`：
  - POST handler：`queryAlipayOrder` → 返回 `{ status, tradeStatus }`
- [ ] 4.5 创建 `src/app/api/payments/alipay/notify/route.ts`：
  - POST handler：验签 → 幂等检查 → 用 admin client 更新 payments + user_subscriptions → 返回 'success'
- [ ] 4.6 创建 `src/app/api/payments/alipay/return/route.ts`（GET，同步回调）：
  - 读取 URL 参数 `out_trade_no` → redirect 到 `/payment/[paymentId]`

## 5. 微信支付集成（Route Handlers）

- [ ] 5.1 创建 `src/features/subscription/wechat/server.ts`：
  - `getWechatPay()` — 从 env 初始化 `wechatpay-node-v3` 实例
  - `createWechatNativePay(params)` — `/v3/pay/transactions/native` → 返回 `{ code_url }`
  - `createWechatH5Pay(params)` — `/v3/pay/transactions/h5` → 返回 `{ h5_url }`
  - `queryWechatOrder(outTradeNo)` — `/v3/pay/transactions/out-trade-no/{...}` → 返回 trade_state
  - `verifyWechatNotify(headers, rawBody)` — 验证微信回调签名
- [ ] 5.2 创建 `src/features/subscription/wechat/client.ts`：
  - `initiateWechatPayment(paymentId, userId)` → 返回 `{ type: 'qrcode' | 'redirect', codeUrl?, h5Url? }`
- [ ] 5.3 创建 `src/app/api/payments/wechat/create/route.ts`：
  - PC → Native，开发环境移动端也走 Native（D3）
- [ ] 5.4 创建 `src/app/api/payments/wechat/query/route.ts`
- [ ] 5.5 创建 `src/app/api/payments/wechat/notify/route.ts`：
  - 验签 → 解密 resource → 更新 DB → 返回 `{ code: 'SUCCESS' }`

## 6. TanStack Query Hooks

- [ ] 6.1 创建 `src/features/subscription/hooks.ts`，提供：
  - `useSubscriptionPlans()` — `getActiveSubscriptionPlans()`
  - `useSubscriptionPlan(planCode)` — `getSubscriptionPlanByCode()`
  - `useUserSubscription(userId)` — `getUserActiveSubscription()`（staleTime: 2min）
  - `useUserPayments(userId)` — `getUserPayments()`
  - `usePaymentStatus(orderNo, options)` — 轮询 `/api/payments/alipay(wechat)/query`（refetchInterval: 3000）
  - `useCreatePayment()` — useMutation，创建 payment 记录 + 触发支付
  - `useCancelSubscription()` — useMutation，set `cancel_at_period_end = true`

## 7. UI 页面

- [ ] 7.1 创建 `src/app/[locale]/(protected)/pricing/page.tsx`：
  - 月付/年付 Tabs，从 `useSubscriptionPlans()` 读取，当前订阅高亮，点击跳转 checkout
- [ ] 7.2 创建 `src/app/[locale]/(protected)/payment/checkout/page.tsx`：
  - URL params 验证 → 计划摘要 → 支付方式选择（支付宝/微信 RadioGroup）→ 优惠码 Input → 确认支付 Button
- [ ] 7.3 创建 `src/app/[locale]/(protected)/payment/[paymentId]/page.tsx`：
  - paid → 成功卡片；failed → 失败卡片；pending → 微信时显示二维码（`<QRCodeSVG code_url />`）+ 3s 轮询
- [ ] 7.4 创建 `src/app/[locale]/(protected)/settings/subscription/page.tsx`：
  - 订阅状态卡片 + 支付历史列表 + 取消续费按钮（AlertDialog 确认）
- [ ] 7.5 在 settings sidebar 导航中添加"订阅与账单"入口

## 8. 公共组件（移植 + 适配）

- [ ] 8.1 创建 `src/features/subscription/components/upgrade-button.tsx`（`useNavigate` → `useRouter().push`）
- [ ] 8.2 创建 `src/features/subscription/components/pro-badge.tsx`（原样移植）
- [ ] 8.3 创建 `src/features/subscription/components/pro-feature-comparison.tsx`（`useTranslation(react-i18next)` → `useTranslations(next-intl)`）
- [ ] 8.4 创建 `src/features/subscription/components/quota-warning-banner.tsx`（移植 + 适配 next/navigation）
- [ ] 8.5 创建 `src/features/subscription/components/index.ts`（统一导出）

## 9. i18n

- [ ] 9.1 在 `src/i18n/messages/zh.ts` 添加 `pricing.*` / `subscription.*` / `payment.*` keys（中文）
- [ ] 9.2 在 `src/i18n/messages/en.ts` 添加对应英文 keys

## 10. 配置文件更新

- [ ] 10.1 更新 `templates/web-nextjs/apps/web/.env.local.example`，新增支付宝和微信支付的所有 env（含注释说明获取方式和沙箱配置）

## 11. 验收

- [ ] 11.1 `pnpm check-types`（`apps/web`）无错误
- [ ] 11.2 `pnpm build`（`apps/web`）成功
- [ ] 11.3 支付宝沙箱端到端：Free 用户 → /pricing → /payment/checkout → 支付宝沙箱收银台 → 支付 → notify 回调 → DB 更新为 paid + active → /payment/[id] 显示成功
- [ ] 11.4 微信 Native：创建订单后页面显示二维码（即使无法实际扫码，确认 code_url 格式正确）
- [ ] 11.5 `/settings/subscription` 显示 Pro 订阅信息和支付历史
- [ ] 11.6 `UpgradeButton` 在 dashboard 某处放置，点击跳转 /pricing 无错误
- [ ] 11.7 `openspec validate add-payments-to-web-nextjs` 通过
- [ ] 11.8 PR merge main，删除分支
