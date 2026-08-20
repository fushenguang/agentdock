---
'@cogito.ai/cli': minor
---

`skill publish` 现在始终打印解析出的 `source`/`path`，并在 skill 自己所在仓库与
`--registry` checkout 的 `origin` 不一致时大声告警；`publishSkill()`/`--json`
输出相应新增 `registrySource` / `sourceRepoDiffersFromRegistry` 字段。

**起因是一次真实的踩坑**：`entry.source`/`entry.path` 一直来自 skill 自己所在的 git
仓库（其 `origin` remote），而不是 `--registry` 指向的仓库——这个行为本身没变，但此前
输出对此只字不提。一次从私有仓库发布、`--registry` 指向公开内容仓的真实操作，因此
写出了一条 `source` 指向私有仓库的 manifest 条目，装的人会在 `git clone` 那一步失败，
私有仓库地址也就此进了一份公开文件——而人类可读输出和 `--json` 都没有任何信号能看出
这一层。

- 人类/agent 两种输出模式都新增一行 `source: <url> (path: <path>)`，无论是否与
  `--registry` 一致都会打印
- 当 skill 自己仓库的 `origin` 与 `--registry` checkout 自己的 `origin` 不同（且两者都
  能解析出）时，额外打印一条醒目告警——这是告警，不是拦截：从私有/无关仓库发布 skill
  仍然是合法场景
- `SkillPublishResult` 新增 `registrySource?: string`（`--registry` checkout 自己
  解析出的 `origin`，仅在能解析出时出现）与 `sourceRepoDiffersFromRegistry?: boolean`
  （仅在 `registrySource` 同时存在时出现，避免"解析不出"被误读成"确认一致"）
- 刻意不检测"这个仓库是不是私有"——那需要联网请求与鉴权，不可靠；只把解析出的
  `source` 摆出来，判断留给发布者自己

**未变化的行为**：`source`/`path` 的来源和取值逻辑本身没有任何改动，这次只是让已有
行为对用户可见；manifest 写入、索引请求的时机与条件均未触碰。
