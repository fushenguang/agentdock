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
- ⚠️ **不自建 SKILL.md 校验器**（上游 PRD 硬护栏）：优先包官方 `skills-ref validate`。**执行时先核实它能否作为库/子进程被调用**；若只能命令行调用且不可靠，再谈退路，**不要默认自己写一个**

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
