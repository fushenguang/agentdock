---
roadmap-id: skills-hub-cli
---

<!--
  Mirrored from thefoolai's openspec/changes/cli-publish-giturl-scope/proposal.md
  (roadmap-id there: skill-commerce-loop — that id only exists in thefoolai's
  roadmap.yaml). Retargeted to `skills-hub-cli`, the umbrella entry in THIS
  repo's roadmap.yaml that already covers CLI publish (same precedent as the
  cli-publish-to-registry mirror). Content below is otherwise verbatim.
-->


# cli-publish-giturl-scope

> 2026-08-20 首次真实走通 CLI 发布链路的**同一次操作**打开的洞。已止血（PR #212），本刀是根治。债台账：`cli-publish-giturl-too-coarse`（P0）。

## Why

**CLI 发布写进 registry 的 `git_url` 粒度是「仓库」，而安装的粒度是「skill」。这个错配是一个真实的付费绕过。**

链路每一步都在代码里坐实过：

| 步 | 位置 | 事实 |
|---|---|---|
| ① | agentdock `core/registryIndex.ts` | 请求体只有 `skill_id/git_url/name/description/version?/license?`。`git_url` 取自 git remote = **仓库根**。manifest entry 里本来就有 `path`（如 `skills/format-markdown`），**没被发出去** |
| ② | web `server/skills-publish-handler.ts` | 原样把收到的 `git_url` 落库，不做粒度判断 |
| ③ | electron `ipc/skillsHandlers.ts` | 授权门查 `access_tier` 后放行，并**刻意只用 registry 自己的 `git_url` 下载**（其 header 注释写明这是为了堵死「用免费 id 配付费 URL」） |
| ④ | electron `skillManager.ts` `collectSkillDirsFromSource()` | 拿到无子路径的仓库根，发现 `<root>/skills/` 后返回其下**全部** skill 目录 |
| ⑤ | electron `skillManager.ts` `downloadSkill()` | `for (const skillDir of skillDirs) { cpRecursiveSync(...) }` —— **逐个全装，不按请求的 `skill_id` 过滤** |

净效果：免费账号点「安装 `format-markdown`」→ 连同一仓库里 `access_tier: vip` 的 `lesson-prep` 一起装进本地。

**③ 那道门的设计没有错。** 它把「验的是这个、装的是那个」从结构上堵死了——攻击者无法自带 URL。这次是**从另一头破的**：门用来下载的、registry 自己的那份数据，粒度太粗，指向一个装着别人（含付费）skill 的仓库。

⚠️ 止血（PR #212）只改了**已经写进去的那一行**。**下一条经 CLI 发布的 skill 仍会拿到仓库根的 `git_url`**——洞会随着 CLI 发布被推广而重新打开，而且越开越大。这是本刀必须做的理由。

## What Changes

**信息在传输时丢了，就在传输处补上；粒度错误能在写入时拒绝，就不要留到安装时才现形。**

1. **agentdock · CLI 把 `path` 发出去** —— `indexToRegistry()` 的请求体新增 `path`（manifest entry 已有的那个字段）与分支信息。
2. **web · 端点自己拼子路径** —— `POST /api/skills/publish` 用 `git_url` + 分支 + `path` 拼成带 `/tree/<branch>/<path>` 的 URL 再落库。**拼装放在服务端**，因为 registry 的数据形状是服务端的责任，且客户端老版本（≤0.12.0）不发 `path` 时服务端仍能给出确定行为。
3. **web · 写入时拒绝粗粒度 URL** —— 新条目的 `git_url` 若解析不出 skill 级子路径，**拒绝写入并返回明确错误**，而不是静默落一行粒度错误的数据。让这类错误在**发布时**失败，不要留到**安装时**才变成付费绕过。
4. **electron · 纵深防御** —— market-install 路径下 `downloadSkill()` 只安装与请求 `skill_id` 匹配的目录。即便将来又有一条粗粒度 URL 混进 registry，也不会再变成「点一个装四个」。

第 4 条与前三条**互相独立、各自生效**，不是同一道门的两半——这是有意的：前三条治源头，第 4 条兜底，任一条单独存在都能挡住本次这个具体绕过。

## Impact

- **变现完整性**：付费 skill 的内容不再能通过安装同仓库的免费 skill 获得
- **数据质量**：registry 的 `git_url` 恢复「一行 = 一个 skill」的不变量（当前 3 行在止血后都满足，本刀保证今后写入的也满足）
- **兼容性**：`≤0.12.0` 的 CLI 不发 `path`。**必须明确定义这种请求的行为**（拒绝 / 尝试推断 / 放行并标记）——见 design.md，这是本刀最需要想清楚的一处

## Non-Goals

- **不做安全扫描**——那是 `publish-path-scanning-undecided`（P1）的事，触发条件是发布入口收敛之后，与本刀无关
- **不做历史回填**——受影响的只有一行，已在 PR #212 止血
- **不改 manifest 格式**——`path` 字段本来就在，本刀只是把它发出去
- **不动 app 端既有的发布路径**（`skills:market:publish`）——它写的 `git_url` 一直是 skill 级的，没有这个问题
