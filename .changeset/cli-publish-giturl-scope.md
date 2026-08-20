---
'@cogito.ai/cli': minor
---

`skill publish` 索引进 registry 时现在会带上 skill 在仓库内的 `path` 与所在 `branch`，
让服务端能拼出 skill 级的 `git_url`，而不再是仓库根 URL。

**这修的是一个真实的付费绕过**：registry 之前只存到仓库根 URL，安装门用它下载时会把
该仓库下**全部** skill 一起装下来——在一个多 skill 仓库里装一个免费 skill，会连同仓库里
的付费 skill 一起被装进去（thefoolai 侧已先上线止血）。

- 请求体新增 `path?`（镜像 manifest 条目自身的 `path` 字段，skill 在仓库根目录时省略）
  与必填的 `branch`（`git branch --show-current`，取不到时回退 `main`）
- 索引失败时的报错更可操作：非 2xx 响应会读服务端 JSON body 的 `message`，不再折叠成
  裸的 `HTTP <status>`；拿不到有效信息时才退回"升级到最新 CLI"的提示

**未变化的行为**：未登录仍不发索引请求；索引请求失败仍只告警、不阻塞不回滚已经写好的
manifest；老服务端目前按固定字段读 body、没有"未知字段拒绝"逻辑，会直接忽略新增的
`path`/`branch`，因此这是纯新增字段、不影响现有 publish 流程。
