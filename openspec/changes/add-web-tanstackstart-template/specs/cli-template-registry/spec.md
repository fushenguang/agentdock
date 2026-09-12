## MODIFIED Requirements

### Requirement: registry.json schema

CLI 包 MUST 在构建后包含 `src/registry.json` 文件，结构中每个模板 MUST 至少包含 `id`、`name`、`description`、`minCliVersion`、`source`、`resolvedDependencies`、`packageManager`、`packageManagerEnforced`、`dataLayers`、`defaultDataLayer` 和 `supportsSchema`。

```json
{
  "version": "1",
  "templates": [
    {
      "id": "web-nextjs",
      "name": "@cogito.ai/template-web-nextjs",
      "description": "Next.js 16 starter",
      "minCliVersion": "0.1.0",
      "source": "templates/web-nextjs",
      "packageManager": "pnpm",
      "packageManagerEnforced": false,
      "dataLayers": ["supabase", "drizzle"],
      "defaultDataLayer": "supabase",
      "supportsSchema": true,
      "resolvedDependencies": {}
    }
  ]
}
```

字段约束：

- `id`: kebab-case，与 `templates/` 下目录名一致
- `minCliVersion`: 取自模板 `package.json` 的 `agentdock.minCliVersion` 字段；若不存在则默认为 `"0.1.0"`
- `packageManager`: 取自模板 `package.json.packageManager` 的包管理器名；未声明时默认为 `"pnpm"`
- `packageManagerEnforced`: 模板显式声明 `package.json.packageManager` 时为 `true`，否则为 `false`
- `dataLayers`: 取自模板 `package.json.agentdock.dataLayers`；未声明时使用兼容默认值 `["supabase", "drizzle"]`
- `defaultDataLayer`: MUST 存在于 `dataLayers` 中；未声明时取数组首项
- `supportsSchema`: 取自模板 `package.json.agentdock.supportsSchema`；未声明时为 `true`
- `resolvedDependencies`: 仅包含原 `package.json` 中值为 `workspace:*` 的依赖，已解析为发布 semver 版本

#### Scenario: registry.json 在构建后存在

- **WHEN** 执行 `pnpm build`（turbo 任务图完整运行）
- **THEN** `packages/cli/src/registry.json` 存在，包含至少一个模板条目和完整模板能力字段

#### Scenario: registry.json 包含正确的解析依赖

- **WHEN** `templates/web-nextjs/package.json` 中含 `@cogito.ai/eslint-config: workspace:*`
- **THEN** registry.json 中该模板的 `resolvedDependencies["@cogito.ai/eslint-config"]` 为 `"^<实际版本>"`，不含 `workspace:*` 字符串

#### Scenario: web-tanstackstart 暴露模板感知数据层

- **WHEN** 构建 registry 并读取 `web-tanstackstart` 条目
- **THEN** `dataLayers` 为 `["sqlite", "supabase"]`，`defaultDataLayer` 为 `"sqlite"`，`supportsSchema` 为 `false`

## ADDED Requirements

### Requirement: 模板声明的 packageManager 优先

CLI 脚手架 MUST 保留模板显式声明的 `packageManager`。只有模板未声明该字段时，CLI 才 MAY 写入执行环境检测到的 pnpm 版本。

#### Scenario: pnpm 12 模板不被本机 pnpm 9 覆盖

- **WHEN** 模板声明 `packageManager: "pnpm@12.4.1"`，执行 CLI 的环境使用 pnpm 9
- **THEN** 生成项目的 `packageManager` 仍为 `"pnpm@12.4.1"`

#### Scenario: 强制包管理器模板拒绝冲突选项

- **WHEN** `web-tanstackstart` 声明强制 pnpm，而调用者传入 npm
- **THEN** CLI 返回 `INVALID_PACKAGE_MANAGER`，不创建目标目录

#### Scenario: 省略 dataLayer 时使用模板默认值

- **WHEN** 调用者未传 `dataLayer` 且模板默认值为 `sqlite`
- **THEN** 脚手架使用 `sqlite` 替换 `{{DATA_LAYER}}`，生成文件中不残留占位符

#### Scenario: 未声明 packageManager 的模板保持旧行为

- **WHEN** 模板没有 `packageManager` 字段且执行环境能检测到 pnpm
- **THEN** CLI 将检测到的 pnpm 版本写入生成项目
