---
'@cogito.ai/cli': minor
---

`skill publish` 写完 manifest 后会额外把条目索引进托管 registry，web 可查看、app 可安装

之前 `skill publish` 只写本地 git manifest（`skills.json`）——发布出去的 skill 从来没有
一条在 thefoolai 托管 `skills_registry` 里出现过：web 看不到、app 装不了。现在 manifest
写入成功之后，CLI 会额外 `POST {webUrl}/api/skills/publish`（`Authorization: Bearer
<access_token>`，复用 `cli-auth-via-endpoint` 已建立的零密钥传输——磁盘上已有登录凭据即可，
不引入任何新密钥/配置）。

请求体只含 `skill_id` / `git_url` / `name` / `description` / `version?` / `license?`；
`access_tier` / `is_official` / 任何扫描或安全状态字段全部由服务端赋值，CLI 从不携带。

边界（未变化的行为）：
- 未登录时**不发请求**，`skill publish` 照常只写 manifest
- 请求失败（含端点不可达、超时、非 2xx）**只告警，绝不阻塞、绝不回滚**已经写好的 manifest
- **不重试**——一次性、15s 超时的尽力而为调用，不是登录轮询那种退避重试

适配层（`agentdock skill publish` 的人类可读输出与 `--json` 输出）会区分"未登录跳过"与
"请求失败"两种告警，索引成功时不额外输出。
