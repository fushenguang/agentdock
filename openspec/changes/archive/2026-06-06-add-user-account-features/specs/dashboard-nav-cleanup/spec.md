## ADDED Requirements

### Requirement: 侧边栏导航清理（app-sidebar）

`src/components/dashboard/app-sidebar.tsx` MUST 移除 demo 内容，重构为通用 web 应用导航结构。

**移除**：

- `navMain` 中：Lifecycle、Analytics、Projects、Team（全部 `#`，无实现页面）
- 整个 `navClouds` 数据与 `NavDocuments` 组件引用（Capture/Proposal/Prompts、Data Library/Reports/Word Assistant 均为 shadcn demo 内容，与模板无关）

**保留并补充真实路由**：

```ts
navMain: [
  { title: 'Dashboard', url: `/${locale}/dashboard`, icon: IconDashboard },
  { title: 'Settings', url: `/${locale}/settings/profile`, icon: IconSettings },
]

navSecondary: [
  { title: 'Help', url: '/help', icon: IconHelp },
  { title: 'Privacy Policy', url: '/privacy', icon: IconShield },
  { title: 'About', url: '/about', icon: IconInfoCircle },
]
```

**nav-user 下拉清理**：

- Account → `/${locale}/settings/profile`（真实链接）
- **移除** Billing（未实现）
- **移除** Notifications（未实现）
- 保留 Log out

#### Scenario: 侧边栏无任何 `url: "#"` 链接

- **WHEN** 渲染 AppSidebar
- **THEN** 所有导航项指向真实路由或外部链接，无 `#` 占位

#### Scenario: Settings 链接指向 profile 页

- **WHEN** 点击侧边栏 Settings
- **THEN** 跳转到 `/${locale}/settings/profile`

### Requirement: 通用静态页面（help / privacy / about）

以下路由 MUST 存在，内容为占位，可被搜索引擎索引（Server Component，无 `noindex`）：

- `src/app/[locale]/help/page.tsx`：帮助页，标题 + 占位段落（"我们正在整理帮助文档，请稍后查看。"）
- `src/app/[locale]/privacy/page.tsx`：隐私政策页，标题 + 占位段落
- `src/app/[locale]/about/page.tsx`：关于我们页，标题 + 占位段落

三个页面均为**公开路由**（不在 `(protected)` 下），无需 session 验证。

#### Scenario: 未登录用户可访问 /help、/privacy、/about

- **WHEN** 未登录用户访问 `/en/help`
- **THEN** 页面正常渲染，不触发 protected layout 的 session 检查

#### Scenario: 三个页面出现在 llms.txt（如 apps/docs 接入）

- **WHEN** 模板配置了 docs 站并运行 docs:sync
- **THEN** help/privacy/about 页不影响 docs 站（它们是 apps/web 的页面，与 apps/docs 隔离）
