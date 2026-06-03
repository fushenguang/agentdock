## ADDED Requirements

### Requirement: Mode detection and routing

CLI 入口 MUST 在启动时检测运行环境，并将执行路由到对应模式：人类交互模式（TTY）或 Agent 无头模式（`--silent` / `--json` 标志）。

检测规则：
- `process.stdout.isTTY === true` 且未传入 `--silent` 或 `--json` 标志 → 人类模式（Clack UI）
- `process.stdout.isTTY === false` 或传入 `--silent` 或 `--json` 标志 → Agent 无头模式（JSON stdout）

#### Scenario: TTY 环境启动进入人类模式

- **WHEN** 在支持 TTY 的终端中执行 `agentdock init`，未传入 `--silent` 或 `--json`
- **THEN** CLI 进入交互模式，渲染 Clack 交互提示

#### Scenario: 非 TTY 环境自动进入无头模式

- **WHEN** 在 CI 环境（`process.stdout.isTTY === false`）或管道（`agentdock init | cat`）中执行命令
- **THEN** CLI 自动进入无头模式，所有输出为 JSON，不渲染任何交互 UI

#### Scenario: 显式标志覆盖 TTY 检测

- **WHEN** 在 TTY 环境中执行 `agentdock init --silent --json`
- **THEN** CLI 强制进入无头模式，忽略 TTY 状态

---

### Requirement: Structured JSON output contract

无头模式下，CLI MUST 将所有输出（成功、失败、进度）作为 JSON 行（NDJSON）写入 stdout，stderr 保持静默。

成功响应结构：
```json
{ "ok": true, "result": { ... } }
```

失败响应结构：
```json
{
  "ok": false,
  "error": "<ERROR_CODE>",
  "message": "<human readable>",
  "context": { ... },
  "suggested_action": "<optional command string>"
}
```

#### Scenario: 成功操作输出结构化结果

- **WHEN** Agent 以 `--silent --json` 执行 `agentdock init` 并成功
- **THEN** stdout 输出一行 JSON，`ok: true`，`result` 包含生成路径和模板信息，进程以 exit code 0 退出

#### Scenario: 失败操作输出结构化错误

- **WHEN** 无头模式下命令执行失败（如目录已存在）
- **THEN** stdout 输出一行 JSON，`ok: false`，含 `error` 错误码和 `message` 字段，进程以非零 exit code 退出

#### Scenario: stderr 在无头模式下保持静默

- **WHEN** Agent 以 `--silent` 执行任意命令
- **THEN** stderr 无任何输出，所有信息通过 JSON stdout 传达

---

### Requirement: Error code registry

CLI MUST 使用结构化错误码体系，确保 Agent 可以对具体错误类型做出自主决策。

MVP 阶段必须实现的错误码：

| 错误码 | 含义 | exit code |
|--------|------|-----------|
| `CLI_VERSION_OUTDATED` | CLI 版本低于模板要求的 minCliVersion | 2 |
| `TARGET_DIR_EXISTS` | 目标目录已存在且非空 | 1 |
| `TEMPLATE_NOT_FOUND` | registry.json 中不存在请求的模板 ID | 1 |
| `UNKNOWN_ERROR` | 未分类错误 | 1 |

#### Scenario: CLI_VERSION_OUTDATED 包含升级指令

- **WHEN** CLI 版本低于模板 `minCliVersion` 时执行 `agentdock init`
- **THEN** 输出 `CLI_VERSION_OUTDATED` 错误码，`suggested_action` 字段包含可直接执行的升级命令（如 `npm install -g @agentdock/cli@latest`）

#### Scenario: 已知错误码对应正确 exit code

- **WHEN** 命令因已知错误码失败
- **THEN** 进程以该错误码对应的 exit code 退出（成功为 0，`CLI_VERSION_OUTDATED` 为 2，其他已知错误为 1）

---

### Requirement: Core executor layer is pure

`core/` 目录下的所有函数 MUST 为无副作用的纯函数（不操作 stdout/stderr，不直接退出进程，不依赖全局状态），仅通过返回值或抛出错误传递结果。

#### Scenario: core 函数不直接写 stdout

- **WHEN** 执行 `core/scaffold.ts` 中的脚手架函数
- **THEN** 函数返回包含操作结果的数据对象，由 adapter 层决定如何渲染（Clack 或 JSON）

#### Scenario: core 函数抛出带错误码的错误

- **WHEN** `core/version.ts` 检测到版本不兼容
- **THEN** 抛出包含 `code: "CLI_VERSION_OUTDATED"` 字段的错误对象，不直接调用 `process.exit`
