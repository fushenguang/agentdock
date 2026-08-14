# design · cli-skill-publish

> 依据 `proposal.md`。**registry 形态（§2）与"不推送"（§4）是两条硬边界，不接受"顺手做了"。**

---

## 1 · 命令面（最小）

| 命令                                              | 输入                                     | 产出                                       |
| ------------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| `agentdock skill validate <dir>`                  | 一个 skill 目录                          | 校验结果（通过 / 逐条问题）                |
| `agentdock skill publish <dir> --registry <path>` | skill 目录 + 本地 registry 仓库 checkout | manifest 条目写入该 checkout，**到此为止** |

`publish` 内部先跑 `validate`，不通过不产出。

**双模**：遵既有 `cli-runtime` spec 的契约——`--json`/`--silent`/非 TTY 走 agent adapter，输出 `{ok:true,...}` 或 `{ok:false,error:<CODE>,message,...}`；否则走 human adapter（`@clack/prompts`）。

**core 层必须纯**（既有硬要求）：`core/*` 不写 stdout、不 `process.exit`，渲染决策全部在 adapter。

## 2 · ★ registry 形态：git manifest，零后端

```
skill 内容  →  永远在 git（任何人可 clone，别家 Agent 直接装）
manifest   →  只存索引：id / source(git URL) / version / name / description / …
后端       →  本 CLI 不知道它存在
```

**为什么这条不能松**：`@cogito.ai/cli` 是**发到 npm 给所有人用的独立包**。一旦它写某个宿主的私有数据库，它就只对那个宿主有意义——而 skill 作为可移植资产的全部价值就没了。

> 上游 thefoolai 有一张 Supabase `skills_registry` 表。**那是它自己的索引层。** 把 manifest 索引进去是它的事，**本 CLI 不参与、不感知**。

**manifest 的 schema 借形不借码**：本仓库既有的 `src/registry.json`（模板注册表）可以借鉴字段形状（`id`/`source`/`minCliVersion` + semver 门），但**它的加载代码写死了"内容打包在 CLI 包内"的本地路径**，与"指向外部 git 仓库"的形态不匹配，**不复用其实现**。

## 3 · 校验做到什么程度（v0）

**原则：校验它是不是一个结构合法的 skill，不评判它好不好。**

- `SKILL.md` 存在、frontmatter 可解析
- Agent Skills spec 的必需字段齐全
- 非 spec 顶层键的处理：上游 thefoolai 的 L2 合规约定是迁进 `metadata:` 并加前缀（如 `thefool.channel`）。**v0 只报告不强制**——强制某个宿主的私有约定，又是一次反向依赖
- ⚠️ **不自建 SKILL.md 校验器**（上游 PRD 硬护栏）：优先包官方 `skills-ref validate`。~~执行时先核实它能否作为库/子进程被调用~~ → **已核实，见 `recon.md` 0.1**

### 3.1 ★ 阶段 0 排雷后的定案（2026-08-14，构建者裁决）

**校验器可用性**：`skills-ref` v0.1.5 **可作库 import**，`validate(dir): Promise<string[]>`。
护栏满足——规则判定权完全在官方实现，我方不复制任何规则。

**但它不给错误分类**：返回纯字符串数组，产生"未知顶层键"错误的
`validateMetadataFields()` 是模块内部函数、未导出（`validator.js:118-126`）。
因此「只报告不强制」无法通过公开 API 直接表达。

**裁决 = 方案甲（匹配消息前缀降级）**：

```ts
const errors = await validate(dir) // string[]
const UNKNOWN_KEY = 'Unexpected fields in frontmatter:'

const warnings = errors.filter((e) => e.startsWith(UNKNOWN_KEY))
const hard = errors.filter((e) => !e.startsWith(UNKNOWN_KEY))

if (hard.length) return { ok: false, error: 'SKILL_INVALID', errors: hard }
return { ok: true, warnings }
```

**为什么是它**（被否方案见 `recon.md` 开放决策节）：

1. **不触碰护栏**——我方零规则复制，只是给官方判定结果分档
2. ★ **fail-closed**——上游若改文案，匹配失效 → 该错误**退回硬失败** → `publish`
   拒绝 lesson-prep。失败方向是"过严"，不是"放行坏 skill"。
   被否的方案乙（硬编码 allowed 键集）恰好相反：规范新增键时**静默放行**
3. **配一条钉住消息文案的单测**，让上游改动**响亮地红**，而不是静默失效

**附带要求**：`publish` 时把降级掉的非规范顶层键**显式写进 manifest 条目的一个字段**，
让下游索引层看得见"这个 skill 带私有扩展"，而不是被悄悄咽掉。

### 3.2 前置门实证：skills-ref 可内联进单文件 bundle（2026-08-14）

新增 `skills-ref` 是本 CLI 的**第一个真正外部依赖**，直接威胁「单文件 bundle、零 node_modules
可跑」这一属性——而该属性正是 `agentdock-cli-embed`（thefoolai #2）成立的基础。故把
`tasks.md` 3.4 的冒烟**从阶段 3 验收提前为阶段 1 开工前置**：最可能推翻方案的条件必须最早失败。

**实证**（一次性探针 import `validate` 后单独打包，验完即删）：

```
Bundled 8 modules → probe.js 106.85 KB
目录内容：.  ..  probe.js        ← 零 node_modules
$ node probe.js <合规 skill>      → {"errors":[]}
$ node probe.js <lesson-prep>     → {"errors":["Unexpected fields in frontmatter: pipeline. ..."]}
```

结论：**通过**。`skills-ref` 依赖面为 `js-yaml`(+`argparse`) 纯 JS；`commander` 仅被其
`cli.js` 使用，走库路径（`index.js`）不会被拖入。

> ⚠️ **过程教训**：首次只跑 `pnpm build` 就得到绿——但当时**尚无任何源码 import
> `skills-ref`**，bundle 里根本没有它，那个绿什么都不证明。门必须**真正 import 后再打包**才成立。
> 与 epic-planning「绿检查在你知道它覆盖什么之前什么都不证明」是同一类错误。

### 3.3 core 错误传递形态定案：**返回值**

仓库内两种并存：`core/version.ts` 用 `throw`，`core/scaffold.ts` 用返回值
（`scaffold.ts:157-165` 再把前者的 throw 转成返回值）。

**本刀新增的 `core/skill*.ts` 一律用返回值形态**，理由：

1. 与 `scaffold.ts` 一致——它才是同类物（命令的顶层 core 入口，产出带结构化错误的结果）
2. `throw` 一个非 Error 对象本身别扭，且迫使每个调用点包 try/catch
3. `validate` 的正常输出本就含 `warnings`（非错误），返回值天然容纳，throw 表达不了

> **背景**：唯一指定的验收样本 `lesson-prep` 顶层带 `pipeline`（刻意保留，见 `recon.md` 0.3），
> 实跑证实被官方校验器拒，且**有且仅有这一条错误**。方案甲使 `tasks.md` 3.1
> 「真跑 validate + publish」重新可满足。

## 4 · ★ 不推送：v0 只写本地 checkout

本仓库 `.claude/CLAUDE.md` 的「必须暂停确认」清单包含**发布到 registry**。

`publish` 的终点是「**条目已写进你指定的本地 registry 仓库**」，随后由人 review → commit → PR。

**这不是偷懒，是三个收益叠加**：

1. 满足「暂停确认」约束
2. **CLI 不需要持有任何凭据**（无 token 管理、无泄露面）
3. registry 仓库的既有 review 流程天然成为发布门禁

## 5 · 明确不做

- ❌ `eval` / 质量评估（上游已 DEFER）
- ❌ 任何后端调用
- ❌ 自动 push / PR 创建
- ❌ 改 `init` / `mcp`；不动模板 registry 的代码
- ❌ 安装侧、交易侧（都在 thefoolai）

## 6 · 验收硬要求

按本仓库**验收六条**：`pnpm install` / `pnpm check-types` / `pnpm build` / `pnpm format`（无 diff）/ `openspec validate cli-skill-publish` / 无密钥。

外加：

1. **`skill publish` 的产出是一个真实可用的 manifest 条目**——用 thefoolai 的 `lesson-prep` 真实跑一次，而不是构造的假目录
2. **CLI 仍然零外部依赖**：改完后重跑「拷 `dist/` 到无 node_modules 空目录能跑通」的冒烟（该结论是针对某次 build 的实证，新增命令可能引入新依赖）
3. `align:check` 全绿（尤其 orphan-change 与 Non-goals 两条硬失败）
