## MODIFIED Requirements

### Requirement: AI Chat 可用（模型配置正确，错误处理清晰）

`apps/docs/app/api/chat/route.ts` MUST 使用与 burn.hair 代理兼容的模型 ID，并在配置缺失时给出明确错误提示，不静默失败。

**当前问题**：

- 默认模型 `anthropic/claude-3.5-sonnet` 是 OpenRouter 格式，burn.hair 代理可能使用不同的模型 ID 格式（如 `claude-3-5-sonnet-20241022` 或其他）
- 未配置 `OPENROUTER_MODEL` 时无提示，调试困难
- 缺少 `.env.local.example` 中的 chat 配置说明

**修复要求**：

1. **模型配置**：
   - 默认模型改为经过验证的 burn.hair 兼容 ID（实现时需在 burn.hair 控制台确认可用模型列表）
   - `OPENROUTER_MODEL` 环境变量支持覆盖，在 `.env.local.example` 中注释说明可用模型

2. **错误处理**：
   - API key 未配置时，`POST /api/chat` 返回 `400 { error: "OPENROUTER_API_KEY is not configured" }` 而非 500
   - Chat UI 组件收到非 2xx 响应时显示用户友好的错误提示（而非空白或无响应）

3. **环境变量文档**：
   - 在 `apps/docs/.env.local.example`（新建）中列出所有必要变量：`OPENROUTER_API_KEY`、`OPENROUTER_BASE_URL`、`OPENROUTER_MODEL`（含说明和示例值）

#### Scenario: 正确配置 env 后 chat 可正常响应

- **WHEN** `.env.local` 中 key 和 base URL 正确，发送消息"什么是 anti-drift system？"
- **THEN** AI 调用 search tool 后返回基于文档内容的回答，并附带来源链接

#### Scenario: API key 未配置时给出明确错误

- **WHEN** `OPENROUTER_API_KEY` 为空，用户发送消息
- **THEN** chat 界面显示"AI 服务暂不可用，请检查配置"，控制台输出具体错误原因

#### Scenario: chat 引用 docs 内容回答问题

- **WHEN** 问"如何配置 Supabase auth？"
- **THEN** AI 通过 search tool 找到相关 docs 页面，回答中包含来源链接（如 `/docs/templates/web-nextjs`）
