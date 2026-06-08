## ADDED Requirements

> **SDK**：`wechatpay-node-v3`（主流 Node.js 微信支付 V3 API 库）
> **模式**：Native 扫码（PC）+ H5（移动端），**不做 JSAPI**（需要公众号资质）

### Requirement: 服务端微信支付层（Route Handlers）

**Route Handlers（新建）**：

```
src/app/api/payments/wechat/
  create/route.ts       — POST 创建支付订单（Native / H5 自动选择）
  query/route.ts        — POST 查询订单状态
  notify/route.ts       — POST 微信支付异步通知（验签后更新 DB）
```

**SDK 封装**（`src/features/subscription/wechat/server.ts`，服务端专用）：

```ts
function getWechatPay(): WechatPay // 从 process.env 读取凭证
createWechatNativePay(params) // /v3/pay/transactions/native → 返回 code_url（二维码内容）
createWechatH5Pay(params) // /v3/pay/transactions/h5 → 返回 h5_url（唤起微信）
queryWechatOrder(outTradeNo) // /v3/pay/transactions/out-trade-no/{out_trade_no}
verifyWechatNotify(headers, body) // 验证回调签名 → boolean
```

**PC vs H5 自动判断**（同支付宝策略，根据 User-Agent）：

- 桌面 → Native 扫码，返回 `{ type: 'qrcode', codeUrl: '...' }`
- 移动 → H5，返回 `{ type: 'redirect', h5Url: '...' }`

**环境变量**（在 `.env.local.example` 中说明）：

```bash
WECHAT_PAY_APP_ID=wx...               # 公众号/小程序 AppID
WECHAT_PAY_MCH_ID=1234567890          # 商户号
WECHAT_PAY_API_V3_KEY=your-32-char-key  # APIv3 密钥
WECHAT_PAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
WECHAT_PAY_SERIAL_NO=your-cert-serial-no  # 商户证书序列号
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/payments/wechat/notify
```

### Requirement: 客户端支付服务（`src/features/subscription/wechat/client.ts`）

```ts
initiateWechatPayment(paymentId, userId): Promise<WechatPayResult>
// 1. POST /api/payments/wechat/create
// 2. 若 type='qrcode' → 返回 codeUrl（供 UI 渲染二维码）
// 3. 若 type='redirect' → window.location.href = h5Url
```

### Requirement: 二维码渲染（客户端组件）

PC Native 支付需要在页面上展示微信支付二维码。实现方式：

- 使用 `qrcode.react` 包渲染 `code_url` 为 QR code SVG/Canvas
- UI：支付状态页复用（`/payment/[paymentId]`），当检测到微信 Native 时显示二维码 + 轮询状态

### Requirement: 异步通知处理

`POST /api/payments/wechat/notify` MUST：

1. 用 `wechatpay-node-v3` 的 `verifySign` 验证 `Wechatpay-Signature` / `Wechatpay-Timestamp` / `Wechatpay-Nonce` / `Wechatpay-Serial` headers
2. 解密 AES-256-GCM 加密的 resource 字段获取 `out_trade_no` 和 `trade_state`
3. `trade_state === 'SUCCESS'` → 更新 `payments` + `user_subscriptions`（与支付宝 notify 逻辑相同）
4. 返回 `{ code: 'SUCCESS', message: '成功' }` JSON（微信要求）
5. 整个处理 try/catch，异常返回 `{ code: 'FAIL', message: error.message }`

> ⚠️ 微信 H5 有**域名白名单**限制：`WECHAT_PAY_NOTIFY_URL` 域名必须在微信商户后台配置。本地测试只能用 Native 扫码。

#### Scenario: PC 端选择微信支付显示二维码

- **WHEN** 用户在结算页选择微信支付（桌面浏览器）
- **THEN** 页面显示微信支付二维码（`code_url` 渲染），用户用微信扫码完成支付

#### Scenario: 扫码后支付成功自动跳转

- **WHEN** 用户扫码支付完成，微信 notify webhook 触发
- **THEN** 前端轮询 `/api/payments/wechat/query` 检测到 `paid`，自动跳转到成功页

#### Scenario: 微信 notify 签名验证失败时拒绝

- **WHEN** 收到伪造的 POST /api/payments/wechat/notify 请求（签名无效）
- **THEN** 返回 `{ code: 'FAIL', message: 'Invalid signature' }`，不更新数据库
