# design · cli-publish-source-normalization

## 1 · 规范化规则表（唯一真源）

输入 = `git remote get-url origin` 的原始输出（已 `trim`）。
输出 = 写入 manifest `source` 的字符串，或一个显式错误。

| #   | 输入形式          | 例                                                                         | 输出                                  | 说明                                                                                                                          |
| --- | ----------------- | -------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | SCP-like SSH      | `git@github.com:owner/repo.git`                                            | `https://github.com/owner/repo`       | 主路径。冒号后是 path，不是端口                                                                                               |
| 2   | SCP-like 无 user  | `github.com:owner/repo`                                                    | `https://github.com/owner/repo`       | 同上                                                                                                                          |
| 3   | `ssh://`          | `ssh://git@github.com:22/owner/repo.git`                                   | `https://github.com/owner/repo`       | 丢弃 userinfo + 端口                                                                                                          |
| 4   | `git://`          | `git://github.com/owner/repo.git`                                          | `https://github.com/owner/repo`       | 匿名但明文，统一升到 https                                                                                                    |
| 5   | `git+ssh://`      | `git+ssh://git@host.com/o/r.git`                                           | `https://host.com/o/r`                | 同 3                                                                                                                          |
| 6   | `https://`        | `https://github.com/owner/repo.git`                                        | `https://github.com/owner/repo`       | 只去 `.git` 与尾 `/`                                                                                                          |
| 7   | `https://` 带凭据 | `https://<userinfo>@github.com/o/r.git`（`<userinfo>` 形如 `用户名:令牌`） | `https://github.com/o/r`              | **丢弃 userinfo**——凭据绝不进产物。此处刻意不写成完整字面量：本仓 secretlint 门会把 `用户:口令@主机` 形式判为凭据，而它判得对 |
| 8   | `http://`         | `http://git.internal.example.com/o/r.git`                                  | `http://git.internal.example.com/o/r` | 保留 scheme。护栏是「无凭据可 clone」，http 满足；擅自升 https 会造出连不上的地址                                             |
| 9   | 本地路径          | `/Users/x/repo`、`../repo`、`file:///x`                                    | **错误**                              | 别人 clone 不到                                                                                                               |
| 10  | 无点 host         | `git@my-alias:owner/repo.git`                                              | **错误**                              | 约等于 `~/.ssh/config` 的 Host 别名，还原不了真 host                                                                          |
| 11  | 空 / 无法解析     | `` 、`::::`                                                                | **错误**                              | 既有行为（无 origin）已报错，此处补齐「有 origin 但不可用」                                                                   |

### 为什么 #10 用「host 必须含点」这个启发式

`git@my-alias:owner/repo.git` 里的 `my-alias` 若是 `~/.ssh/config` 的 Host 别名，
规范化成 `https://my-alias/owner/repo` 就是个**看起来对、实际不存在**的地址——
正是本刀要消灭的那类"静默产出坏 URL"。

不联网就无法区分别名与真 host。真实 DNS 主机名几乎总含点，SSH 别名几乎总不含。
**因此：host 不含点 → 报错，不猜。** 代价是 `localhost` 与内网单标签主机也被拒——
它们本来就不满足「陌生人能 clone」，拒掉是对的。

这是一条**刻意选择的启发式**，写在这里以免日后被当成 bug 修掉。
重新考虑它的条件：出现真实的、必须支持的单标签内网 host 场景。

## 2 · 错误必须可操作

不可规范化时返回既有错误码 `SKILL_SOURCE_UNRESOLVED`（不新增错误码——
它的语义「source 无法解析成一个真实可用的来源」本就覆盖此情形），
message MUST 同时含：

- **原始 remote 原文**（否则发布者不知道自己哪配错了）
- **修法**：`git remote set-url origin https://<host>/<owner>/<repo>`

反例（不可接受）：`invalid remote url`。

## 3 · 放在哪

新文件 `packages/cli/src/core/gitRemoteUrl.ts`，导出：

```ts
export function normalizeGitRemoteUrl(remote: string): { url: string } | { error: string }
```

- **纯函数**：不读文件、不跑子进程、不联网。与 `core/` 层「纯」的既有约定一致
- **零外部依赖**：只用字符串处理与 Node 内置 `URL`（SCP 形式 `URL` 解析不了，手写分支）。
  CLI 「构建产物无 node_modules 可运行」的性质不能被破坏
- `skillPublish.ts` 的 `resolveGitSource` 调它；`resolveGitSource` 之外**没有第二处**
  写 `source`，所以这一个接缝就是全部

## 4 · 测试策略

`packages/cli/src/core/__tests__/gitRemoteUrl.test.ts` — 表驱动，覆盖 §1 全部 11 行
（含 4 行错误路径）。

`skillPublish.test.ts` 增两条：

1. **凭据不进产物**：origin 含 token → 产出的 `source` 里搜不到该 token 子串
2. **★ 确定性对照**：同一个 `owner/repo`，一个 repo 的 origin 设成 SSH 形式、
   另一个设成 HTTPS 形式，分别 publish → **两条 entry 的 `source` 字符串相等**

第 2 条才是本刀的判据本身（消灭非确定性），第 1 条是新发现那条缺陷的回归。
既有那条断言 `entry.source === FAKE_REMOTE` 的用例需相应改为断言规范化后的值——
**这是行为变更，不是测试作弊**：旧断言正好锁死了缺陷行为。

## 5 · 真机验收（判据 = 陌生人能 clone）

`agentdock` 仓自己就是活样本：**PUBLIC 仓 + SSH origin**。

```
① 构建 CLI，在本仓库内对一个真实 skill 目录跑 skill publish → 一次性 registry
② cat 产出的 skills.json —— 读内容，不看退出码
   期望 source == https://github.com/fushenguang/agentdock
③ 无凭据 clone 正向：
   GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND=/bin/false git clone --depth 1 <产出的 URL>
   → 必须成功
④ 反向对照（不可省）：同样环境 clone 原始 git@github.com:fushenguang/agentdock.git
   → 必须失败。只验 ③ 无法排除「本来就没问题」
```

> 网络：本机终端默认不走代理，GitHub 可能被挡。需要时
> `export https_proxy=http://127.0.0.1:7897`。**代理只加在 clone 验证这一步**，
> 不进任何代码或配置。

## 6 · 风险与边界

| 风险                                        | 处置                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 私有仓发布者产出 https URL 但陌生人仍装不了 | **不是本刀的问题**：那是「内容在私有仓」，由第二刀（内容搬进公开仓）解决。本刀只保证 URL 形式与凭据无关 |
| 既有 manifest 里的历史 SSH 条目             | Non-goal。重跑 publish 即覆盖（幂等）                                                                   |
| GitHub 以外的 host                          | 规则表按 URL 形式而非 host 白名单工作，天然通用                                                         |
