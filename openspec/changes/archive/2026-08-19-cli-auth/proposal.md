---
roadmap-id: cli-auth
---

# cli-auth

## Why

`agentdock skill publish` **完全不需要身份**——它校验 skill、把条目写进本地 registry checkout 的 `skills.json`，零网络零登录（`packages/cli/src/commands/skill/publish.ts`，50 行）。推到 GitHub 是使用者自己 `git push`。

后果是 manifest 条目**没有 `author`**。实测 `fushenguang/thefool-skills` 的 `skills.json`，三个条目全部只有 `id / name / description / source / path / license / publishedAt`。

而 hub 的产品定位是「**skill 的质检所 + 履历局**」——格式与分发已被开放标准商品化，唯一稀缺的是「这份 skill 管不管用」的可信证据。**证据必须挂在人身上**：没有署名，履历就无从归属，也无从建立信任。

同时，消费侧（thefoolai）还有一段断链：manifest 里已发布的 `codegen-standards`、`imap-smtp-email` **不在** `skills_registry` 里，于是 web 看不到、app 市场也装不了。现在唯一进过 registry 的 `lesson-prep` 是靠一条**手写 SQL** 塞进去的。CLI 有了身份之后，`publish` 才谈得上顺带把条目索引进去。

## 一处适用范围订正（前置，避免本刀被旧结论挡回）

thefoolai 侧 PRD 曾把「明确不用 Supabase」的铁律扩写成「CLI 不碰 Supabase」，理由是"skill 要能被别家 Agent 装"。**该理由已由构建者于 2026-08-19 推翻**：

- 别家 Agent 根本不会用我们的 CLI 装 skill
- skill 本身遵 Agent Skills 开放标准，**与 CLI、Supabase 都解耦**

铁律的主语是 **hub / registry**，它真正保护的是「**目录真源必须留在 git manifest**」——若 CLI 直接写后端表而不写 manifest，第三方就消费不了目录。**登录与之正交。**

## What Changes

1. **新增 `agentdock auth` 命令组**（形状对齐 `claude auth`）：
   - `login` —— 浏览器授权流：CLI 生成 device code → 打开浏览器到 provider 的授权页 → 用户确认 → CLI 轮询一次性消费接口取回 session
   - `logout` —— 清除本地凭据
   - `status` —— 显示当前登录身份（未登录时退出码非 0，便于脚本判断）
2. **provider 可配置**：endpoint 与 anon key 从配置读取（默认指向 thefoolai），**CLI 代码内不硬编码任何一家**。理由是避免硬编码与支持多环境，**不是铁律要求**。
3. **`publish` 带署名**：已登录时把身份写进 manifest 条目的 `author`（存稳定 id + 冗余一个可读 display name）。
4. **manifest 永远先写**：后端索引（若配置了 provider）是**附加动作**，任何情况下不得取代 `skills.json` 这个真源。

## Non-goals

- **不做后端索引本身**（`publish` → `skills_registry` 的 upsert）——那要在本刀的身份能力落地后单独一刀，且涉及消费侧表结构映射（manifest 缺 `version`、纯英文而 registry 有 `name_zh` 等）
- **不做 manifest ↔ registry 的对账/回填**——那一段落在 thefoolai 仓（CLI 管新发布，脚本管回填与对账）
- **不改 skill 格式**，不新增非规范字段到 SKILL.md
- **不做组织/团队账号、不做权限分级**——只做「这条 skill 是谁发的」
- **不动 `validate`**，不给它加任何网络依赖

## 安全约束（硬性）

- **发布到 npm 的包内不得含任何秘密**。浏览器授权流只需要 provider URL + 公开的 anon key（该类 key 本就随客户端分发）。
- 本地凭据文件权限 `600`；`status` 与日志**永不回显 token**。

## 待构建者裁决（写进本 proposal，实现前需回答）

1. **凭据存哪**：系统 keychain（跟 app 一致，但引入原生依赖，与"CLI 零原生依赖"的取舍冲突）vs `~/.agentdock/credentials.json`（600 权限，零依赖）
2. **未登录时 `publish` 怎么办**：硬失败 vs 允许匿名发布但告警（内容仓是公开的，别人 fork 后也该能用这个工具 → 倾向后者）
3. **`author` 存什么**：稳定 id（uuid，不可读但不会变）+ 冗余 display name，还是只存可读标识

## 验收

- `agentdock auth login` 在真机走通一次浏览器授权，`auth status` 显示身份，`auth logout` 后 `status` 退出码非 0
- 登录后 `skill publish` 产出的 manifest 条目**带 `author`**；未登录时行为符合上面第 2 条的裁决
- **反向对照**：凭据文件被删/损坏时，`status` 报未登录而不是崩溃；`publish` 不因为登录态缺失而写出半条 manifest
