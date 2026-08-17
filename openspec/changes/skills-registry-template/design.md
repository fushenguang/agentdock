# design · skills-registry-template

## 1 · 模板的文件清单（从 `web-nextjs` 派生）

`web-nextjs` 去掉 `apps/web/` 后剩 **69 个跟踪文件**，其中可直接继承的是范式件与 docs 骨架。

| 来源                                                                                         | 处置                                                                                                                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` / `.github/copilot-instructions.md`                                              | **改写**——加入「加 skill 不走 openspec」的收窄声明                                                                                          |
| `package.json` / `pnpm-workspace.yaml` / `turbo.json` / `.npmrc` / `.gitignore` / `.vscode/` | 继承，去掉 web 相关 script                                                                                                                  |
| `packages/eslint-config/` / `packages/tsconfig/`                                             | 继承（`next.js` 配置项保留给 docs 用）                                                                                                      |
| `openspec/`                                                                                  | 继承结构，**`config.yaml` 的 context 重写**（收窄适用范围）                                                                                 |
| `roadmap.yaml`                                                                               | 继承（空 buckets + 一条示例）                                                                                                               |
| `apps/docs/**`                                                                               | 继承 Fumadocs 骨架；`content/docs/template/*.mdx`（supabase / alipay / stripe / wechat-pay / drizzle）**全删**，换成 skill 写法与约定的文档 |
| `apps/web/`                                                                                  | **删**                                                                                                                                      |
| `supabase/`                                                                                  | **删**                                                                                                                                      |
| `packages/openspec-docs-sync/`                                                               | **删**——它同步的是 roadmap↔changes，内容仓的主线是 skills↔manifest，不是同一件事。留着会造成「有两套同步、都半懂」                          |
| `pnpm-lock.yaml`                                                                             | 重新生成                                                                                                                                    |

**新增**（模板真正的价值所在）：

```
skills/<name>/SKILL.md          示例 skill ×1（让三道门 day one 就有东西可跑）
skills.json                     manifest（生成物，进 git）
scripts/gates/validate-all.mjs      门①
scripts/gates/manifest-fresh.mjs    门②
scripts/gates/public-boundary.mjs   门③
boundary-rules.json             门③ 的可配置模式表
.github/workflows/gates.yml     三道门的 CI 入口
```

## 2 · 三道门

### 门① · 全量 skill 校验

对 `skills/*` **每一个**目录跑 `agentdock skill validate --json`，任一失败即整体失败。

**为什么是全量而不是只跑改动的**：只跑改动的会漏掉「A 的改动让 B 失效」
（共享约定被改、`skills.json` schema 变化）。skill 数量在可预见的将来是几十量级，
全量跑的成本可以忽略。

### 门② · `skills.json` 新鲜度

CI 把 `skills/*` **全部重新 publish 进一个临时 registry**，再与仓库里已提交的
`skills.json` 对账。

**★ 对账时必须先归一化 `publishedAt`**（构建者裁决 = 甲）：
`publish` 每次都写当前时间戳，逐字比必然永远红。除 `publishedAt` 外的所有字段逐字比，
条目按 `id` 排序后比较（`publish` 按遍历顺序追加，顺序不是语义）。

失败时 MUST 打印**具体差异**（哪个 id、哪个字段、期望 vs 实际），
而不是只说「不新鲜」——一条说不清差在哪的门会被绕过。

### 门③ · 公私边界

该类仓全部公开。对**全部跟踪文件**扫描 `boundary-rules.json` 里的禁止模式：

| 类别           | 例                                                  |
| -------------- | --------------------------------------------------- |
| 私有仓路径     | 宿主私有仓名、`apps/electron-app/` 这类宿主内部路径 |
| 内部域名       | 内网主机名、非公开子域                              |
| 个人可识别模式 | 真实姓名、手机号、身份证式数字串、个人邮箱          |

**规则表必须可配置**（`boundary-rules.json`），因为「什么算私有」因仓而异——
把它硬编码进脚本，第一个使用者就得改脚本。

> 这条门来自实证：2026-08-15 去标识化漏过一次（半脱敏、姓氏仍在）。
> **门的价值不在于它能穷举，而在于它把「记得脱敏」从人的自觉变成机器的检查。**

### ★ 模板不可能预置一个正确的 `skills.json`

`publish` 的 `source` 从**所在仓的 git remote** 推导，所以 manifest 的内容取决于
**使用者把仓建在哪**。模板里那份 `skills.json` 无论写什么都是错的。

处理方式：模板 ship 一份**带显式占位 `source`** 的 `skills.json`，并把
`pnpm skills:sync`（重新生成 manifest + docs 页）定为 **init 之后的第一条命令**，
写进 `README` 与 `getting-started.mdx`。门② 在占位值仍在时失败，
且**失败信息里直接给出该命令**。

> 不这么做的话，使用者 day one 会对着一条说不清缘由的红 CI 猜。
> **把不可避免的手动步骤变成「文档 + 门共同指出的显式动作」，比假装它不存在好。**

## 3 · 门用 `.mjs` 而不是 TS

三个门脚本是 **纯 Node ESM `.mjs`**，CI 直接 `node scripts/gates/*.mjs` 跑。

理由：门必须**零构建步骤**就能跑。用 TS 就要 `tsx`/编译，等于给「一个内容仓」
装上一条构建链——而内容仓的贡献者可能只是想加一个 markdown 文件。
门越轻，越不会被绕过。

代价：没有类型检查。接受——三个脚本各百行量级，输入是 JSON 与文件路径。

## 4 · CLI 依赖怎么钉

门① / 门② 都要 `agentdock skill validate|publish`。

- `@cogito.ai/cli` 作为 **devDependency 钉版本**，CI 用 `pnpm exec agentdock`
- **不用 `npx -y @cogito.ai/cli@latest`**：latest 会让门的行为随上游发版漂移，
  某天 CI 突然红/绿而仓库一行没改——这正是"生成文件漂移"的同构问题
- 版本要求 **≥ 修好 `source` 规范化的那个版本**（本 epic 第一刀，PR #31）。
  钉版本时若该版本尚未发到 npm，**必须在 tasks 里显式等它发布**，不得先用旧版凑

## 5 · openspec 收窄怎么落地

不是靠 `AGENTS.md` 写一句「加 skill 不用写 proposal」就算数（那是口头约定，会被 AI 忽略）。
落地方式：

1. `openspec/config.yaml` 的 `context` 明写适用范围：**只管基建/契约变更**
   （manifest schema、校验规则、站点结构），并列出反例：「加一个 skill 不走 openspec」
2. `AGENTS.md` 用一张表给出「什么走 openspec / 什么只走两道门」的判据
3. `roadmap.yaml` 保留（方向仍需人类拥有），但**加 skill 不需要 roadmap 条目**

> **为什么这条重要**：`openspec` 是为产品代码库设计的。原样套到内容仓上，
> 贡献一个 skill 要先写 proposal——**直接劝退贡献，包括劝退我们自己**。
> 门要装在「会出事的地方」（manifest 漂移、公私边界），不是装在「加内容」这个高频动作上。

## 6 · 目录索引 = 生成的 docs 页

`skills.json` → `apps/docs/content/docs/skills/*.mdx` + `meta.json`，由
`scripts/gen-skill-docs.mjs` 生成，**新鲜度并入门②**（同一条门检两个生成物）。

不做独立浏览 UI：避免维护两套渲染，也避免"以后要不要做 web 界面"这个问题反复回来。

## 7 · 不在本刀的事

建 `fushenguang/thefool-skills` 仓、搬 13 个 skill、部署 `skills.app.fujia.site`——
那是模板的**消费**，属 thefoolai 侧动作，且必须等 PR #31 合并并发版之后。
本刀只交付模板 + 三道门，并**在模板自身的 CI 里真跑一遍这三道门**（否则交付的是没验过的门）。
