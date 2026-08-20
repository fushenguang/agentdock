---
roadmap-id: skills-hub-cli
---

# cli-publish-to-registry

> 对应 thefoolai 侧已获批的同名 proposal（`openspec/changes/cli-publish-to-registry/proposal.md`，
> 2026-08-19 合入 thefoolai `main`）。那份 proposal 拥有**服务端**决策（`POST /api/skills/publish`、
> 鉴权、以及仍待裁决的服务端安全扫描问题）。本刀只做 agentdock 这一侧该做的事：**写完 manifest 之后，
> 尽力调用一次该端点**。

## Why

`skill publish` 目前只写 git manifest（`skills.json`）。没有任何一步告诉 thefoolai 的托管
registry 这个 skill 存在，于是从终端发布的 skill 从来没有一条在 web 可见、在 app 可安装——这个缺口
在 thefoolai 侧 proposal 里已用实测数据说清楚（git manifest 有 4 条，托管 `skills_registry`
只有 2 条，且那 2 条都不是走终端发布进去的）。

身份能力已经落地（`cli-auth-via-endpoint`，已归档）：登录后的 CLI 持有一个 access token、零 API key。
这正是本刀能够不引入任何新凭据就完成的前提。

## What Changes

1. 新增 `core/registryIndex.ts` 的 `indexToRegistry()`——CLI 的**第二个**（也是目前最后一个）后端触点，
   紧接在 `consumeDeviceAuth()` 之后。传输形状与之一致：只认一个 `provider.webUrl`，
   `Authorization: Bearer <access_token>` 取自磁盘上已有的凭据，不引入任何其他密钥。
2. `publishSkill()` 在 manifest **写入成功之后**调用一次，把结果并入返回值
   （`indexed: boolean`、`indexError?: string`），**永不**因索引结果改变 `ok`、也永不回滚 manifest。
3. 适配层（`adapters/skill/human.ts`、`adapters/skill/agent.ts`）在 `indexed` 为 `false` 时打一条告警——
   区分"未登录"（根本没发请求）和"请求失败"（带状态码/错误摘要）；索引成功或已经在 JSON 模式里
   携带该字段时不额外输出。
4. 请求体：`{ skill_id, git_url, name, description, version?, license? }`——**绝不**包含 `access_tier` /
   `is_official` / 任何扫描或安全状态字段。那些字段由服务端赋值；客户端若能声明它们，就正是
   thefoolai proposal 里指出的"客户端自报扫描结果"绕过——那是服务端那一侧要堵的门，
   agentdock 这一侧要做的是**从不给客户端这个声明的机会**。

## Non-goals

- **不做服务端端点本身。** `POST /api/skills/publish`、它的鉴权、以及最关键的"安全扫描在哪儿跑"，
  是 thefoolai 的决策与 thefoolai 的 proposal。本刀把该端点当作一个不透明的 HTTP 契约来对待，
  并且写法上要求：不管合并这一刀时该端点是否已经上线，agentdock 侧都能正确工作（见下方
  「容忍端点尚未上线」）。
- **不做重试循环。** 这是一次性调用，不是 `pollForSession`。失败——包括超时——立即返回结果，
  绝不轮询、绝不退避。把 `pollForSession`"网络错误就继续重试"的写法搬到这里，会在一个更不该出现
  这种写法的地方（一次性的附加动作，不是用户正在盯着等的登录流程）重新制造那份归档 proposal
  已经点名的"体验挂住"问题。
- **不引入新的凭据存储或格式。** 完全复用 `StoredCredentials.accessToken`，与 `auth.ts` 现有读法
  一致。不新增配置文件，不新增环境变量。
- **不改 manifest schema。** 发给端点的字段全部来自 `publishSkill()` 已经构建好的
  `SkillManifestEntry`；不往 `skills.json` 里多写任何东西。
- **不做历史回填**（manifest 里有、托管 registry 里没有的存量条目，如 `codegen-standards` /
  `imap-smtp-email`）。那是独立的对账刀，不是本刀。
- **不从 CLI 传任何定价/`access_tier` 输入**——上面已经说过，这里再强调一次，因为这是最容易被
  照抄照传的一个字段。

## 容忍端点尚未上线

写这份 proposal 时，thefoolai 的 `POST /api/skills/publish` **尚未真正上线**——只有它的 proposal
文档合入了 `main`。`indexToRegistry()` 的写法让这件事对 agentdock 而言是无感的：404（端点不存在）、
连接失败（域名解析/连接被拒）、真实的请求错误，全部归为同一种 `REQUEST_FAILED` 结果——manifest
照写、打一条告警、退出码 0。本刀不依赖、也不等待端点上线才能合并；两边独立落地，端点上线后
自然接上。

## 验收判据

- 已登录 + 端点可达且返回 2xx → `indexed: true`，无告警，manifest 已写入。
- 未登录 → **完全不发起 HTTP 请求**，manifest 已写入，打一条告警（"未索引——先登录"），退出码 0。
- 端点不可达 / 404 / 500 / 超时 → manifest 已写入，打一条带状态码/错误摘要的告警，**不重试**，
  退出码 0，命令不挂死。
- 请求体里永远不含 `access_tier`、`is_official`、任何扫描/安全状态字段。
- `pnpm test` 全绿，`pnpm check-types` 无错。
