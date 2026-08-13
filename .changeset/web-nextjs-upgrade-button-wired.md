---
'@cogito.ai/cli': patch
---

web-nextjs 模板：`UpgradeButton` 接入 dashboard header

`add-payments-to-web-nextjs` 落地时定义了 `UpgradeButton` 组件，但从未在任何页面
引用（`grep UpgradeButton` 除组件自身定义外零命中），验收清单第 11.6 项一直是
未完成状态。现已接入 `src/components/dashboard/site-header.tsx`（header 右上角，
`source="dashboard-header"`），点击跳转 `/pricing`，与既有 client 组件路由模式
一致。`pnpm check-types` + `pnpm build`（apps/web）通过。
