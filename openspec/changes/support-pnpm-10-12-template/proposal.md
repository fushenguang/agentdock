---
roadmap-id: web-tanstackstart-template
---

## Why

`web-tanstackstart` 当前把 `packageManager: pnpm@12.4.1`、`engines.pnpm: >=12 <13`、自动切换开关和 pnpm 12 lockfile 组合成硬性版本门。开发者若使用稳定的 pnpm 10.x，会在安装前被拒绝，或者触发本机不可靠的 pnpm 自动切换。

实测表明应用依赖图、Vite、TanStack Start、StyleX 与 better-sqlite3 并不要求 pnpm 12。pnpm 版本应由兼容范围、lockfile 和 CI 共同约束，而不是通过精确 pin 强制所有用户升级。

## What Changes

- `web-tanstackstart` 移除精确 `packageManager` pin。
- `engines.pnpm` 改为 `>=10.34.5 <13`，支持 pnpm 10.34.5、11.x 和 12.x。
- `engineStrict` 移入 `pnpm-workspace.yaml`，删除只承载安装策略的 `.npmrc`；不再保留精确 pin 所依赖的自动切换设置。
- 保留 pnpm 11/12 的 `allowBuilds` 真源；pnpm 10.34.5 在相同安装中按其兼容行为执行构建脚本。
- 用 pnpm 10.34.5 重新生成单 document lockfile，并验证其可被 10.34.5、11.27.0 和 12.4.1 frozen install。
- CLI registry 使用独立 `packageManagerEnforced` 元数据，使模板移除 `packageManager` 后仍拒绝 npm/yarn/bun。
- CI 改为 pnpm 10.34.5 / 11.27.0 / 12.4.1 矩阵验证。
- 更新模板、CLI 与平台文档，明确“推荐 12.4.1，最低 10.34.5，不强制升级”。

## Capabilities

### New Capabilities

- `web-tanstackstart-runtime-compatibility`: 定义模板支持的 pnpm 范围、配置真源、lockfile 生成基线和版本间一致性。

### Modified Capabilities

- `cli-template-registry`: 将包管理器强制策略与 `packageManager` 字段是否存在解耦，并暴露模板 pnpm 范围。
- `ci-gates`: 对模板执行 pnpm 10/11/12 兼容矩阵，而不是只验证 pnpm 12。

## Non-goals

- 不要求或承诺兼容 pnpm 9 及更早版本。
- 不降低 Node `>=22.13.0` 要求。
- 不支持 npm、yarn 或 bun。
- 不把平台仓库根升级与模板版本兼容绑定到同一次变更。
- 不引入 pnpm 12 专属 lockfile 设置作为模板运行前提。

## Impact

- 修改 `templates/web-tanstackstart` 的 package/workspace/npmrc 配置、lockfile、测试和 Agent 文档。
- 修改 CLI registry schema、generate-registry、init 测试和兼容性说明。
- 修改 `web-tanstackstart` 独立验证 workflow。
- 修改中英文模板和 CLI 文档。
- 不新增依赖。
