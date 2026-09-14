## Context

`web-tanstackstart` 的 `pnpm-workspace.yaml` 对 standalone 项目是必要配置：pnpm 11/12 在这里读取 `allowBuilds`，`packages: []` 表达它是单包项目。但同一个文件也是 pnpm 命令的 workspace 根标记。把它复制到父 workspace 的成员目录后，父级安装和子目录安装会拥有不同的 lockfile、包管理器版本和安装策略。

`web-nextjs` 是完整 monorepo 模板，不应通过删除其 workspace 文件来嵌入父级 workspace。因此能力必须由模板显式声明，而不是由 CLI 对所有模板猜测。

## Goals / Non-Goals

**Goals:**

- 让 `web-tanstackstart` 可作为已有 pnpm workspace 的普通成员生成。
- 保持 standalone 生成行为 byte-for-byte 的语义不变。
- 所有不兼容在写文件前失败，并给出可执行修复路径。
- 根配置默认只读，所有需要的变更以机器可读结构返回。
- 让生成项目对后续 AI coding agent 清楚表达安装边界。

**Non-Goals:**

- 不自动改写根 `pnpm-workspace.yaml`、`package.json` 或 lockfile。
- 不支持 npm/yarn/bun workspace。
- 不把 `web-nextjs` 或其他 monorepo 模板转换为父 workspace 成员。
- 不在本变更中迁移 `domain-packages` 的真实项目配置。
- 不实现任意 YAML 编辑或 pnpm 全量配置解析器。

## Decisions

### D1: placement mode 使用 auto + explicit override

CLI 接受 `--mode auto|workspace|standalone`，默认 `auto`。`auto` 在目标路径匹配最近父 workspace 的正 glob 且未被负 glob 排除时选择 `workspace`，否则选择 `standalone`。显式模式用于 CI 和 Agent 固定行为；显式冲突在写文件前失败。

### D2: workspace 成员资格由最近根和 packages globs 决定

目标目录可以尚不存在，因此从最近存在的父目录向上寻找最近的 `pnpm-workspace.yaml`。本实现只解析 `packages` 顶层列表和常见 pnpm glob 语义：`*`、`**` 与 `!` 负模式。无法解析时返回 `WORKSPACE_CONFIG_INVALID`，不猜测。

位于 workspace 根下但与 globs 不匹配的目录默认仍是 standalone。若用户强制 standalone 且目标被匹配，CLI 拒绝生成，因为子级 workspace 文件不能让父 workspace 自动排除它。

### D3: workspace-member 能力由模板显式 opt-in

registry 增加可选 `workspaceMember` 元数据，包含根 `allowBuilds` 需求。第一版只允许 `packageManager` 为 pnpm 的单包模板开启。`web-nextjs` 不开启；强制 workspace mode 时返回 `WORKSPACE_MODE_UNSUPPORTED`。

### D4: workspace mode 只改变模板的边界所有权

workspace mode 跳过模板根部的：

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `.npmrc`（源码与 npm 发布产物 `_npmrc` 两种形态）

生成包的 `packageManager` 和 `engines.pnpm` 被移除；`engines.node`、scripts、依赖和模板业务文件保持不变。standalone mode 保留全部原文件与字段。

### D5: 写入前执行根兼容性检查

workspace mode 读取根 `package.json#packageManager` 作为唯一 pnpm 版本真源，并使用模板 `engines.pnpm` 校验；没有范围时回退到模板精确版本。当前 Node 版本也必须满足模板 `engines.node`。

失败返回：

- `WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE`
- `WORKSPACE_NODE_INCOMPATIBLE`

错误消息包含当前值、要求值和至少一个可执行修复方向。

### D6: 根配置保持只读

CLI 解析根 `pnpm-workspace.yaml#allowBuilds`，但只返回 `requiredRootChanges`：

```json
{
  "file": "pnpm-workspace.yaml",
  "operation": "mergeAllowBuilds",
  "entries": { "better-sqlite3": false },
  "conflicts": []
}
```

缺少的键进入 `entries`，值可以是模板要求的 `true` 或 `false`；已经与期望值一致的键不重复报告；不同值或非布尔值进入 `conflicts`，不得静默覆盖。第一版不提供自动写入，避免破坏 YAML 注释、排序和用户策略。

### D7: 生成项目携带明确 Agent 上下文

workspace mode 生成 `.agentdock/workspace.json`，记录根目录、lockfile owner、包管理器和推荐命令。同时在 `AGENTS.md` 顶部注入短提示，明确：

- 不要在该成员目录运行独立安装。
- 依赖安装从 workspace 根执行。
- 验证推荐 `pnpm --filter <package> check`。

standalone mode 不生成该文件，也不修改模板 `AGENTS.md`。

### D8: Agent JSON 结果表达实际状态

成功结果的 mode 字段为 `standalone` 或 `workspace`。workspace 结果额外包含 `workspaceRoot`、`lockfileOwner`、`requiredRootChanges` 与 `rootConfigConflicts`。human adapter 展示相同信息及根命令。

## Risks / Trade-offs

- [最小 YAML 解析器不覆盖所有合法写法] → 只接受本变更需要的顶层块列表/映射；无法解析时 fail closed 并返回明确错误。
- [模板元数据与 standalone workspace 文件可能漂移] → 增加测试比较 `web-tanstackstart` 的 `allowBuilds` 元数据与模板 `pnpm-workspace.yaml`。
- [根 allowBuilds 需要人工处理] → 这是刻意的权限边界；返回结构化变更和具体命令，而不是静默升级安装策略。
- [显式 standalone 放在匹配目录内仍然会被父 workspace 识别] → 直接拒绝，不生成不可验证的伪 standalone 项目。

## Migration Plan

1. 扩展 registry 与模板元数据，不改变现有生成结果。
2. 实现 placement resolver、兼容性检查和 workspace 渲染。
3. 接入 adapters 与 JSON/human 输出。
4. 添加回归测试和文档。
5. 在 `domain-packages` 执行一次 workspace-mode 实测，验证 agent 输出、文件边界和根识别；不迁移真实项目配置。

回滚可恢复旧模板复制逻辑；生成项目是独立副本，不涉及数据迁移。
