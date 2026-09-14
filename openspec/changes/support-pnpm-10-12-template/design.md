## Context

pnpm 10、11、12 之间存在真实破坏性变化：

- pnpm 11 要求 Node 22.13+，移除 `onlyBuiltDependencies`，引入 `allowBuilds`。
- pnpm 11/12 将多数设置从 `.npmrc` 移到 `pnpm-workspace.yaml`。
- pnpm 12 对带精确 `packageManager` pin 的项目执行更严格的未知设置检查。
- pnpm 12 的 lockfile 可能包含 `packageManagerDependencies`，并生成旧 pnpm 无法解析的多 document 文件。

但应用的 Node、Vite、TanStack 和原生依赖与 pnpm 12 没有硬耦合。版本兼容应通过共享配置、最低版本生成的 lockfile 和矩阵验证实现。

## Goals / Non-Goals

**Goals:**

- 开发者可以继续使用现代 pnpm 10.x，无需先升级到 12。
- pnpm 11/12 仍得到明确的构建授权和严格 engine 校验。
- 所有支持的 pnpm 版本共享一个不会反复漂移的 lockfile。
- CLI 继续保证模板只使用 pnpm。
- 文档明确推荐版本与最低版本的区别。

**Non-Goals:**

- 支持 pnpm 10.0–10.33 的 legacy `pnpm.onlyBuiltDependencies`。
- 改变 Node 或框架版本基线。
- 自动安装或切换 pnpm。

## Decisions

### D1: 支持范围为 pnpm >=10.34.5 <13

10.34.5 是经过验证的最新 10.x，能够读取 workspace 中的 engine 配置，并在该模板安装中完成原生依赖构建。若使用更早的 10.x，则会出现 build approval 真源不统一，因此不纳入支持范围。

推荐版本仍为 12.4.1，但只记录在文档和 CI，不写入 `packageManager` 形成强制切换。

### D2: 不保留精确 packageManager pin

精确 pin 会触发 pnpm 自动版本切换。当前 macOS 环境中 pnpm 10 切换到 12.4.1 会出现 `ENOEXEC`，Corepack 0.18.0 也无法定位 pnpm 12 的入口。移除 pin 后，开发者使用自己的受支持 pnpm；lockfile 和 CI 负责依赖版本一致性。

### D3: workspace 配置是唯一安装策略真源

standalone 模板的 `pnpm-workspace.yaml` 保存：

```yaml
packages: []
engineStrict: true
allowBuilds: {}
```

pnpm 10.34.5、11、12 均可读取 engine 设置；11/12 读取 `allowBuilds`。pnpm 10.34.5 在模板安装中会按其兼容行为执行构建脚本。因为没有精确 `packageManager` pin，也不需要 `managePackageManagerVersions`。模板不再需要 `.npmrc`。

`better-sqlite3@13` 自带平台 prebuild，因此模板把它显式设为 `false`，阻止 pnpm 在缺少本地 `node-gyp`/编译工具链时回退到源码构建。macOS 本机用 pnpm 10.34.5 初始化后已验证 SQLite binding 可正常加载。

### D4: lockfile 由最低支持版本生成

使用 pnpm 10.34.5 生成单 document、`lockfileVersion: '9.0'` 的 lockfile。pnpm 11.27.0 和 12.4.1 必须能执行 `--frozen-lockfile` 且不产生 diff。

CI 中至少一个最低版本 frozen install 门会阻止 pnpm 12 将该 lockfile 重写成仅 12 可消费的格式。

### D5: CLI 强制包管理器与版本 pin 解耦

registry 新增显式 `packageManagerEnforced` 元数据。`web-tanstackstart` 在移除 `packageManager` 后仍声明 `enforced: true`，因此 npm/yarn/bun 仍会在写文件前被拒绝。

workspace mode 的根 pnpm 校验继续读取模板 `engines.pnpm`，因此根 workspace 使用 10.34.5、11 或 12 都可生成成员。

### D6: CI 使用三个代表版本矩阵

独立模板 workflow 使用：

- pnpm 10.34.5：最低支持版本和 lockfile 格式守卫。
- pnpm 11.27.0：验证 11.x 迁移面。
- pnpm 12.4.1：推荐版本和最高支持基线。

三个 job 使用同一 lockfile、Node 24 和 `--frozen-lockfile`。

## Risks / Trade-offs

- [pnpm 11/12 的安装策略默认值不同] → 使用同一 `allowBuilds` 和 lockfile，并在矩阵中执行完整 check。
- [pnpm 10.34.5 不读取 `allowBuilds`] → 其实际安装已验证会执行所需构建；最低版本由 CI 持续保护。
- [不同 pnpm 大版本可能重建 node_modules] → 接受一次性重装成本；项目依赖和 lockfile 不变。
- [未来 pnpm 13 行为变化] → `engines.pnpm` 上限保持 `<13`，升级另立变更。

## Migration Plan

1. 修改模板 package/workspace 配置并移除 `.npmrc`。
2. 用 pnpm 10.34.5 重新生成 lockfile。
3. 更新 CLI registry 元数据和测试。
4. 更新 workflow、文档和 changeset。
5. 跑 10.34.5、11.27.0、12.4.1 安装与模板 check，再跑平台验收命令。

回滚可恢复精确 pin 和原 lockfile；生成项目不需要数据迁移。
