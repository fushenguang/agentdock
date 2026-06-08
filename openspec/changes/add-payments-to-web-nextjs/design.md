## Context

移植来源：thefoolai（TanStack Start + TanStack Router），目标：web-nextjs 模板（Next.js 16 App Router）。

支付宝部分已在生产运行（`alipay-sdk@^4.14.0`），移植成本低。微信 Native 从零实现（`wechatpay-node-v3`）。UI 组件技术栈几乎相同（shadcn/ui + Tailwind），路由层替换即可。

分支：`feat/add-payments-to-web-nextjs`

## Goals / Non-Goals

**Goals:** Supabase 数据层（3 表 + RLS）、支付宝 PC+H5、微信 Native+H5、订阅 UI 全套（定价/结算/状态/管理）、公共组件移植

**Non-Goals:** Stripe、微信 JSAPI、优惠券系统、发票、支付分析 dashboard、usage quota 强制限制

## Decisions

### D1. 文件目录结构：按 feature 组织，SDK 逻辑隔离在 `server.ts`

```
src/features/subscription/
  types.ts                   — 所有类型定义
  service.ts                 — 纯数据库操作（无 SDK 依赖）
  payment-service.ts         — 支付记录 CRUD（无 SDK 依赖）
  payment-helpers.ts         — generateOrderNumber 等工具
  alipay/
    server.ts                — alipay-sdk 封装（仅服务端 import）
    client.ts                — 客户端调用 Route Handler 的函数
  wechat/
    server.ts                — wechatpay-node-v3 封装（仅服务端 import）
    client.ts                — 客户端调用 Route Handler 的函数
  hooks.ts                   — TanStack Query hooks（客户端）
  components/
    upgrade-button.tsx
    pro-badge.tsx
    pro-feature-comparison.tsx
    quota-warning-banner.tsx
    index.ts
src/app/api/payments/
  alipay/
    create/route.ts
    query/route.ts
    notify/route.ts
    return/route.ts           — 同步回调（GET，redirect 到支付状态页）
  wechat/
    create/route.ts
    query/route.ts
    notify/route.ts
src/app/[locale]/(protected)/
  pricing/page.tsx
  payment/
    checkout/page.tsx
    [paymentId]/page.tsx
  settings/
    subscription/page.tsx
```

### D2. TanStack Query 保留（hooks.ts）

web-nextjs 模板已安装 TanStack Query（`@tanstack/react-query`）。hooks.ts 的 `useQuery` / `useMutation` 模式保留，与 thefoolai 保持一致，只替换内部调用的 service 函数。

### D3. 微信 H5 本地无法测试，提供 Skip 机制

微信 H5 需要域名白名单，本地开发不支持。在 `POST /api/payments/wechat/create` 中：若 `NODE_ENV === 'development'` 且 User-Agent 是移动端，返回 `{ type: 'native', codeUrl: '...', warning: 'H5 disabled in dev' }`，强制走 Native 模式。

### D4. 订单号格式：`WN{timestamp}{4位随机}` 区别于 thefoolai 的 `TF{...}`

`WN` = WebNextjs 缩写，避免与 thefoolai 订单号冲突。在 `payment-helpers.ts` 中定义。

### D5. service_role Supabase client 仅在 Route Handlers 使用

notify webhook 需要绕过 RLS 写入数据库。`src/lib/supabase/admin.ts` 提供 `createAdminClient()` 使用 `SUPABASE_SERVICE_ROLE_KEY`（已在 web-nextjs 模板的 `.env.local.example` 中）。**绝不在客户端组件中使用 admin client。**

### D6. 优惠码：结算页提供输入框，验证失败不阻塞

优惠码验证是可选功能，UI 展示但后端实现为 stub（返回"无效优惠码"）。实现时可扩展，不影响主支付流程。

### D7. 定价页从数据库读取计划，不硬编码

`getActiveSubscriptionPlans()` 返回数据库中 `is_active = true` 的计划。迁移 SQL 提供默认 Free + Pro 两个计划作为种子数据，开发者可在 Supabase 控制台直接修改价格和功能。

### D8. i18n：新增 `pricing.*` / `subscription.*` / `payment.*` 命名空间

next-intl 的 messages 文件（`src/i18n/messages/zh.ts` / `en.ts`）新增对应 key，组件直接使用 `useTranslations('pricing')` 等。

## Migration Plan

1. `git checkout -b feat/add-payments-to-web-nextjs`
2. 安装依赖：`pnpm add alipay-sdk wechatpay-node-v3 qrcode.react`（在 `templates/web-nextjs/apps/web/`）
3. 创建 Supabase 迁移文件 + 在开发 Supabase 执行
4. 创建 `src/features/subscription/types.ts` 和服务层
5. 实现支付宝 Route Handlers（从 thefoolai 移植 + 替换 `createServerFn` 壳）
6. 实现微信 Route Handlers（新实现）
7. 移植 UI 页面（定价 → 结算 → 支付状态 → 设置/订阅）
8. 移植公共组件（4 个）
9. 更新 settings sidebar 导航，新增"订阅与账单"
10. 更新 i18n messages（zh + en）
11. 更新 `.env.local.example`（支付宝 + 微信所有 env）
12. 端到端测试：支付宝沙箱完整流程（创建 → 支付 → notify → 激活）
13. `pnpm check-types` + `pnpm build` 通过
14. `openspec validate add-payments-to-web-nextjs`

## Open Questions

- Q1: `qrcode.react` 还是其他 QR 库？（暂定 `qrcode.react`，shadcn 生态常用）
- Q2: 取消订阅是立即取消还是到期取消？（暂定 `cancel_at_period_end = true`，当前周期内仍有效，到期不续费）
- Q3: 微信 H5 的 `referer` header 要求：需要从页面发起跳转，不能直接在服务端 redirect。实现时确认是否需要前端 `window.location.href` 跳转。
