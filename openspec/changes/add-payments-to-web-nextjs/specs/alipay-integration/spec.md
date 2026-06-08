## ADDED Requirements

> **移植来源**：thefoolai `src/features/subscription/services/alipay-server.ts` + `alipay-service.ts`
> **SDK**：`alipay-sdk@^4.14.0`（NPM 官方包）
> **主要改动**：`createServerFn` → Next.js Route Handler；`import.meta.env` → `process.env`

### Requirement: 服务端签名层（Route Handlers）

支付宝私钥操作 MUST 在 Next.js 服务端（Route Handlers）完成，客户端不得接触任何私钥。

**Route Handlers（新建）**：

```
src/app/api/payments/alipay/
  create/route.ts       — POST 创建支付订单（page pay / wap pay 自动选择）
  query/route.ts        — POST 查询订单状态
  notify/route.ts       — POST 支付宝异步通知（webhook，验签后更新 DB）
  return/route.ts       — GET 支付宝同步回调（redirect 到支付状态页）
```

**SDK 封装**（`src/features/subscription/alipay/server.ts`，服务端专用）：

```ts
function getAlipaySDK(): AlipaySdk // 从 process.env 读取凭证，缺失时 throw
createAlipayPagePay(params) // alipay.trade.page.pay → 返回 formHtml
createAlipayWapPay(params) // alipay.trade.wap.pay → 返回 redirectUrl
queryAlipayOrder(outTradeNo) // alipay.trade.query → 返回 tradeStatus
verifyAlipayNotify(formData) // alipay.checkNotifySign → boolean
```

**PC vs H5 自动判断**（在 `/api/payments/alipay/create/route.ts` 中）：

```ts
// 根据 User-Agent 自动选择
const isMobile = /Mobile|Android|iPhone/i.test(userAgent)
// isMobile → wap pay（返回 redirect URL）
// desktop → page pay（返回 formHtml 自动提交）
```

**环境变量**（在 `.env.local.example` 中说明）：

```bash
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
# 沙箱环境取消注释:
# ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payments/alipay/notify
```

### Requirement: 客户端支付服务（`src/features/subscription/alipay/client.ts`）

客户端调用层 MUST 提供：

```ts
initiateAlipayPayment(paymentId, userId): Promise<void>
// 1. POST /api/payments/alipay/create
// 2. 若返回 formHtml → 注入 DOM 并 form.submit()（PC 跳支付宝）
// 3. 若返回 redirectUrl → window.location.href = redirectUrl（H5 跳支付宝）
```

### Requirement: 异步通知处理（notify webhook）

`POST /api/payments/alipay/notify` MUST：

1. 用 `alipay.checkNotifySign(formData)` 验签，失败返回 `'fail'`（字符串）
2. 验签成功后用 **service_role Supabase client** 更新：`payments.status = 'paid'`，`payments.provider_trade_no = out_trade_no`，`payments.paid_at = NOW()`
3. 查找该订单的 `subscription_id`，将 `user_subscriptions.status` 更新为 `'active'`，延长 `current_period_end`
4. 返回 `'success'`（字符串，支付宝要求纯文本响应）
5. 整个处理用 try/catch，任何异常返回 `'fail'` 并 `console.error`

> ⚠️ 本地开发：notify 需要公网 URL，使用 `cloudflared tunnel` 或 `ngrok`。`.env.local.example` 中注释说明。

#### Scenario: PC 端点击"支付宝支付"

- **WHEN** 用户在结算页选择支付宝并确认，设备为桌面浏览器
- **THEN** 页面自动提交支付宝表单，跳转到 `openapi.alipay.com` 的支付宝收银台

#### Scenario: 移动端 H5 支付

- **WHEN** 用户在手机浏览器选择支付宝，点击确认
- **THEN** 页面跳转到支付宝 H5 收银台（`tradepay.alipay.com`），支付完成后 returnUrl 回到支付状态页

#### Scenario: 支付成功后订阅自动激活

- **WHEN** 支付宝 notify webhook 触发，验签通过，`trade_status=TRADE_SUCCESS`
- **THEN** `payments.status` 变为 `paid`，对应 `user_subscriptions.status` 变为 `active`，用户再次进入 dashboard 可看到 Pro 标识

#### Scenario: 重复 notify 幂等处理

- **WHEN** 支付宝发送同一笔订单的多次 notify
- **THEN** 第二次更新检查 `payments.status` 已为 `paid` 则直接返回 `'success'`，不重复更新
