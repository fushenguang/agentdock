## Context

AgentDock 已有一个功能完整的 `web-nextjs` 模板（`templates/web-nextjs`），但缺乏任何面向用户的分发入口。平台需要一个 CLI，兼顾两类消费者：

1. **人类开发者**：期待 Stripe 级别的交互式终端体验（项目名输入、模板选择、包管理器选择），零心智负担。
2. **AI Agent**：期待完全无交互阻塞的无头运行模式，以及基于 MCP 协议的工具接口（长连接、类型化工具参数、结构化响应）。

当前约束：

- pnpm workspace `packages/*` 通配已覆盖 `packages/cli`，无需修改 `pnpm-workspace.yaml`
- 模板 `devDependencies` 中有 `workspace:*` 引用（`@agentdock/eslint-config`、`@agentdock/tsconfig`），这两个包当前为 `private: true`，**必须先发布为公开 npm 包**，`generate-registry` 才能在构建期解析其版本
- MVP 面向 Node ≥18 运行，不要求单文件二进制

## Goals / Non-Goals

**Goals:**

- `packages/cli` 包作为 `@agentdock/cli` 纳入 monorepo
- `agentdock init`：TTY 模式（Clack 交互）和无头模式（`--silent --json`）双轨运行
- `agentdock mcp`：MCP Stdio 长连接服务，暴露 `list_templates`、`scaffold_project`、`get_template_schema` 三个工具
- `generate-registry` Turbo 任务：构建期扫描 `templates/*/package.json`，解析 `workspace:*` 为 semver，写入 `packages/cli/src/registry.json`
- 版本自愈：`CLI_VERSION_OUTDATED` 错误码 + `suggested_action`
- MVP 产物：`bun build` 输出 JS bundle，附 `bin: { agentdock }` 字段发布至 npm
- `@agentdock/eslint-config` 和 `@agentdock/tsconfig` 从 `private: true` 改为公开发布

**Non-Goals:**

- `bun build --compile` 单文件跨平台二进制（Next 阶段）
- GitHub Releases / Homebrew tap 分发渠道（Next 阶段）
- `giget` 远程模板拉取（已预留依赖，Next 阶段启用）
- `--mirror cn` 的实质性加速实现（MVP 预留标志）
- 模板以外的其他脚手架能力（如数据库初始化、CI 配置生成）

## Decisions

### Decision 1：包结构采用三层分离（commands / core / adapters）

```
packages/cli/
├── bin/
│   └── agentdock.ts          # 入口，TTY 检测，路由到模式
├── src/
│   ├── commands/
│   │   ├── init.ts           # agentdock init 命令定义（Citty）
│   │   └── mcp.ts            # agentdock mcp 命令定义（Citty）
│   ├── core/
│   │   ├── scaffold.ts       # 纯函数：文件复制、路径替换
│   │   ├── registry.ts       # 纯函数：读取 registry.json
│   │   └── version.ts        # 纯函数：版本兼容性检查
│   ├── adapters/
│   │   ├── human.ts          # Clack 交互层（调用 core/）
│   │   ├── agent.ts          # JSON stdout 层（调用 core/）
│   │   └── mcp/
│   │       ├── server.ts     # MCP Stdio Server 初始化
│   │       └── tools.ts      # MCP 工具定义（调用 core/）
│   └── registry.json         # 构建期生成，不纳入 git
└── package.json
```

**理由**：`core/` 为无副作用纯函数，可被三条路径（Clack / JSON / MCP）无差别调用。终端 UI 和 MCP 协议仅作为外层"投影"，单元测试只需测试 `core/`。

**备选方案**：在每个命令文件内直接混入 UI 逻辑。  
**排除原因**：MCP 工具如果依赖 Clack 会导致 Stdio 协议流污染；Agent 无头模式如果走 Clack 路径会阻塞等待 TTY 输入。

---

### Decision 2：MVP CLI 产物为 Node.js JS Bundle，非 bun --compile 二进制

```
bun build src/index.ts --outfile dist/index.js --target node
# package.json:
# "bin": { "agentdock": "./dist/index.js" }
# "engines": { "node": ">=18" }
```

**理由**：

- npm 单包发布，无需分平台 `optionalDependencies` 矩阵
- `pnpx agentdock init` / `npx agentdock init` 开箱即用
- Node ≥18 在目标用户群中（开发机）覆盖率接近 100%

**备选方案**：`bun build --compile` 零依赖二进制，通过 `optionalDependencies` 分平台分发（类 esbuild 方式）。  
**排除原因**：需要维护 3-4 个子包（darwin-arm64、darwin-x64、linux-x64、win32-x64），CI 矩阵复杂，推迟至 Next 阶段。

---

### Decision 3：generate-registry 作为独立 Turbo 任务，cli#build 依赖它

```json
// turbo.json 新增：
{
  "generate-registry": {
    "inputs": ["templates/*/package.json", "packages/*/package.json"],
    "outputs": ["packages/cli/src/registry.json"]
  },
  "build": {
    "dependsOn": ["^build", "generate-registry"] // cli 包 build 依赖此任务
  }
}
```

**工作流**：

```
扫描 templates/*/package.json
  → 读取 name, version, description, agentdock.minCliVersion
  → 对每个 devDependency 中 workspace:* 条目
      → 查找 packages/<name>/package.json → 读取 version
      → 替换为 "^<version>"
  → 写入 packages/cli/src/registry.json
```

**理由**：版本在发布时锁定，CLI 运行时零字符串魔法，CI 提前发现版本不一致问题。

**备选方案**：CLI 运行时动态改写生成目录的 package.json。  
**排除原因**：运行时改写需要 CLI 知道 packages/ 内部结构，违反关注点分离；用户生成项目后如果 npm 上版本不存在会报错，问题排查困难。

---

### Decision 4：MCP Server 使用 Stdio 传输，不使用 HTTP

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server({ name: 'agentdock', version: pkg.version })
const transport = new StdioServerTransport()
await server.connect(transport)
```

**理由**：

- AI Agent 宿主（Claude Desktop、Cursor、Copilot）的 MCP 集成优先支持 Stdio
- 无需端口管理和身份认证
- CLI 二进制本身即 MCP 服务，零额外部署

**备选方案**：HTTP SSE 传输。  
**排除原因**：需要端口监听、CORS 处理，且 AI 宿主对 Stdio MCP 的支持更普遍，MVP 不需要远程调用场景。

---

### Decision 5：版本自愈通过 registry.json 的 minCliVersion 字段实现

```json
// registry.json
{
  "templates": [
    {
      "id": "web-nextjs",
      "minCliVersion": "0.1.0"
    }
  ]
}
```

运行时检查：`semver.lt(CLI_VERSION, template.minCliVersion)` → 返回结构化错误：

```json
{
  "ok": false,
  "error": "CLI_VERSION_OUTDATED",
  "context": {
    "cli_version": "0.1.0",
    "min_required": "0.2.0",
    "template": "web-nextjs"
  },
  "suggested_action": "npm install -g @agentdock/cli@latest"
}
```

## Risks / Trade-offs

- **[Risk] `@agentdock/eslint-config` 和 `@agentdock/tsconfig` 还未发布** → generate-registry 构建时无法解析 workspace:\* 的目标 npm 版本。**Mitigation**：将两个包的发布（移除 `private: true`、配置 `publishConfig`）作为 CLI 任务的前置任务，在同一 change 内完成。

- **[Risk] registry.json 不纳入 git，但测试需要它** → CI 需要先跑 `generate-registry` 再跑 CLI 测试。**Mitigation**：在 turbo.json 中声明 `cli#test` 依赖 `generate-registry`，确保 CI 任务图正确。

- **[Risk] Bun 构建产物在 Node.js 运行时的兼容性** → Bun 的某些内置 API（如 `Bun.file`）在 Node 下不可用。**Mitigation**：CLI 代码严格使用 Node.js 标准库，`bun build --target node` 标志确保输出 Node 兼容代码。

- **[Trade-off] 模板内置于 CLI 包** → CLI 包体积随模板数量增长。**当前决策**：MVP 仅一个模板，体积可接受；Next 阶段切换 giget 远程拉取，届时模板资产可从包内移除。

## Open Questions

- `@agentdock/eslint-config` 和 `@agentdock/tsconfig` 的初始发布版本号：维持 `0.0.1` 还是直接 `1.0.0`？（建议 `0.1.0`，语义上表示"公开但 API 未稳定"）
- Changesets 的发版策略：monorepo 中 `cli`、`eslint-config`、`tsconfig` 是否统一版本号？（建议独立版本，各自 CHANGELOG）
