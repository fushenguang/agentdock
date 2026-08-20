# AgentDock

[English](./README.md)

**AgentDock** 是一个开源的脚手架平台，用于构建"AI 编码代理就绪"（AI coding agent–ready）的项目。它提供一组有明确主张、有治理规则的项目模板，从第一天起就为与 AI 编码代理（GitHub Copilot 等）协作而设计。

它还附带 **`@cogito.ai/cli`**（可执行文件名 `agentdock`）——一个既能脚手架项目、又能校验/发布 Agent Skills 到共享 registry 的 CLI。

---

## AgentDock 是什么

- 一个 **monorepo 平台**，为真实项目提供脚手架模板。
- 一个 **治理层** —— 每个模板都编码了约定（目录契约、架构规则、提交规范），人类与 AI 代理都要遵循。
- 基于 **TypeScript 5.9、turborepo、pnpm、Next.js** 构建，默认数据层为 Supabase。
- **OpenSpec 驱动**：所有平台决策都以 `openspec/` 为唯一真实源。

## AgentDock 不是什么

- 不是一个可直接上线的成品应用 —— 它生成的是你自己项目的起点。
- 不是 AI 模型或 LLM 服务。
- 不是替代你自己架构决策的东西 —— 它提供的是有治理的基线，不是牢笼。
- 不是多工具 AI 框架 —— MVP 阶段只面向 GitHub Copilot + Copilot CLI。

## 仓库结构

```
templates/    # 脚手架模板（如 web-nextjs、skills-registry）
packages/
  cli/        # @cogito.ai/cli —— agentdock CLI（init、auth、skill、mcp）
openspec/     # 规划唯一真实源 —— proposals、specs、design、tasks
apps/
  docs/       # 本平台的文档站点（Fumadocs / Next.js）
```

## 快速开始

### 前置条件

- Node.js ≥ 18
- pnpm 9（`npm install -g pnpm@9`）

### 安装与构建

```bash
pnpm install
pnpm build
```

### 开发

```bash
# 以 watch 模式启动全部 dev server
pnpm dev

# 对整个 workspace 做类型检查
pnpm check-types

# 格式化全部文件
pnpm format
```

### 文档

平台文档位于 `apps/docs`，本地运行：

```bash
pnpm --filter docs dev
# 打开 http://localhost:3000
```

---

## CLI：`@cogito.ai/cli`

该 CLI 以 `@cogito.ai/cli` 发布到 npm，当前版本为 **0.15.0**。无需安装，直接通过 `npx` 运行：

```bash
npx @cogito.ai/cli@latest <command>
```

### 命令全景

`npx @cogito.ai/cli@latest --help`（v0.15.0）的实际输出：

```
AgentDock CLI – scaffold projects for humans and AI agents (agentdock v0.15.0)

USAGE agentdock auth|init|mcp|skill

COMMANDS

   auth    Manage authentication
   init    Scaffold a new AgentDock project
    mcp    Start an MCP (Model Context Protocol) Stdio server exposing AgentDock tools
  skill    Validate and publish Agent Skills

Use agentdock <command> --help for more information about a command.
```

- **`auth login|logout|status`** —— 管理 `skill publish` 用于索引托管 registry 所需的凭据。
- **`init`** —— 从模板脚手架一个新项目（`--name`、`--template`、`--pm`、`--dir`、`--data-layer`、`--schema`，另有面向 agent 模式的 `--silent`/`--json`）。
- **`mcp`** —— 启动一个暴露 AgentDock 工具的 MCP Stdio server。它是给 MCP 兼容客户端启动用的（走 stdio 上的 JSON-RPC，单独运行时不会有任何输出）——不是给你手动交互式运行的命令。
- **`skill validate|publish`** —— 按 Agent Skills 规范校验一个 skill 目录，并将其发布进某个 registry checkout。

每个命令/子命令都支持 `--help`，可查看当前版本下最准确的用法。

### 认证

```bash
npx @cogito.ai/cli@latest auth status
```

`auth login` 会打开浏览器完成设备授权（device authorization）流程，并把凭据存本地；`auth status` 基于这份本地凭据报告当前登录身份；`auth logout` 会删除它们。已登录状态下 `auth status` 的真实输出示例（脱敏后）：

```json
{"event":"status","signedIn":true,"provider":"thefoolai","userId":"<uuid>","displayName":"<name>","savedAt":"<ISO timestamp>"}
```

**已知限制 —— 不要跳过这条**：凭据**有效期为 24 小时**。过期后，`auth status` **依然会显示 `signedIn: true`**——它只读本地凭据文件，并不会向服务端校验 token。问题只会在之后才暴露出来：`skill publish` 的 registry 索引步骤会**静默降级成一条 warning**，而不是报错。如果发布之后发现 skill 没有被索引，先重新 `auth login`，哪怕 `auth status` 看起来一切正常。这已登记为债 `cli-auth-token-expires-silently`。

### 发布 skill

```bash
npx @cogito.ai/cli@latest skill publish <skill-dir> --registry <registry-checkout>
```

这条命令做两件独立的事：

1. **始终执行**：校验该 skill，并在本地 `--registry` git checkout 里写入/更新其 manifest 条目（`skills.json`）。这一步不依赖网络 —— 即使未登录，写入本地 registry checkout 也能成功。这是刻意为可移植性做的设计。
2. **仅在已登录时执行**：把该 skill 索引进托管 registry。若未登录，这一步会被完全跳过（不会发出任何请求）。若尝试但失败（例如上面提到的 token 过期），第一步的 manifest 写入依然会成功 —— 索引失败只会产生一条 warning，且不会重试。

`SKILL.md` 的 `metadata.version` 字段**必须是合法的 semver 字符串**，否则 `skill publish` 会直接拒绝发布该 skill。

### 验证一次发布是否成功（`--json`）

要判断第 2 步（索引）到底成没成，可靠做法是读 `skill publish --json` 打印的 JSON，而不是去猜人类可读文本的意思。以下字段语义已对照 CLI 源码本身核实（`packages/cli/src/core/skillPublish.ts`、`registryIndex.ts`），并非真跑出来的（写这份文档时没有真的执行发布 —— 见本节末尾的说明）。一次成功调用的输出形状：

```json
{
  "ok": true,
  "entry": { "...": "写入的 manifest 条目" },
  "manifestPath": "skills.json",
  "updated": true,
  "anonymous": false,
  "versionMissing": false,
  "indexed": true
}
```

- **`indexed`** —— 该条目是否也被 POST 进了托管 registry，即回答"这个 skill 是不是真的进了共享 registry，而不只是我本地的 `--registry` checkout"这个问题的字段。`indexed: false` **绝不**意味着 manifest 写入失败——`entry`/`manifestPath` 总是先写入成功，且从不因为索引失败而被回滚。
- **`indexed: false` + `anonymous: true`** —— 你没有登录，所以索引请求根本没有发出。这是设计如此的"仅本地"路径（见上文「发布 skill」），不是错误。
- **`indexed: false` + `anonymous: false`** —— 你已登录，但索引请求本身失败了；结果里还会带一个 `indexError` 字符串说明原因。实践中最常见的原因是前面提到的 24 小时凭据过期缺口（债 `cli-auth-token-expires-silently`）：`auth status` 依然显示你已登录，但 token 其实在服务端已经过期。重新 `auth login`，再发布一次。
- **`updated`** —— `true` 表示同一 skill id 的已有 manifest 条目被替换（一次重复发布）；`false` 表示新增了一条条目。
- **`versionMissing`** —— 只有当 `SKILL.md` 完全解析不出版本（`metadata.version`，回退到 `metadata['thefool.version']`）时才为 `true`。这不会阻塞发布，只是一条 warning —— 真正的非法（非 semver）版本号是另一种更硬的失败：`skill publish` 会在任何写入发生之前直接拒绝（见上文）。

如果你还想用肉眼确认，可以打开托管 registry 里该 skill 的网页——`https://www.fujia.site/skills/<skill-id>`，其中 `<skill-id>` 就是 manifest 条目里的 `id`——确认页面上真的渲染出了这个 skill 的内容。**不要把那个页面返回 HTTP 200 当作任何判据**——那是一个客户端渲染的路由，一个不存在的 id 同样会返回 200。CLI 给出的 `indexed: true` 才是真正的信号。

也可以只校验、不发布：

```bash
npx @cogito.ai/cli@latest skill validate <skill-dir>
# ✓ <path> is a valid skill
```

### 已知限制

- **位于仓库根目录的 skill 目前无法被索引**进托管 registry（债 `repo-root-skill-cannot-be-indexed`）。如果打算发布，请把 skill 放在子目录下（如 `skills/<name>/`）。
- **`<= 0.14.0` 版本的 CLI 无法发布**到托管 registry —— 服务端会返回 `HTTP 426`（Upgrade Required），而旧版本 CLI 只会显示裸的状态码、看不到具体原因。始终通过 `npx @cogito.ai/cli@latest` 执行发布，以确保使用的是最新版本。

---

## 贡献

提交规范与工作流见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## License

[MIT](./LICENSE) —— 详见文件。

<!-- TODO: 首次公开发布前确认最终 license 选择 -->
