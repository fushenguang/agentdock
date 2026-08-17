---
roadmap-id: publish-source-url-normalization
---

# cli-publish-source-normalization

> 本刀是 thefoolai `skill-commerce-loop` 子roadmap 收尾两刀的第一刀。
> 它是**第二刀（建公开内容仓 `fushenguang/thefool-skills`）的硬前置**：source 不修，
> 仓建了别人也装不了。
> 上游 PRD：thefoolai `apps/wiki/content/docs/prd/skill-commerce-loop.mdx` §4.2 ★★

## Why

`skill publish` 产出的 manifest 里，`source` 字段**是非确定性的**。

`packages/cli/src/core/skillPublish.ts:87-110` 把 `git remote get-url origin` 的输出
**零规范化**直接写进 `source`。因此产出物取决于**发布者本机的 git 配置**：

| 发布者的 origin 形式                   | 产出的 `source` | 无凭据的人能否 clone    |
| -------------------------------------- | --------------- | ----------------------- |
| `git@github.com:owner/repo.git`（SSH） | 原样 SSH        | ❌ 需要被授权的 SSH key |
| `https://github.com/owner/repo.git`    | 原样 HTTPS      | ✅                      |

**准确的表述不是「它输出 SSH」，而是——同一个仓库、两个贡献者发布同一个 skill，
会产出一个能装、一个不能装的 manifest。** 这是发布产物里的非确定性，
且它**对发布者本人不可见**（他自己的 clone 一定能用）。

违反的护栏是消费侧的那条：「别家 Agent 拿到 git 地址就能直接装」。
**判据不是「URL 能被解析」，而是——产出的 URL 能被一个没有任何凭据的人 clone。**

证据来源：归档 `cli-skill-publish` 时用真实样本 `lesson-prep` 实跑一次 publish 并
**读产出物内容**（不是只看退出码）才暴露。完整证据链见
`openspec/changes/archive/2026-08-16-cli-skill-publish/design.md` 末尾章节。

### 设计期新发现的第二个缺陷：凭据会被写进产物

`git remote get-url origin` 可能返回内嵌凭据的形式
（`https://x-access-token:<TOKEN>@github.com/owner/repo.git` —— CI 检出、
`gh auth setup-git`、公司代理都会产生它）。当前实现会把**该 token 原样写进 manifest**，
而 manifest 的用途就是**提交进公开 registry 仓**。

这条不在原 roadmap 注释里，是本次设计时顺着「规范化」这条线查出来的。
它与主缺陷同源（零规范化），修法也同源（解析后只保留 scheme/host/path），
故并入本刀，不另立条目。

## What

在写入 `source` 之前**规范化为匿名可 clone 的 HTTPS URL**，并对**无法规范化的形式显式报错**
而不是静默写入。

- 新增纯函数模块 `normalizeGitRemoteUrl(remote)` → `{ url } | { error }`，零外部依赖
- `resolveGitSource` 改为经它产出 `source`；不可规范化时走既有错误码 `SKILL_SOURCE_UNRESOLVED`，
  message 必须**可操作**（含原始 remote + 修法）
- 规范化规则见 `design.md`，要点：
  - SCP 形式 `git@host:owner/repo.git` → `https://host/owner/repo`
  - `ssh://` / `git://` / `git+ssh://` → `https://…`，丢弃 userinfo 与端口
  - `https://` / `http://` → 保留 scheme，**丢弃 userinfo**（凭据绝不进产物），去 `.git`
  - 本地路径 / `file://` / 无点的 host（≈ `~/.ssh/config` 别名） → **报错，不猜**
- `path` 字段的推导逻辑**不动**

### 验收的判据是「陌生人能 clone」，不是「跑通了」

`agentdock` 仓本身正好是这个缺陷的活样本：它是 **PUBLIC 仓**，而本机 origin 是
`git@github.com:fushenguang/agentdock.git`。所以可以端到端真验：

1. 在本仓库内真跑一次 `skill publish`，**读产出的 `skills.json` 内容**
2. 拿产出的 URL，在**禁用一切凭据**的环境下 clone
   （`GIT_TERMINAL_PROMPT=0` 与 `GIT_SSH_COMMAND=/bin/false`）→ 必须成功
3. **反向对照**（不可省）：同样环境下 clone **原始 SSH URL** → 必须失败。
   只验成功路径，无法排除「本来就没问题」

## Non-goals

- ❌ **不做网络可达性探测**——`publish` 保持离线、纯。判据是「形式上与凭据无关」，
  不是「这个仓此刻存在」。加网络探测会让 publish 依赖网络与私有仓可见性，得不偿失。
- ❌ **不迁移/回填既有 manifest 里的历史条目**——本刀只保证**今后产出**正确。
  存量条目由发布者重跑 publish 覆盖（publish 本就幂等）。
- ❌ **不支持自定义 host 映射表 / 企业 SSH 别名解析**——`~/.ssh/config` 的 Host alias
  无法从 URL 还原。对这类形式**显式报错**，让人改 origin，不做猜测式映射。
- ❌ **不改 `skill validate`**，不改 `path` 推导，不改 manifest schema 的其它字段。
- ❌ **不做自动 commit / push / 开 PR**——既有硬边界不变。
- ❌ **不碰 `origin` 以外的 remote 选择逻辑**（多 remote 场景不在本刀）。

## 附带修正：上一次归档漏同步了 base spec

归档 `cli-skill-publish`（commit `35138c0`）**没有把 delta 同步进 `openspec/specs/`**——
`openspec/specs/cli-skill-publish/` 至今不存在，而本仓库其它归档（如 `ed1432c`）都同步了。

这使本刀的 `MODIFIED Requirements` 没有基线可改。故本刀**顺带补齐该 base spec**
（内容 = 归档里那份 delta 的 ADDED 部分，逐字搬入，不改语义）。
这是补上一次归档漏做的机械动作，不是新增范围——但它是**改 `openspec/specs/` 的动作**，
所以在此显式声明，请 Gate ② 一并过目。
