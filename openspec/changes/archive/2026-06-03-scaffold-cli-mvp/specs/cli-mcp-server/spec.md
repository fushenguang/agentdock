## ADDED Requirements

### Requirement: MCP Stdio server startup

`agentdock mcp` MUST 启动一个基于 MCP 协议、使用 Stdio 传输的长连接服务。服务启动后持续监听，直到进程被终止（SIGINT/SIGTERM）。

服务元信息：
- `name`: `"agentdock"`
- `version`: 与 `@agentdock/cli` 包版本一致

#### Scenario: MCP 服务正常启动

- **WHEN** 执行 `agentdock mcp`
- **THEN** 服务通过 Stdio 建立 MCP 连接，响应来自 MCP 客户端的 `initialize` 请求，返回服务名称、版本与工具列表

#### Scenario: MCP 服务响应工具列表

- **WHEN** MCP 客户端发送 `tools/list` 请求
- **THEN** 服务返回包含 `list_templates`、`scaffold_project`、`get_template_schema` 三个工具的描述列表

#### Scenario: 服务在 SIGINT 时优雅退出

- **WHEN** 用户向 MCP 服务进程发送 SIGINT（Ctrl+C）
- **THEN** 服务关闭 MCP 连接，进程 exit 0，不留悬空进程

---

### Requirement: list_templates tool

`list_templates` 工具 MUST 返回当前 CLI 内置注册表中所有可用模板的结构化列表。

输入参数：无

输出结构：
```json
{
  "templates": [
    {
      "id": "web-nextjs",
      "name": "@agentdock/template-web-nextjs",
      "description": "...",
      "version": "0.1.0",
      "minCliVersion": "0.1.0"
    }
  ]
}
```

#### Scenario: 返回内置模板列表

- **WHEN** MCP 客户端调用 `list_templates`（无参数）
- **THEN** 工具返回 registry.json 中所有模板条目，每条包含 `id`、`name`、`description`、`version`、`minCliVersion` 字段

---

### Requirement: scaffold_project tool

`scaffold_project` 工具 MUST 以无头模式执行与 `agentdock init --json` 等价的脚手架操作。

输入参数（均有默认值）：
- `name` (string, required): 项目名
- `template` (string, default: `"web-nextjs"`): 模板 ID
- `targetDir` (string, default: `./<name>`): 目标目录绝对或相对路径
- `packageManager` (string, default: `"pnpm"`): 包管理器

输出结构：
```json
{ "ok": true, "path": "/abs/path/to/project", "template": "web-nextjs" }
```
或失败时：
```json
{ "ok": false, "error": "CLI_VERSION_OUTDATED", "suggested_action": "..." }
```

#### Scenario: Agent 通过 MCP 成功创建项目

- **WHEN** MCP 客户端调用 `scaffold_project` 并传入合法参数
- **THEN** 工具在目标路径创建项目文件，返回 `ok: true` 与绝对路径

#### Scenario: 版本不兼容时返回结构化错误

- **WHEN** MCP 客户端调用 `scaffold_project`，但 CLI 版本低于模板 `minCliVersion`
- **THEN** 工具返回 `ok: false`，`error: "CLI_VERSION_OUTDATED"`，`suggested_action` 含可执行的升级命令

#### Scenario: 目标目录已存在时返回错误

- **WHEN** MCP 客户端调用 `scaffold_project`，目标目录已存在且非空
- **THEN** 工具返回 `ok: false`，`error: "TARGET_DIR_EXISTS"`，不覆盖任何文件

---

### Requirement: get_template_schema tool

`get_template_schema` 工具 MUST 返回指定模板的详细元数据与 `agentdock init` 所需参数的 JSON Schema，使 Agent 能在调用 `scaffold_project` 前自省参数格式。

输入参数：
- `templateId` (string, required): 模板 ID

输出结构：
```json
{
  "template": { "id": "web-nextjs", "version": "0.1.0", "minCliVersion": "0.1.0" },
  "initParams": {
    "$schema": "...",
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "项目名（合法 npm 包名）" },
      "packageManager": { "type": "string", "enum": ["pnpm", "npm", "yarn"] }
    },
    "required": ["name"]
  }
}
```

#### Scenario: 返回有效模板的 schema

- **WHEN** MCP 客户端调用 `get_template_schema`，传入 `templateId: "web-nextjs"`
- **THEN** 返回模板元数据与 `scaffold_project` 参数的 JSON Schema

#### Scenario: 请求不存在的模板 ID

- **WHEN** MCP 客户端调用 `get_template_schema`，传入不存在的 `templateId`
- **THEN** 工具返回 MCP 协议级别的错误，`code: "TEMPLATE_NOT_FOUND"`
