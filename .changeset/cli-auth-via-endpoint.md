---
'@cogito.ai/cli': minor
---

`agentdock auth` 现在零配置可用，且 `skill publish` 的署名会带上可读名字

之前 `agentdock auth login` / `logout` / `status` 必须先手动配一个 `AGENTDOCK_AUTH_ANON_KEY`
才能用，否则直接报 `PROVIDER_NOT_CONFIGURED`。现在 CLI 改为调用 provider 的
`{webUrl}/api/device-auth/consume` HTTP 端点（而不是直连 PostgREST RPC），不再
需要任何密钥——**装完就能登录**，不用先配置环境变量。

- `agentdock auth login`：打开系统浏览器完成授权，凭据保存到 `~/.agentdock/credentials.json`（权限 `0600`）
- `agentdock auth logout`：清除本地凭据
- `agentdock auth status`：查看当前登录身份（从不打印 token）
- 想指向自建 hub：设置 `AGENTDOCK_AUTH_WEB_URL`，或在 `~/.agentdock/config.json` 里配置具名 provider——不用改代码、不用传密钥
- 旧的 `AGENTDOCK_AUTH_ANON_KEY` / `AGENTDOCK_AUTH_SUPABASE_URL` 如果还设置着，现在只打一条"已不再需要"的提示，不会报错

`agentdock skill publish` 产出的 manifest 条目里，登录后的 `author` 字段现在会带上
服务端解析出的可读名字（`author.name`），而不只是一个 UUID（`author.id`）——旧版本
只有 `id` 是预期行为，不需要重新登录来补。

**未变化**：`skill publish` 未登录仍可正常发布，只是 manifest 条目不带 `author`；
登录流程本身（浏览器授权、轮询节奏、5 分钟超时上限）不变。

---

`agentdock skill publish` 新增 skill 版本号（semver）门

manifest 条目现在可以带一个 `version` 字段，从 `SKILL.md` frontmatter 的
`metadata.version`（或 thefoolai 现有的 `metadata['thefool.version']`）读取——
**不读顶层 frontmatter**，因为 Agent Skills 规范本身没有 `version` 这个顶层键。

- 提供的版本必须是合法 semver（`major.minor.patch`，可选 `-prerelease` /
  `+build` 后缀，例如 `1.2.3` 或 `1.2.3-beta.1`）；`v1.2.0`、`2026-08-19`、
  `1.x`、`latest` 这类形状一律在 publish 时直接拒绝（`SKILL_VERSION_INVALID`），
  错误信息会同时给出收到的值与期望形状
- 没提供版本不会阻止发布，但会打一条醒目告警——没有版本号的条目今后无法和它自己
  的新版本做 diff
- 幂等：同一 skill 重复 publish，manifest 里的版本会被新值覆盖，不会产生重复条目
