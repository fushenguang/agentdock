## ADDED Requirements

> **实现方式**：零第三方 npm 包，使用 Node.js 内置 `node:crypto` 模块自实现 V3 签名、验签、AES-256-GCM 解密
> **API 文档**：https://pay.weixin.qq.com/doc/global/v3/zh（境外商户版）；境内版 endpoint 前缀为 `https://api.mch.weixin.qq.com`
> **模式**：Native 扫码（PC）+ H5（移动端），**不做 JSAPI**（需要公众号资质）

### Requirement: 微信支付 V3 核心工具层（`src/lib/wechat-pay/`）

> 所有密码学操作均使用 `node:crypto`，不引入任何第三方包。

**`src/lib/wechat-pay/crypto.ts`**（核心密码学工具，实现 LLM 参考官方文档实现以下函数）：

- **`signRequest(params)`**：构造 5 行签名串（`METHOD\nURL\ntimestamp\nnonce\nbody\n`），用商户 PKCS8 私钥做 SHA256withRSA，返回 Base64 签名值。参见 [签名生成](https://pay.weixin.qq.com/doc/global/v3/zh/4012354988.md)
- **`buildAuthorizationHeader(params)`**：拼接 `WECHATPAY2-SHA256-RSA2048 mchid="...",nonce_str="...",timestamp="...",serial_no="...",signature="..."`
- **`verifySignature(params)`**：构造 3 行验签串（`timestamp\nnonce\nbody\n`），用微信平台公钥验 SHA256withRSA 签名（⚠️ 不是商户私钥）。参见 [签名验证](https://pay.weixin.qq.com/doc/global/v3/zh/4012354989.md)
- **`decryptResource(params)`**：AEAD_AES_256_GCM 解密，密文末尾 16 字节为 auth tag，key 为 APIv3 密钥。参见 [证书和回调报文解密](https://pay.weixin.qq.com/doc/global/v3/zh/4012354990.md)
- **`generateNonce()`**：`crypto.randomBytes(16).toString('hex').toUpperCase()`

**`src/lib/wechat-pay/client.ts`**（封装微信支付 HTTP 请求）：

- **`wxpayRequest<T>(params)`**：使用 Node.js 内置 `fetch`（Node ≥18），自动计算 timestamp/nonce/signature，添加 Authorization header，发起 GET/POST 请求，返回解析后的 JSON

**`src/lib/wechat-pay/types.ts`**：

```ts
export interface WechatPayConfig {
  appId: string
  mchId: string
  privateKey: string // PKCS8 PEM 格式商户私钥
  serialNo: string // 商户证书序列号
  apiV3Key: string // 32 字节 APIv3 密钥
  platformPublicKey: string // 微信平台公钥 PEM（从 /v3/certificates 接口下载后解密保存）
  baseUrl: string // 境内: https://api.mch.weixin.qq.com; 境外: https://apihk.mch.weixin.qq.com
  notifyUrl: string
}
```

### Requirement: 服务端微信支付业务层（Route Handlers）

**Route Handlers（新建）**：

```
src/app/api/payments/wechat/
  create/route.ts       — POST 创建支付订单（Native / H5 自动选择）
  query/route.ts        — POST 查询订单状态
  notify/route.ts       — POST 微信支付异步通知（验签 + 解密 + 更新 DB）
```

**业务封装**（`src/features/subscription/wechat/server.ts`，仅服务端 import）：

```ts
function getWechatPayConfig(): WechatPayConfig // 从 process.env 读取，缺失 throw Error
createWechatNativePay(params) // POST /v3/pay/transactions/native → 返回 { code_url }
createWechatH5Pay(params) // POST /v3/pay/transactions/h5 → 返回 { h5_url }
queryWechatOrder(outTradeNo) // GET /v3/pay/transactions/out-trade-no/{...} → 返回 trade_state
verifyAndDecryptNotify(headers, rawBody) // verifySignature + decryptResource → 返回 transaction 对象
```

**PC vs H5 自动判断**（同支付宝策略，根据 User-Agent）：

- 桌面 → Native 扫码，返回 `{ type: 'qrcode', codeUrl: '...' }`
- 移动端 → H5，返回 `{ type: 'redirect', h5Url: '...' }`

**环境变量**（在 `.env.local.example` 中说明）：

```bash
WECHAT_PAY_APP_ID=wx...                           # AppID
WECHAT_PAY_MCH_ID=1234567890                      # 商户号
WECHAT_PAY_API_V3_KEY=your-32-char-apiv3-key      # APIv3 密钥（32字节）
WECHAT_PAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
WECHAT_PAY_SERIAL_NO=your-cert-serial-no          # 商户证书序列号
# 微信平台公钥（从 GET /v3/certificates 接口下载后解密保存，用于验签回调）
WECHAT_PAY_PLATFORM_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
WECHAT_PAY_BASE_URL=https://api.mch.weixin.qq.com # 境外商户改为 https://apihk.mch.weixin.qq.com
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/payments/wechat/notify
```

### Requirement: 客户端调用层（`src/features/subscription/wechat/client.ts`）

```ts
initiateWechatPayment(paymentId: number, userId: string): Promise<WechatPayResult>
// 1. POST /api/payments/wechat/create
// 2. 若 type='qrcode' → 返回 { type: 'qrcode', codeUrl }（供 UI 渲染二维码）
// 3. 若 type='redirect' → window.location.href = h5Url
```

### Requirement: 二维码渲染（客户端组件）

PC Native 支付需要在页面上展示微信支付二维码，使用 `qrcode.react` 渲染 `code_url`（`weixin://wxpay/...`）为 SVG QR code。支付状态页（`/payment/[paymentId]`）检测到微信 Native 时显示二维码 + 每 3 秒轮询状态。

> `qrcode.react` 是唯一允许引入的非内置包（仅用于纯 UI 渲染，无密码学逻辑）。

### Requirement: 异步通知处理

`POST /api/payments/wechat/notify` MUST：

1. 读取原始 body：`const rawBody = await req.text()`（不能用 `req.json()`，保持原始字节顺序用于验签）
2. 读取 `Wechatpay-Timestamp` / `Wechatpay-Nonce` / `Wechatpay-Signature` / `Wechatpay-Serial` headers
3. 调用 `verifySignature()`，用微信平台公钥验签；验签失败返回 `{ code: 'FAIL', message: 'Invalid signature' }`
4. 解析 body JSON，调用 `decryptResource()` 解密 `resource` 字段，获得 `out_trade_no` 和 `trade_state`
5. `trade_state === 'SUCCESS'` → 幂等检查（若已 paid 直接返回 SUCCESS）→ 用 admin client 更新 `payments` + `user_subscriptions`
6. 返回 `{ code: 'SUCCESS', message: '成功' }` JSON（微信要求 HTTP 200 + 此响应体）
7. 整个处理 try/catch，异常返回 `{ code: 'FAIL', message: error.message }`

> ⚠️ 微信 H5 有**域名白名单**限制：`WECHAT_PAY_NOTIFY_URL` 域名必须在微信商户后台配置。本地测试只能用 Native 扫码（扫码不受域名限制）。

#### Scenario: PC 端选择微信支付显示二维码

- **WHEN** 用户在结算页选择微信支付（桌面浏览器）
- **THEN** 页面显示微信支付二维码（`code_url` 渲染为 QR SVG），用户用微信扫码完成支付

#### Scenario: 扫码后支付成功自动跳转

- **WHEN** 用户扫码付款，微信 notify webhook 触发，验签+解密通过
- **THEN** 前端轮询 `/api/payments/wechat/query` 检测到 `paid`，自动跳转成功页

#### Scenario: notify 签名验证失败时拒绝更新

- **WHEN** 收到伪造的 POST /api/payments/wechat/notify（签名无效）
- **THEN** 返回 `{ code: 'FAIL', message: 'Invalid signature' }`，数据库不更新

#### Scenario: 重复 notify 幂等处理

- **WHEN** 微信发送同一笔订单的第二次 notify
- **THEN** 检查 `payments.status` 已为 `paid`，直接返回 `{ code: 'SUCCESS' }`，不重复写库
