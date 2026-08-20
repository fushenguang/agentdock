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

以下所有内容，都是写这一节时对着一次性的本地 git 假仓库真跑 `skill publish` 核实过的（绝不针对真实托管 registry —— 见下文「索引」一步，本地 `--registry` 指向哪里跟索引这一步完全无关，这一点很关键）。

**两个参数都是必填的** —— 少填任意一个，`publish` 会在碰任何东西之前就直接退出：

- **`<skill-dir>`**（位置参数）—— skill 目录（含 `SKILL.md`）的路径，相对/绝对都可以。不填 → `Error: <dir> is required`（`--json` 下为 `{"ok":false,"error":"MISSING_ARG","field":"dir"}`）。
- **`--registry <registry-checkout>`** —— 一个**本地的、某个 skills registry 的 git checkout 的根目录**：即含（或将要含）`skills.json` manifest 的那一层目录。它**不是**"skill 文件会被拷进去的地方"（见下文「publish 到底做了什么」），也**不需要**是本仓库自己的 checkout —— 任意一个本地克隆的、registry 形状的仓库都可以。不填 → `Error: --registry is required`（`--json` 下为 `{"ok":false,"error":"MISSING_ARG","field":"registry"}`）。指向一个不存在的路径 → `✗ Registry checkout not found: "<path>"`（`--json` 下为 `{"ok":false,"error":"REGISTRY_NOT_FOUND","message":"..."}`）。

**前置条件** —— 每一条不满足都对应一个真实核实过的报错：

| 要求 | 不满足时的报错 |
| --- | --- |
| `<skill-dir>` 位于某个 git 仓库内 | `"<dir>" is not inside a git repository`（`SKILL_SOURCE_UNRESOLVED`） |
| 该仓库配置了 `origin` remote | `no git remote "origin" configured for the repository containing "<dir>"`（`SKILL_SOURCE_UNRESOLVED`） |
| `SKILL.md` 通过 Agent Skills 规范校验 | `"<dir>" failed skill validation` 加一份 `errors` 列表，例如 `Missing required field in frontmatter: description`（`SKILL_INVALID`） |
| `metadata.version`（如果填了）是合法 semver | `Invalid version "<v>" in "<dir>": expected semver (major.minor.patch, e.g. "1.2.3", optionally with a "-prerelease" and/or "+build" suffix, ...) — got "<v>"`（`SKILL_VERSION_INVALID`） |

版本号**缺失**是允许的（见下文 `versionMissing`）——只有**格式错误**的版本号才会被直接拒绝。

**`publish` 到底做了什么、没做什么：**

- ✅ 校验该 skill，然后在 `<registry-checkout>/skills.json` 里写入或更新它的条目。这一步不依赖网络，未登录也能成功 —— 这是刻意为可移植性做的设计。
- ✅ 若已登录（`agentdock auth login`），还会把该条目 POST 进托管 registry（"索引"，见下文「验证一次发布是否成功」）。未登录时这一步整个跳过，不会发出任何请求。
- ❌ **不会**把 skill 的文件拷进 `--registry` checkout。只有 `skills.json` 会多一条（或更新一条）记录，skill 本身完全不会被碰或移动。
- ❌ **不会**对 registry checkout 或 skill 自己的仓库做任何 `git add`/`commit`/`push` —— 这一点已通过实跑后检查 `git status` 核实：manifest 就是一处普通的、未提交的工作区改动。要不要 commit、push `skills.json`，由你自己决定。
- **`entry.source` 和 `entry.path` 来自 skill 自己所在的 git 仓库**（它的 `origin` remote，规范化成可克隆、不带凭据的 URL，加上它在那个仓库里的相对路径）——**不是**来自 `--registry`。这是最容易搞反的一点：上面两条 ❌ 很容易让人以为 `publish` 会"把 skill 收进 registry 仓库"，但它从来不会。实际影响是：skill 自己所在的仓库必须是陌生人真能 `git clone` 到的仓库 —— 因为写进 manifest、别人真正会拿去装的，是**那个**仓库的地址，不是 `--registry` checkout 的地址。

**现在 CLI 会始终说清条目指向哪里，且指向出乎意料时会大声告警。** 以下是一次真实运行的输出（skill 自己所在仓库与 `--registry` checkout 的 `origin` 不同）：

```
✓ Added "demo-skill" in /path/to/registry-checkout/skills.json
  source: https://github.com/acme-private-org/private-skills-repo (path: skills/demo-skill)
⚠⚠ This entry points at https://github.com/acme-private-org/private-skills-repo — NOT your --registry checkout (https://github.com/acme-public-org/public-skills-registry). Anyone installing this skill must be able to `git clone` that repository — make sure it is public. Publishing from a private repo on purpose is fine, just know that is what happened here.
```

`source:` 这一行**总是**打印，不管指向是否一致。`⚠⚠` 这一行只在两者不一致时才出现。**这是一条告警，不是拦截** —— 从一个不同（甚至私有）于 registry checkout 的仓库发布 skill 是一个合法场景，例如一个你不打算给别人装的私有 skill；告警的作用只是让这件事不再悄无声息，而不是禁止它。CLI 刻意不去检测"这个仓库是不是真的私有"——那需要联网请求和鉴权，它并不具备；它只把解析出的 `source` 打印出来，判断留给你自己。

**为什么要加这一段：** 一次真实的 `skill publish <某私有仓库内的目录> --registry <一个公开内容仓的 checkout>` 运行，写出了一条 `source` 指向那个私有仓库的 manifest 条目，而输出和文档里都**完全没有**任何迹象表明 `source`/`path` 来自 skill 自己的仓库、而不是 `--registry`。照着这条记录去装的人会在 `git clone` 那一步失败，而那个私有仓库的地址也就此躺进了一份公开文件。

**副作用清单，完整版 —— 除此之外不会碰任何东西：**
- `<registry-checkout>/skills.json` 被创建（如果不存在）或更新：新增一条条目，或者 —— 如果已有相同 `id`（即 skill 的 `name`）的条目 —— 那一整条被替换（多次发布之间字段不会合并）。
- 写入/替换的条目字段：`id`/`name`（来自 `SKILL.md` 的 `name`）、`description`、`source`、`path`（skill 位于其仓库根目录时省略）、`license`（frontmatter 里有就带上）、`version`（能解析出就带上）、`nonSpecFields`（如果 `skills-ref` 把某些非规范顶层 frontmatter 字段降级成了警告）、`author`（已登录时带上）、以及 `publishedAt` —— 每次发布都会刷新成当前时间戳，哪怕这是一次内容完全没变的重复发布。
- 不会 commit 或 push 任何东西（见上面两条 ❌）。

**`--silent` 与 `--json`：** `--json` 打印机器可读的结果（见下文），取代交互式/纯文本输出。`--silent` 目前的行为跟 `--json` **完全一致** —— 单独只加 `--silent`（不加 `--json`）也会让 `publish` 往 stdout 打印同一行 JSON，这一点已通过单独跑 `--silent` 核实。输出格式实际上是按"stdout 是否为 TTY"来选的：交互式终端 + 不加任何 flag → 走 `@clack/prompts` 的提示式 UI（spinner、彩色的 `✓`/`⚠`/`✗`）；其它任何情况（加了任一 flag，或者 stdout 被管道/重定向）→ 走纯文本的 `console.log`/`console.warn`，除非同时加了 `--json` 或 `--silent`，那样就是那一行 JSON。脚本、agent 需要根据结果编程分支时用 `--json`（目前等价地也可以用 `--silent`）；手动在终端里发布时两者都不要加。

### 验证一次发布是否成功（`--json`）

要判断索引到底成没成，可靠做法是读 `skill publish --json` 打印的 JSON，而不是去猜人类可读文本的意思。一次成功调用的输出形状（字段已通过对着本地假 fixture 加 `--json` 真跑核实）：

```json
{
  "ok": true,
  "entry": { "...": "写入的 manifest 条目" },
  "manifestPath": "/path/to/registry-checkout/skills.json",
  "updated": false,
  "anonymous": false,
  "versionMissing": false,
  "indexed": true,
  "registrySource": "https://github.com/acme-public-org/public-skills-registry",
  "sourceRepoDiffersFromRegistry": false
}
```

- **`indexed`** —— 该条目是否也被 POST 进了托管 registry，即回答"这个 skill 是不是真的进了共享 registry，而不只是我本地的 `--registry` checkout"这个问题的字段。`indexed: false` **绝不**意味着 manifest 写入失败——`entry`/`manifestPath` 总是先写入成功，且从不因为索引失败而被回滚。
- **`indexed: false` + `anonymous: true`** —— 你没有登录，所以索引请求根本没有发出。这是设计如此的"仅本地"路径（见上文「发布 skill」），不是错误。
- **`indexed: false` + `anonymous: false`** —— 你已登录，但索引请求本身失败了；结果里还会带一个 `indexError` 字符串说明原因。实践中最常见的原因是前面提到的 24 小时凭据过期缺口（债 `cli-auth-token-expires-silently`）：`auth status` 依然显示你已登录，但 token 其实在服务端已经过期。重新 `auth login`，再发布一次。
- **`updated`** —— `true` 表示同一 skill id 的已有 manifest 条目被替换（一次重复发布）；`false` 表示新增了一条条目。
- **`versionMissing`** —— 只有当 `SKILL.md` 完全解析不出版本（`metadata.version`，回退到 `metadata['thefool.version']`）时才为 `true`。这不会阻塞发布，只是一条 warning —— 真正的非法（非 semver）版本号是另一种更硬的失败：`skill publish` 会在任何写入发生之前直接拒绝（见上文）。
- **`registrySource`** —— `--registry` checkout 自己的 `origin` remote（规范化方式与 `entry.source` 一致）。**只在能解析出时才会出现** —— 即 `--registry` 指向的确实是一个有可克隆 `origin` 的 git checkout。对一个本地实验用、本身不是 git 仓库的 registry 目录，这个字段会缺失；缺失不代表出错。
- **`sourceRepoDiffersFromRegistry`** —— 当 `entry.source`（skill 自己的仓库）与 `registrySource`（`--registry` checkout 自己的仓库）不一致时为 `true` —— 上面纯文本输出里的 `⚠⚠` 告警就是由这个字段驱动的。**只在 `registrySource` 同时存在时才会出现** —— 无法解析出 `registrySource` 时，说明没能做比较，所以这个字段会被省略，而不是默认给 `false`（那样会被误读成"已确认一致"）。

**常见的 `--json` 失败形状**，每一种都已真跑核实：

| 情况 | `--json` 输出 |
| --- | --- |
| 没填 `<dir>` | `{"ok":false,"error":"MISSING_ARG","field":"dir"}` |
| 没填 `--registry` | `{"ok":false,"error":"MISSING_ARG","field":"registry"}` |
| `--registry` 路径不存在 | `{"ok":false,"error":"REGISTRY_NOT_FOUND","message":"Registry checkout not found: \"<path>\""}` |
| `<dir>` 不在 git 仓库里 | `{"ok":false,"error":"SKILL_SOURCE_UNRESOLVED","message":"\"<dir>\" is not inside a git repository"}` |
| 该仓库没有 `origin` remote | `{"ok":false,"error":"SKILL_SOURCE_UNRESOLVED","message":"no git remote \"origin\" configured for the repository containing \"<dir>\""}` |
| `SKILL.md` 没通过规范校验 | `{"ok":false,"error":"SKILL_INVALID","message":"\"<dir>\" failed skill validation","errors":["..."]}` |
| `metadata.version` 不是合法 semver | `{"ok":false,"error":"SKILL_VERSION_INVALID","message":"Invalid version \"<v>\" in \"<dir>\": ..."}` |
| 发布成功，但索引失败（已登录、请求失败） | `{"ok":true, ..., "indexed":false,"indexError":"<原因>"}` |
| 发布成功，未登录（索引根本没尝试） | `{"ok":true, ..., "indexed":false,"anonymous":true}`（没有 `indexError`——因为什么都没尝试） |

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
