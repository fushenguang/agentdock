---
roadmap-id: skills-registry-template
---

# skills-registry-template

> 本刀是 thefoolai `skill-commerce-loop` 子roadmap 收尾两刀的第二刀在本仓库的落点。
> 首个使用者是 `fushenguang/thefool-skills`（部署 `skills.app.fujia.site`），
> 但模板本身通用。
> 上游 PRD：thefoolai `apps/wiki/content/docs/prd/skill-commerce-loop.mdx` §4.1.2 / §4.1.3

## Why

**做好的 skill 现在能发布了（`skill publish`），但没有地方可发。**

`publish` 的产物是一条 manifest 条目，要写进「一个 registry 仓的 checkout」——
**那个仓不存在**。这是 skills-hub 方向上唯一剩下的结构性缺环。

而且它不是「随便建个仓就行」：`publish` 的 `source` 从**所在仓的 git remote** 推导
（`skillPublish.ts`），所以**公开仓必须物理持有正典内容**才能产出可匿名安装的 manifest。
这条把「搬 vs 镜像」定死为：**公开仓是正典，宿主单向 vendor**（PRD §4.1.3）。

### 为什么做成模板而不是直接手搓一个仓

「建一个 skill hub」需要的东西对任何人都一样：内容目录约定、一份 manifest、
一个说明写法的 docs 站、以及**防止 manifest 与内容漂移的门**。手搓一次是一次性劳动；
做成模板，`agentdock init` 就能给任何人一份带门的起点——这正是本平台在做的事。

## What

新增 `templates/skills-registry/`，由 `web-nextjs` 派生，三处刻意不同：

1. **去掉 `apps/web`**（营销站）——只留 `apps/docs`（Fumadocs）
2. **去掉 `supabase/`**——skills-hub 的可移植性铁律明确不用它
3. **`openspec` 收窄适用范围**：只管基建/契约变更（manifest schema、校验规则、站点结构），
   **不管「加一个 skill」**。加 skill 的门只有两条：`skill validate` 通过 + PR review

### ★ 模板的价值在三道门，不在脚手架

脚手架谁都能拼。这个模板真正提供的是**三道 day-one 就装上的 CI 门**：

| 门                     | 内容                                                                   | 来源                                                      |
| ---------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| ① 全量 skill 校验      | 每个 PR 对**全部** skill 跑 `agentdock skill validate`，不是只跑改动的 | 只跑改动的会漏掉「A 的改动让 B 失效」                     |
| ② `skills.json` 新鲜度 | CI 重新生成 manifest 并对账，不一致即失败                              | **实证**：2026-08-15/16 一轮里生成文件漂移咬了三次        |
| ③ 公私边界             | 禁止私有仓路径 / 内部域名 / 个人可识别模式                             | **实证**：2026-08-15 去标识化漏过一次（半脱敏但姓氏仍在） |

②③ 来自实证教训，不是设想。**day one 建门比事后补便宜一个数量级。**

### 目录约定

```
skills/<name>/SKILL.md      ← 正典内容（短而稳的路径，会进 manifest 的 path）
skills.json                 ← 根目录一份 manifest（生成物，进 git）
apps/docs/                  ← Fumadocs；skill 目录页由 skills.json 生成，不做独立浏览 UI
scripts/gates/*.mjs         ← 三道门
```

## ⚠️ 设计期发现的硬阻塞（已裁决）：门② 差点建不起来

`skillPublish.ts:177` 每次 publish 都写 `publishedAt: new Date().toISOString()`。
因此**重新生成 manifest 必然产出不同的 `publishedAt`**——
「CI 重新生成并逐字对账」这条门若逐字比，**永远红**。

这不是模板能绕开的，它是 CLI 侧的行为。三个选项摆给构建者：

| 选项                             | 做法                                                 | 代价                                                  |
| -------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| **甲（构建者已选，2026-08-16）** | 门② 对账时**归一化掉 `publishedAt`** 再比            | 门不覆盖 `publishedAt` 字段；实现全在模板侧，不动 CLI |
| 乙                               | 改 CLI：内容未变时**保留原 `publishedAt`**（真幂等） | 更正确，但属 CLI 行为变更，需另立 roadmap 条目        |
| 丙                               | 门② 只查集合一致，不比字段                           | 最弱，漏掉「描述改了没重新生成」这类漂移              |

**裁决 = 甲。** 门② 除 `publishedAt` 外的所有字段逐字对账。

> 乙**没有被否，只是没被选**：`publish` 的 spec 已写「重复发布是幂等的」，
> 而「每次都改 `publishedAt`」是字面满足、实质不满足。若日后要做，另立 roadmap 条目。
> 记在这里以免它被这次「选了甲」误读成已解决。

## Non-goals

- ❌ **不建 `fushenguang/thefool-skills` 仓本身**——那是本刀的**消费者**，属 thefoolai 侧动作。
  本刀只交付模板 + 三道门。
- ❌ **不做独立的 skill 浏览 UI**——由 `skills.json` 生成 docs 页即可，避免维护两套渲染。
- ❌ **不做 skill 的安装/消费侧**，不做交易/授权/eval。
- ❌ **不改 `skill validate` / `skill publish` 的行为**（含上面的选项乙——若采纳，另立条目另开一刀）。
- ❌ **不做部署**（`skills.app.fujia.site` 的 Dokploy 配置属使用者侧）。
- ❌ **不动 `web-nextjs` / `game-web-phaser` 两个既有模板**。
- ❌ **不做多语言 docs**（`web-nextjs` 的 docs 本就是单语言，不在本刀扩展）。
