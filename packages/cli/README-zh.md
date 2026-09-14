# AgentDock CLI

**`@cogito.ai/cli`** — 面向人类开发者、CI 流水线与 AI Agent 的项目脚手架工具。

[![npm version](https://img.shields.io/npm/v/@cogito.ai/cli)](https://www.npmjs.com/package/@cogito.ai/cli)

[English →](./README.md)

---

## 快速开始

```bash
# 交互式创建项目（人类开发者）
npx @cogito.ai/cli init

# 无头模式（CI / AI Agent）
npx @cogito.ai/cli init --name my-app --template web-nextjs --pm pnpm --json

# workspace-member 模式（已有 pnpm workspace）
npx @cogito.ai/cli init --name my-app --template web-tanstackstart --dir apps/my-app --mode workspace --json

# 启动 MCP Stdio 服务器（供 AI Agent 调用）
npx @cogito.ai/cli mcp
```

## 安装

```bash
# 直接运行（推荐）
npx @cogito.ai/cli <command>

# 全局安装
npm install -g @cogito.ai/cli
pnpm add -g @cogito.ai/cli
```

---

## 命令说明

### `agentdock init`

从模板创建新项目。自动检测运行环境：

- **TTY 环境** → 交互模式（人类开发者）
- **非 TTY 环境 / `--silent` / `--json`** → 无头模式（Agent/CI）

| Flag         | 类型    | 默认值     | 说明                                          |
| ------------ | ------- | ---------- | --------------------------------------------- |
| `--name`     | string  | 必填       | 项目名称，也是目标目录名                      |
| `--template` | string  | 必填       | 模板 ID，如 `web-nextjs`                      |
| `--pm`       | string  | `pnpm`     | 包管理器：`pnpm` / `npm` / `yarn` / `bun`     |
| `--dir`      | string  | `./<name>` | 目标目录（绝对路径或相对 cwd）                |
| `--mode`     | string  | `auto`     | 放置模式：`auto` / `workspace` / `standalone` |
| `--json`     | boolean | `false`    | 以 NDJSON 格式输出结果                        |
| `--silent`   | boolean | `false`    | 静默模式，抑制所有输出                        |

`--mode auto` 会向上探测最近的 pnpm workspace，并判断目标是否匹配其 `packages` glob。workspace member 不复制 `pnpm-workspace.yaml`、`pnpm-lock.yaml`、`.npmrc`，并移除子包 `packageManager` / `engines.pnpm`。根 `allowBuilds` 变更通过 `requiredRootChanges` 返回，CLI 不会自动修改根配置。

**JSON 成功输出：**

```json
{
  "ok": true,
  "targetDir": "/path/to/my-app",
  "name": "my-app",
  "template": "web-nextjs",
  "mode": "standalone",
  "lockfileOwner": "/path/to/my-app/pnpm-lock.yaml",
  "requiredRootChanges": [],
  "rootConfigConflicts": []
}
```

**JSON 失败输出：**

```json
{
  "ok": false,
  "error": "TARGET_DIR_EXISTS",
  "message": "Directory already exists: /path/to/my-app"
}
```

**错误码：** `MISSING_ARG` · `TEMPLATE_NOT_FOUND` · `TARGET_DIR_EXISTS` · `CLI_VERSION_OUTDATED` · `SCAFFOLD_FAILED` · `INVALID_MODE` · `WORKSPACE_MODE_UNSUPPORTED` · `WORKSPACE_NOT_MATCHED` · `WORKSPACE_STANDALONE_CONFLICT` · `WORKSPACE_CONFIG_INVALID` · `WORKSPACE_PACKAGE_MANAGER_INCOMPATIBLE` · `WORKSPACE_NODE_INCOMPATIBLE`

---

### `agentdock mcp`

启动 MCP Stdio 服务器，将 CLI 能力作为工具接口暴露给 AI Agent。

```bash
agentdock mcp
```

**工具列表：**

| 工具               | 说明                 |
| ------------------ | -------------------- |
| `list_templates`   | 列出所有可用模板     |
| `scaffold_project` | 脚手架项目到目标目录 |

**VS Code Copilot MCP 配置（`.vscode/mcp.json`）：**

```json
{
  "servers": {
    "agentdock": {
      "type": "stdio",
      "command": "npx",
      "args": ["@cogito.ai/cli", "mcp"]
    }
  }
}
```

---

## 可用模板

| 模板 ID      | 说明                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| `web-nextjs` | Next.js 16 + Supabase + next-intl + Tailwind CSS v4 + Vitest + Fumadocs 全栈 monorepo 模板 |

---

## 架构设计

CLI 采用**适配器模式**，三种消费者表面共用同一执行器核心：

```
agentdock init
      │
      ├── 检测到 TTY ──→ Human Adapter（Clack 交互 UI）
      └── 非 TTY / flags ──→ Agent Adapter（JSON 结构化输出）

agentdock mcp ──→ MCP Adapter（MCP Stdio 服务器）

所有适配器共用同一执行器核心（scaffold + registry）
```

**设计理念：**

1. **无头优先** — 执行器核心不依赖 TTY，人类 UI 是套在核心之上的薄壳。
2. **结构化输出即协议** — `--json` 模式输出稳定的机器可解析 NDJSON，而非自然语言。
3. **单一能力，多态投影** — `scaffold_project` 只实现一次，自动投影到 CLI flags、JSON 模式和 MCP 工具三个表面。

---

## 开发与发布

```bash
# 安装依赖
pnpm install

# 重新生成模板注册表
pnpm --filter @cogito.ai/cli generate-registry

# 从源码运行（无需构建）
npx tsx packages/cli/bin/agentdock.ts init

# 运行测试
pnpm --filter @cogito.ai/cli test

# 构建
pnpm --filter @cogito.ai/cli build
```

### 添加新模板

1. 在 `templates/<id>/` 下构建完整的项目结构。
2. 添加 `package.json`，包含 `"agentdock": { "minCliVersion": "x.y.z" }`。
3. 运行 `pnpm --filter @cogito.ai/cli generate-registry`。
4. 发布新版本 CLI — 模板打包在 npm 包内，修改模板需要同步发布新版本。

需要支持嵌入 pnpm workspace 的单包模板可在 `agentdock.workspaceMember.rootAllowBuilds` 中声明根构建授权。monorepo 模板应保持 standalone-only。

不以精确 `packageManager` pin 约束、但需要限定 pnpm 范围的模板，可设置 `agentdock.packageManagerEnforced: true` 并声明 `engines.pnpm`。这样 init 仍会拒绝 npm/yarn/bun，同时避免自动版本切换。

### 发布流程

```bash
pnpm changeset          # 描述本次变更
pnpm changeset version  # 更新版本号 + CHANGELOG
pnpm --filter @cogito.ai/cli build
pnpm --filter @cogito.ai/cli publish
```

---

## License

MIT
