## Context

- 分支：`fix/template-routing-and-cli-data-layer`
- 执行者：Cline + DeepSeek v4 Pro

涉及文件范围：
1. `templates/web-nextjs/apps/web/src/app/[locale]/(auth)/signup/page.tsx` — Bug 修复
2. `templates/web-nextjs/apps/web/src/components/landing/hero.tsx` — Bug 修复 + env var
3. `templates/web-nextjs/apps/web/.env.example` — 新增 `NEXT_PUBLIC_DOCS_URL`
4. `templates/web-nextjs/supabase/migrations/20250608_add_subscription_tables.sql` — __SCHEMA__ 参数化
5. `packages/cli/src/adapters/human.ts` — 数据层选择交互
6. `packages/cli/src/adapters/agent.ts` — 新增 `--data-layer` / `--schema` 选项
7. `packages/cli/src/commands/init.ts` — CLI args 扩展
8. `packages/cli/src/core/scaffold.ts` — `__SCHEMA__` 替换逻辑

## Goals / Non-Goals

**Goals:**
- 修复 signup 页面双 locale 路由 Bug
- 修复 hero 页面文档链接 Bug，支持环境变量配置文档地址
- SQL 迁移文件 schema 参数化（`__SCHEMA__` 占位符）
- CLI 交互流新增数据层（supabase/drizzle）和 schema 选择步骤
- scaffold 阶段自动替换 SQL 文件内的 `__SCHEMA__` 占位符

**Non-Goals:**
- 不添加 drizzle 的具体脚手架逻辑（只区分选项，drizzle 暂无 SQL 文件）
- 不修改 agent adapter 的 NDJSON 输出格式
- 不改变 scaffold.ts 的文件复制核心逻辑

## Decisions

### D1. Bug 修复：i18n Link 与裸路径

`@/i18n/navigation` 导出的 `Link` 会自动在 href 前拼接当前 locale。使用 `href="/login"` 即可，不需要 `/{locale}/login`。

**受影响文件**：`signup/page.tsx`（两处 `href={`/${locale}/login`}` 需修复）；同时检查其他 auth 页面有无同类问题。

### D2. 文档链接：env var + 原生 `<a>` 标签

文档站是独立服务（不在 web-nextjs Next.js 实例内），不应使用 i18n-aware 的 `Link`。
改用原生 `<a>` 标签 + `NEXT_PUBLIC_DOCS_URL` 环境变量。

```tsx
// hero.tsx 修改后
<a
  href={process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3001/docs'}
  target="_blank"
  rel="noopener noreferrer"
>
  {t('hero.ctaSecondary')}
</a>
```

`.env.example` 新增一行：
```
# 文档站地址（查看文档按钮跳转目标），生产环境替换为实际文档 URL
NEXT_PUBLIC_DOCS_URL=http://localhost:3001/docs
```

### D3. SQL 占位符格式：`__SCHEMA__`

选用双下划线格式，不易与正常 SQL 标识符冲突，且不需要 Handlebars 等额外解析器。

所有本 schema 内的表名均加 `__SCHEMA__.` 前缀：
- `subscription_plans` → `__SCHEMA__.subscription_plans`
- `user_subscriptions` → `__SCHEMA__.user_subscriptions`
- `payments` → `__SCHEMA__.payments`

`auth.users` 保持原样（固定 schema，不受影响）。

外键引用也需更新：
```sql
-- before
plan_id int references subscription_plans(id) on delete restrict,
-- after
plan_id int references __SCHEMA__.subscription_plans(id) on delete restrict,
```

Index 定义：
```sql
-- before
create index if not exists idx_user_subscriptions_user_id on user_subscriptions(user_id);
-- after
create index if not exists idx_user_subscriptions_user_id on __SCHEMA__.user_subscriptions(user_id);
```

种子数据 insert：
```sql
-- before
insert into subscription_plans (...)
-- after
insert into __SCHEMA__.subscription_plans (...)
```

### D4. CLI 人机交互流新增步骤

在「选择模板」之后、「选择包管理器」之前新增：

```
step 1: Project name
step 2: Select template
step 3: Select data layer     ← NEW
step 4: [if supabase] Schema  ← NEW
step 5: Package manager
step 6: Confirm
```

数据层选项：
- `supabase`（提示：recommended）
- `drizzle`（提示：coming soon）

若选 drizzle，schema 步骤跳过，schema 传入 scaffold 为 `undefined`（`scaffoldProject` 内部对 undefined 不做替换）。

### D5. CLI Agent 模式新增参数

```
--data-layer <supabase|drizzle>   数据层选择（可选，不传则 scaffold 不做 schema 替换）
--schema <name>                   Supabase schema 名称，默认 "public"
```

`AgentAdapterOptions` 接口扩展：
```ts
dataLayer?: 'supabase' | 'drizzle'
schema?: string
```

### D6. scaffold.ts schema 替换逻辑

`scaffoldProject` 在 `cpSync` 之后，若 `options.schema` 有值，则：
1. 使用 `readdirSync(dir, { withFileTypes: true })` 递归遍历 `targetDir`
2. 对每个 `.sql` 文件：`readFileSync` → `replace(/__SCHEMA__/g, options.schema)` → `writeFileSync`

若 `options.schema` 为 `undefined` 或空串，跳过替换（文件保留 `__SCHEMA__` 占位符）。

```ts
// scaffold.ts 新增的 ScaffoldOptions 字段
schema?: string  // undefined = 不替换；'public' = 标准 Supabase public schema
```
