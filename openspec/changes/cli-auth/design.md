# cli-auth — design

## 1 · 复用哪条流（实测，非推测）

thefoolai app 的浏览器授权登录，客户端侧其实只做三件事（`apps/electron-app/src/main/libs/supabase/deviceAuth.ts`）：

1. 生成 `device_code`（uuid）
2. 打开系统浏览器到 `{webUrl}/device-auth?code=<uuid>&device_name=<host>`
3. 每 2s 轮询 `cogito.consume_device_auth(p_device_code)`，直到 `approved`（拿到 session）/ `expired` / `denied`

★ **客户端不建那行记录**——`thefool_device_auth_requests` 的 INSERT 发生在**网页那一侧**的 server function 里（`apps/web/src/server/device-auth.ts`）。所以 CLI 需要的后端交互**只有一次 RPC**，不需要任何表的读写权限。

`consume_device_auth` 是 SECURITY DEFINER 的**一次性消费**接口：读出 session 的同一条语句里把 `session_data` 清空，令牌至多被读一次。thefoolai 侧 2026-08-19 已实测该路径（`pg_stat_statements` 里 anon 角色调用 +1、直连 select 不变）。

## 2 · provider 解析

一个 provider = `{ webUrl, supabaseUrl, anonKey }`。优先级（高 → 低）：

1. 命令行 `--provider <name>`（选配置文件里的具名 provider）
2. 环境变量 `AGENTDOCK_AUTH_WEB_URL` / `AGENTDOCK_AUTH_SUPABASE_URL` / `AGENTDOCK_AUTH_ANON_KEY`
3. `~/.agentdock/config.json` 的 `auth.providers.<name>`
4. 内置默认（thefoolai）

**CLI 代码里不散落任何一家的地址**——只有一处 `DEFAULT_PROVIDER` 常量。别人 fork 这个 CLI 指向自建 hub，改配置即可，不必改代码。

### 2.1 · 为什么内置默认里带 anon key 是可接受的

anon key **按设计就是公开物**：它已经打包在 electron app 里、也随 web bundle 发给每个访客。放进 npm 包不增加**新的**暴露类别。

thefoolai 2026-08-19 的事故复盘结论正是这一条：真正的修复是**收回 anon 角色的权限**（已 REVOKE 写与读），不是藏 key。

⚠️ **但更好的终局是 §2.2**，本刀不做只留路。

### 2.2 · 终局（不在本刀范围）：把 RPC 换成 provider 的 HTTP 端点

让 CLI 只认**一个 base URL**，轮询打 `{webUrl}/api/device-auth/consume`，由服务端去调 RPC。好处：
- CLI 侧**零密钥**
- provider 抽象从「URL + key + RPC 名」缩成「一个 URL」
- 服务端可以演进流程而不必发 CLI 新版

不在本刀做的原因：需要 thefoolai 侧新增端点（跨仓），会阻塞本刀节奏。**代码结构上预留**——所有后端交互收在 `consumeDeviceAuth()` 一个函数里，将来换实现只动它。

## 3 · 凭据存储（默认值，构建者可改）

`~/.agentdock/credentials.json`，权限 `0600`，形如：

```json
{ "provider": "thefoolai", "userId": "<uuid>", "displayName": "someone@example.com",
  "accessToken": "…", "refreshToken": "…", "savedAt": "2026-08-19T…Z" }
```

**不用系统 keychain**：给一个纯 JS CLI 引原生依赖（`keytar` 之类）代价大于收益——装机成功率下降、跨平台构建复杂度上升，而 CLI 的威胁模型本来就假设"能读你 home 目录的人已经赢了"（`~/.npmrc`、`~/.gitconfig`、SSH key 都在那）。

## 4 · manifest 的 `author`

`SkillManifestEntry` 增加可选字段：

```ts
author?: { id: string; name?: string }
```

- **`id` 存稳定 uuid**，`name` 是冗余的可读名。只存可读标识会在改名时断掉履历归属；只存 uuid 则人看不懂——两个都要，判据以 `id` 为准。
- **可选**：未登录时整个 `author` 字段不出现，而不是写 `null`（与既有 `path` / `license` / `nonSpecFields` 的"空则不写"惯例一致）。

## 5 · 未登录时 `publish` 的行为（默认值，构建者可改）

**允许匿名发布，但打醒目告警**，退出码仍为 0。

理由：内容仓是公开的、别人 fork 之后也该能用这个工具；硬失败会把「不是 thefoolai 用户」的使用者整个挡在门外，与 CLI 的通用定位相悖。告警文案要直接给出补救命令（`agentdock auth login`）。

## 6 · 可测试性

`core/auth.ts` 的所有外部效应通过参数注入，默认值取真实实现：

- `fetchImpl`（默认 `globalThis.fetch`）
- `sleep`（默认真 `setTimeout`）
- `openBrowser`（默认按平台 `open` / `start` / `xdg-open`）
- `now`（默认 `() => new Date()`）
- `homeDir`（默认 `os.homedir()`）——测试指向临时目录，**不碰真实 `~/.agentdock`**

轮询循环的**超时上限写死 5 分钟**（对齐 app），且每次 `sleep` 前检查 abort——不留无界等待（thefoolai 那边刚因为「无超时的子进程等待」吃过亏）。

## 7 · 安全硬约束

- `status` 与任何日志**永不打印 token**：只显示 `userId` / `displayName` / provider / 保存时间
- 写凭据文件用 `mode: 0o600`，且写前先 `mkdir -p ~/.agentdock`（同样 `0700`）
- 凭据文件损坏（JSON 解析失败）→ 视为**未登录**，不抛栈
