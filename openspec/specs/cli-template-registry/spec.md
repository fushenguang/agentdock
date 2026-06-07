## ADDED Requirements

### Requirement: registry.json schema

CLI 包 MUST 在构建后包含 `src/registry.json` 文件，结构如下：

```json
{
  "$schema": "...",
  "generatedAt": "<ISO 8601 timestamp>",
  "templates": [
    {
      "id": "web-nextjs",
      "name": "@agentdock/template-web-nextjs",
      "description": "Next.js 16 + React 19 + Tailwind CSS + TypeScript starter",
      "version": "0.1.0",
      "minCliVersion": "0.1.0",
      "packageManager": "pnpm",
      "resolvedDependencies": {
        "@agentdock/eslint-config": "^0.1.0",
        "@agentdock/tsconfig": "^0.1.0"
      }
    }
  ]
}
```

字段约束：

- `id`: kebab-case，与 `templates/` 下目录名一致
- `minCliVersion`: 取自模板 `package.json` 的 `agentdock.minCliVersion` 字段；若不存在则默认为 `"0.1.0"`
- `resolvedDependencies`: 仅包含原 `package.json` 中值为 `workspace:*` 的依赖，已解析为发布 semver 版本

#### Scenario: registry.json 在构建后存在

- **WHEN** 执行 `pnpm build`（turbo 任务图完整运行）
- **THEN** `packages/cli/src/registry.json` 存在，包含至少一个模板条目，`generatedAt` 为有效 ISO 时间戳

#### Scenario: registry.json 包含正确的解析依赖

- **WHEN** `templates/web-nextjs/package.json` 中含 `@agentdock/eslint-config: workspace:*`
- **THEN** registry.json 中该模板的 `resolvedDependencies["@agentdock/eslint-config"]` 为 `"^<实际版本>"`（如 `"^0.1.0"`），不含 `workspace:*` 字符串

---

### Requirement: generate-registry Turbo task

Monorepo 根 `turbo.json` MUST 包含 `generate-registry` 任务，且 `cli` 包的 `build` 任务 MUST 依赖此任务（通过 `dependsOn`）。

任务配置约束：

- `inputs`：`["templates/*/package.json", "packages/*/package.json"]`（任一变更触发重跑）
- `outputs`：`["packages/cli/src/registry.json"]`（Turbo 缓存目标）
- 任务脚本：`packages/cli` 包的 `package.json` 中 `scripts.generate-registry` 指向生成脚本

#### Scenario: 模板 package.json 变更触发重新生成

- **WHEN** 修改 `templates/web-nextjs/package.json` 中任意字段后执行 `pnpm build`
- **THEN** Turbo 检测到 `inputs` 变更，重新运行 `generate-registry`，生成新的 `registry.json`，`generatedAt` 时间戳更新

#### Scenario: 无变更时使用 Turbo 缓存

- **WHEN** 连续两次执行 `pnpm build` 且 `templates/` 与 `packages/` 无变更
- **THEN** 第二次 `generate-registry` 使用 Turbo 缓存，不重新运行脚本

#### Scenario: cli#build 在 registry.json 生成后才执行

- **WHEN** 在 clean 状态下执行 `pnpm build`
- **THEN** Turbo 任务图保证 `generate-registry` 完成后才运行 `packages/cli` 的 `build` 任务

---

### Requirement: workspace:\* resolution at build time

`generate-registry` 脚本 MUST 将模板 `package.json` 中所有值为 `workspace:*` 的依赖解析为对应 packages 目录下包的实际发布版本。

解析规则：

1. 读取目标依赖的包名（如 `@agentdock/eslint-config`）
2. 在 `packages/` 下查找对应目录（通过 `name` 字段匹配）
3. 读取其 `package.json` 的 `version` 字段
4. 在 registry.json 的 `resolvedDependencies` 中记录为 `"^<version>"`
5. 若对应包不存在或 `version` 缺失，构建 MUST 失败并输出明确错误

#### Scenario: workspace:\* 成功解析

- **WHEN** `templates/web-nextjs/package.json` 含 `"@agentdock/tsconfig": "workspace:*"`，`packages/tsconfig/package.json` 中 `version` 为 `"0.1.0"`
- **THEN** registry.json 中记录 `"@agentdock/tsconfig": "^0.1.0"`

#### Scenario: 依赖包版本缺失时构建失败

- **WHEN** 某 `workspace:*` 依赖的目标包 `package.json` 缺少 `version` 字段
- **THEN** `generate-registry` 脚本以非零 exit code 退出，输出明确错误信息，Turbo 任务失败

---

### Requirement: Version compatibility contract

模板 `package.json` 的 `agentdock` 自定义字段 MUST 支持 `minCliVersion` 声明，CLI MUST 在执行任何脚手架操作前校验版本兼容性。

```json
// templates/web-nextjs/package.json
{
  "agentdock": {
    "minCliVersion": "0.1.0"
  }
}
```

#### Scenario: CLI 版本满足要求时正常执行

- **WHEN** CLI 版本为 `0.1.0`，模板 `minCliVersion` 为 `0.1.0`
- **THEN** 版本检查通过，脚手架操作继续执行

#### Scenario: CLI 版本低于要求时返回版本错误

- **WHEN** CLI 版本为 `0.1.0`，模板 `minCliVersion` 为 `0.2.0`
- **THEN** 操作终止，返回 `CLI_VERSION_OUTDATED` 错误码，不创建任何文件
