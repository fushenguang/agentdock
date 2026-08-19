---
roadmap-id: skills-hub-cli
---

# skill-semver-and-author-name

> 触发：2026-08-19 构建者真机验收 `cli-auth` 时，从产出的 manifest 里同时看出两个缺口。

## Why

### 缺口一 · manifest 没有版本，而消费侧早已在按版本判更新

- **Agent Skills 规范里没有 `version`**：`skills-ref` 的 `SkillProperties` 只有 `name` / `description` / `license?` / `compatibility?` / `allowedTools?` / `metadata`，校验器认的顶层键只有 `name`、`description`、`compatibility`。⇒ **在 SKILL.md 顶层写 `version:` 会被判成非规范键**——正是 `lesson-prep` 的 `pipeline` 踩过、逼出 fail-closed 降级方案的那个坑。规范给的逃生舱是 `metadata`。
- **公开仓里的 skill 实际上没有版本**：实测拉取 `thefool-skills` 的三个 `SKILL.md`，`metadata` 里有 `thefool.channel` / `thefool.keywords`，没有任何版本字段。
- **manifest 条目也没有版本**（实测 `skills.json`）。
- **但消费侧已经在按版本比较**：thefoolai 的 `skillManager.compareVersions()` 是点分段数字比较，升级路径完全依赖它；`skills_registry` 里的 `1.0.0` / `1.0.1` 是**手工 seed SQL 填的**。

★ **静默失效实证**（不是推测，是读实现得出的）：`compareVersions` 的解析是 `parseInt(段, 10) || 0`。

| 版本串 | 解析成 | 后果 |
|---|---|---|
| `1.2.0` | `[1,2,0]` | ✅ |
| **`v1.2.0`** | **`[0,2,0]`** | 比 `0.9.9` 还"旧" ⇒ **更新永远不触发，且没有任何报错** |
| `2026-08-19` | `[2026]` | 比任何真版本都"新" ⇒ 永远提示有更新 |

版本现在是自由文本、无人校验。**只要有人写一次带 `v` 前缀的版本，那个 skill 就再也更新不了**——静默的。

### 缺口二 · `author` 只有 id，没有可读名

真机验收产出的条目是 `"author": { "id": "0b317c04-…" }`，没有 `name`。

根因已查实：thefoolai 的 `apps/web/src/server/device-auth.ts:189` 写进 `session_data` 的只有 `access_token` / `refresh_token` / `expires_at`，**没有 `user` 对象** ⇒ CLI 里的 `session.user?.email` 永远是 undefined。**不是**登录方式导致（该账号在 `thefool_user_profile` 里的 `email` 是有值的）。

`id` 才是归属的键，所以这不影响正确性——但一份人看不懂署名的履历，作为"履历局"的产出是不合格的。

## What Changes

1. **manifest entry 增加 `version`**（semver 字符串）。
2. **`publish` 从 `SKILL.md` 的 `metadata` 读版本**，**不读顶层**（读顶层等于鼓励大家写非规范键）。兼容 thefoolai 现有的 `thefool.version` 命名空间键。
3. **semver 门**：提供了版本但形状不合 semver → **publish 失败**，错误信息指出正确形状（fail-closed，与门③许可门、门④来源门同风格）。
4. **`author.name`**：`auth login` 把服务端解析好的可读名存进凭据，`publish` 写进 `author.name`。

## 跨仓依赖（本刀不做，但没有它 `author.name` 落不了地）

thefoolai 的 `POST /api/device-auth/consume`（PR #199）需要在响应里带上服务端解析的 `display_name`（按 `nickname → username → email` 回退）。

**为什么必须由服务端解析**：①身份不该塞进令牌 blob；②CLI 自己查 `thefool_user_profile` 需要 anon key，而那个端点存在的全部意义就是让 CLI 不再持有 key——自己查等于把刚拆掉的依赖装回去。

⇒ 该 delta 在 PR #199 合并后另立一个小 change，本刀的 `author.name` 任务依赖它。

## Non-goals

- **不往 SKILL.md 顶层加任何字段**——规范之外的键一律走 `metadata`
- **不做版本区间 / 依赖解析**：skill 没有依赖图，semver 在这里只用来**排序与比较**，不用来解析约束
- **不改 thefoolai 的 `compareVersions`**：它在收到规范化版本后行为就是对的；要不要顺带加固（拒绝非 semver 输入）由消费侧那刀决定
- **不做 `skills_registry` 的 CHECK 约束**：那是 thefoolai 侧，随索引器那一刀做
- **不回填历史**：现存三个 skill 补版本是内容仓的事，不在 CLI 这一刀

## 待构建者裁决

1. **没有版本的 skill 怎么办？**
   - (a) 拒绝发布（最严，但现存三个 skill 全都没有版本，等于先停摆）
   - (b) **可选但强烈告警**（我倾向）——hub 要容纳别人的 skill，硬性要求会把 fork 用户挡在门外；**但一旦提供就必须是 semver**
   - (c) 缺省填 `0.1.0`（会凭空造出一个不真实的事实，不推荐）
2. **`metadata` 里的键名**：`version`（工具中立，我倾向）还是 `agentdock.version`（命名空间化，但把我们的工具名写进别人的 skill）？

## 验收

- 带 `metadata.version: 1.2.0` 的 skill publish → manifest 条目里有 `"version": "1.2.0"`
- **反向对照（不可省）**：`v1.2.0` / `2026-08-19` / `1.x` / `latest` 一律被拒，且错误信息说清正确形状
- 无版本的 skill → 行为符合上面第 1 条的裁决
- 登录后 publish → `author` **同时有 `id` 与 `name`**
- **反向对照**：未登录 → `author` 字段整个不出现（不是 `null`、不是空对象）
