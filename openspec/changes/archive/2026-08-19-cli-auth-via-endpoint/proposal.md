---
roadmap-id: cli-auth
---

# cli-auth-via-endpoint

> 收尾刀：把 `cli-auth` 从"能登录但要用户自己配密钥"变成"零配置就能登录"。

## Why

`cli-auth` 已落地并通过真机验收，但**登录必须先自己配一个环境变量**：

```bash
export AGENTDOCK_AUTH_ANON_KEY=<公开 anon key>   # 否则 login 直接报 PROVIDER_NOT_CONFIGURED
```

原因是 CLI 直连 PostgREST 调 `cogito.consume_device_auth`，而 PostgREST 要 `apikey`。把这个 key 内置进包的三个代价（会打红 agentdock 的 `secrets` 门 / 轮换即坏 / provider 抽象被撑大）在 `cli-auth` 的记录里已经论证过，这里不重复。

**thefoolai 侧的对侧接缝已经建好了**：`POST /api/device-auth/consume`（thefoolai PR #199 已合并 main，含生产构建实跑与一次性消费语义的反向对照）。本刀把 CLI 切过去。

切过去之后：

- **provider = 一个 base URL**，不再是「URL + key + RPC 名 + schema 头」
- **包内零密钥**，`secrets` 门不用开任何白名单
- **服务端可以演进流程而不必发 CLI 新版**

## ⚠️ 硬前置：生产 web 必须先有这个端点

**2026-08-19 实测：`POST https://www.fujia.site/api/device-auth/consume` 返回 `404`。**

`#199` 合进了 `main`，但 `release-web` 没有对齐——**合并进 main 不等于上了生产**（这条在本项目已复发五次以上，见 wiki「发布分支流程」）。

⇒ **本刀实现前必须先做一次 web 生产发版**，并以 `curl` 该端点拿到非 404 作为判据（不看工作流颜色）。前置没做就切，结果是把所有用户的登录一起切到一个不存在的地址。

## What Changes

1. `core/auth.ts` 的 `consumeDeviceAuth()` 改为 `POST {webUrl}/api/device-auth/consume`，body `{ device_code }`——**只动这一个函数**，这正是 `cli-auth` design §2.2 预留的位置。
2. `AuthProvider` 收敛为 `{ name, webUrl }`；`supabaseUrl` / `anonKey` 移除。
3. `DEFAULT_PROVIDER` 只剩 `webUrl`，**零配置可用**。
4. 旧的 `AGENTDOCK_AUTH_ANON_KEY` / `AGENTDOCK_AUTH_SUPABASE_URL` 若仍被设置 → **打一条"已不再需要"的提示**，不报错（别把老用户的环境搞崩）。
5. **补 changeset 并发版**——这是第一个用户真正可用的带 `auth` 的版本。

## Non-goals

- **不改登录流程本身**：device_code 生成、开浏览器、轮询节奏（2s / 5 分钟上限）、凭据存储与权限位，全部不动
- **不改 electron 客户端**：它直连 RPC 且工作正常，迁移是独立决策
- **不做 token 刷新 / 续期**：本刀只换传输通道
- **不动 `auth` 的命令形状**

## 验收判据

- **零配置正向**：一台**没有设置任何 `AGENTDOCK_AUTH_*` 环境变量**的机器上，`agentdock auth login` 走通
- **反向对照 ①**：把 `AGENTDOCK_AUTH_WEB_URL` 指向一个不存在的域 → **明确报错并在超时上限内结束**，不是无限挂住
- **反向对照 ②**：`grep -rE 'eyJ[A-Za-z0-9_-]{20,}' dist/` **无命中**；CI 的 `secrets` 门仍绿（没有为此加任何白名单）
- **反向对照 ③**：同一 `device_code` 消费两次 → 第二次 `consumed`（端点没有破坏一次性语义）
- 发版后：`npm view @cogito.ai/cli version` 是新版本，且**在一台干净机器上装了就能登录**
