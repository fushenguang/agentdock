## 0. Git 分支准备

- [ ] 0. `git checkout main && git pull`
- [ ] 0. `git checkout -b fix/template-routing-and-cli-data-layer`

## 1. Bug 修复：Signup 双 locale 路由

文件：`templates/web-nextjs/apps/web/src/app/[locale]/(auth)/signup/page.tsx`

- [ ] 1. 定位文件内所有 `href={`/${locale}/login`}` 共两处（行 59 和行 144 附近）
- [ ] 1. 将两处均改为 `href="/login"`（`Link` 来自 `@/i18n/navigation`，自动处理 locale，不需要手动拼接）
- [ ] 1. 检查同目录其他 auth 页面（`login/page.tsx`、`forgot-password/page.tsx`、`reset-password/page.tsx`）中有无同类问题（使用 i18n `Link` 但同时手动拼接了 `/{locale}/` 前缀），有则一并修复

## 2. Bug 修复：Hero 文档链接

文件：`templates/web-nextjs/apps/web/src/components/landing/hero.tsx`

- [ ] 2. 定位 `<Link href="/docs">{t('hero.ctaSecondary')}</Link>`（行 29 附近）
- [ ] 2. 将该 `Link` 改为原生 `<a>` 标签，完整代码：
  ```tsx
  <a
    href={process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3001/docs'}
    target="_blank"
    rel="noopener noreferrer"
  >
    {t('hero.ctaSecondary')}
  </a>
  ```
  注意：原 `Link` 可能被包裹在 `<Button>` 等组件内，改为 `<a>` 后保留外层组件结构不变，仅替换内部的 `Link` 节点。同时移除不再需要的 `locale` 变量（如果该文件内仅此处用到了 `locale`）。

## 3. 更新 .env.example

文件：`templates/web-nextjs/apps/web/.env.example`

- [ ] 3. 在文件末尾（现有 `WECHAT_PAY_NOTIFY_URL` 之后）新增：
  ```
  # 文档站地址（查看文档按钮跳转目标），生产环境替换为实际文档 URL
  NEXT_PUBLIC_DOCS_URL=http://localhost:3001/docs
  ```

## 4. SQL 迁移文件 schema 参数化

文件：`templates/web-nextjs/supabase/migrations/20250608_add_subscription_tables.sql`

将文件内所有裸表名替换为带 `__SCHEMA__.` 前缀的形式（全局替换，区分大小写）：

- [ ] 4. `subscription_plans` → `__SCHEMA__.subscription_plans`（包括 `create table if not exists`、`alter table`、`create policy ... on`、`references`、`insert into`、`create index ... on` 所有出现处）
- [ ] 4. `user_subscriptions` → `__SCHEMA__.user_subscriptions`（同上规则）
- [ ] 4. `payments` → `__SCHEMA__.payments`（同上规则）
- [ ] 4. **不替换** `auth.users`（auth schema 固定，不受自定义影响）
- [ ] 4. **不替换** policy 名称字符串内的文字（如 `"Allow authenticated select on subscription_plans"` 中的文字部分，仅改 `ON` 后的表名）
- [ ] 4. **不替换** index 名称标识符（如 `idx_user_subscriptions_user_id` 这类 index 名本身不加前缀，只改 `ON` 后的表名）
- [ ] 4. 验证：执行 `grep -n "subscription_plans\|user_subscriptions\|payments" templates/web-nextjs/supabase/migrations/20250608_add_subscription_tables.sql`，确认所有表操作处均已带 `__SCHEMA__.` 前缀

## 5. CLI 人机交互：新增数据层和 schema 选择

文件：`packages/cli/src/adapters/human.ts`

- [ ] 5. 在「选择模板」(`templateId = await p.select(...)`) 之后、「选择包管理器」之前，新增数据层选择步骤：
  ```ts
  const dataLayer = await p.select({
    message: 'Select a data layer',
    options: [
      { value: 'supabase', label: 'supabase', hint: 'recommended' },
      { value: 'drizzle', label: 'drizzle', hint: 'coming soon' },
    ],
  })

  if (p.isCancel(dataLayer)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  ```
- [ ] 5. 在数据层选择之后，新增 schema 输入步骤（仅当 `dataLayer === 'supabase'` 时执行）：
  ```ts
  let schemaName: string | undefined = undefined
  if (dataLayer === 'supabase') {
    const schemaInput = await p.text({
      message: 'Supabase schema name',
      placeholder: 'public',
      defaultValue: 'public',
      validate(value) {
        const v = (value.trim() || 'public')
        if (!/^[a-z_][a-z0-9_]*$/.test(v)) {
          return 'Schema name must be lowercase letters, numbers, or underscores, starting with a letter or underscore'
        }
        return undefined
      },
    })

    if (p.isCancel(schemaInput)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }

    schemaName = ((schemaInput as string).trim() || 'public')
  }
  ```
- [ ] 5. 将 `schemaName` 传入 `scaffoldProject` 调用（新增 `schema: schemaName` 字段）

## 6. CLI Agent 模式：新增参数

文件：`packages/cli/src/adapters/agent.ts`

- [ ] 6. `AgentAdapterOptions` 接口新增两个可选字段：
  ```ts
  /** Data layer selection: 'supabase' | 'drizzle'. */
  dataLayer?: 'supabase' | 'drizzle'
  /** Supabase schema name. Defaults to 'public' when dataLayer is 'supabase'. */
  schema?: string
  ```
- [ ] 6. `runAgentAdapter` 函数内，从 `opts` 解构出 `dataLayer` 和 `schema`
- [ ] 6. 构建 `scaffoldProject` 调用时传入：
  ```ts
  schema: dataLayer === 'supabase' ? (schema ?? 'public') : undefined,
  ```

## 7. CLI init 命令：新增 CLI args

文件：`packages/cli/src/commands/init.ts`

- [ ] 7. 在 `args` 对象内新增：
  ```ts
  'data-layer': {
    type: 'string',
    description: 'Data layer: supabase (default) | drizzle',
  },
  schema: {
    type: 'string',
    description: 'Supabase schema name (default: public). Only used when data-layer is supabase.',
  },
  ```
- [ ] 7. 在 `run({ args })` 的 agent 模式分支，将 `data-layer` 和 `schema` 传入 `runAgentAdapter`：
  ```ts
  dataLayer: args['data-layer'] as 'supabase' | 'drizzle' | undefined,
  schema: args.schema,
  ```

## 8. scaffold.ts：__SCHEMA__ 替换逻辑

文件：`packages/cli/src/core/scaffold.ts`

- [ ] 8. `ScaffoldOptions` 接口新增可选字段：
  ```ts
  /** Schema name to substitute for __SCHEMA__ in .sql files. Undefined = skip substitution. */
  schema?: string
  ```
- [ ] 8. 在 `scaffoldProject` 函数内，`cpSync` 完成後（项目文件已复制到 `targetDir`），若 `options.schema` 有值，调用辅助函数：
  ```ts
  if (options.schema) {
    replaceSchemaPlaceholder(targetDir, options.schema)
  }
  ```
- [ ] 8. 在同文件内实现 `replaceSchemaPlaceholder(dir: string, schema: string): void` 辅助函数：
  - 使用 `readdirSync(dir, { withFileTypes: true })` 递归遍历 `dir`
  - 对每个 `.sql` 文件：`readFileSync(filePath, 'utf-8')` → `.replace(/__SCHEMA__/g, schema)` → `writeFileSync(filePath, content, 'utf-8')`
  - 对每个子目录：递归调用自身
  - `readFileSync` 和 `writeFileSync` 已在文件顶部 import（当前已有），无需新增 import

## 9. 验收

- [ ] 9. `pnpm check-types`（根目录）无错误
- [ ] 9. `pnpm build`（根目录 turbo）成功
- [ ] 9. 手动验证 Bug 1：在模板项目中，注册页「立即登录」链接 href 为 `/login`（不含 locale 前缀）
- [ ] 9. 手动验证 Bug 2：首页「查看文档」按钮渲染为原生 `<a>` 标签，href 读取自 `NEXT_PUBLIC_DOCS_URL`
- [ ] 9. 验证 SQL 文件：`grep "__SCHEMA__" templates/web-nextjs/supabase/migrations/20250608_add_subscription_tables.sql` 有输出，且无裸表名（验证替换完整）
- [ ] 9. 验证 CLI 人机交互：`pnpm --filter @cogito.ai/cli dev` 后运行 init，确认数据层和 schema 步骤出现；选 supabase + 输入 schema=myapp 后，生成项目的 `.sql` 文件内容无 `__SCHEMA__`，全替换为 `myapp`
- [ ] 9. 验证 CLI agent 模式：`agentdock init --name test --template web-nextjs --data-layer supabase --schema myapp`，检查生成的 sql 文件
- [ ] 9. `openspec validate fix-template-routing-and-cli-data-layer` 通过
- [ ] 9. PR 合并 main，删除分支
