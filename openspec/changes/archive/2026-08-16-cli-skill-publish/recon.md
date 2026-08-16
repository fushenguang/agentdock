# recon · cli-skill-publish 阶段 0 排雷

> 本文件是 `tasks.md` 阶段 0 四条的结论记录。**每节的「证据」字段必须是命令+输出摘录或 `file:line`**，
> 不接受"经确认""已核实"这类无原始输出支撑的断言。拿不到证据的写「未取得证据」+ 卡点。

执行日期：2026-08-14 · 分支 `feat/cli-skill-publish-recon`

---

## 0.1 官方校验器可调用性

**结论**：**(a) 可作库 import**。`skills-ref`（npm，v0.1.5，Agent Skills 规范官方参考实现）
同时提供 ESM 库导出与 CLI bin，二者共用同一份 `validate()`。

**JSON 输出**：`validate` 子命令**无** JSON 模式（纯文本到 stderr）。但这不重要——
库路径直接拿到 `Promise<string[]>`，序列化由我方决定。

**退出码语义**：`validate` → 0 通过 / 1 有校验错误（含"路径不存在"）。

**⚠️ 关键限制（决定 §3 写法）**：`validate()` 返回的是**纯字符串数组**，
**不带 `code` / `field` / `kind` 等结构化分类**。产生"未知顶层键"错误的
`validateMetadataFields()` 是**模块内部函数，未导出**。

**证据**：

包的实际导出字段（`node_modules/skills-ref/package.json`）：

```json
"type": "module",
"main": "./dist/index.js",
"types": "./dist/index.d.ts",
"exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
"bin": { "skills-ref": "dist/cli.js" }
```

公开 API 签名（`node_modules/skills-ref/dist/validator.d.ts` 原文）：

```ts
export declare function validateMetadata(
  metadata: Record<string, unknown>,
  skillDir?: string,
): string[]
export declare function validate(skillDir: string): Promise<string[]>
```

内部实现（`node_modules/skills-ref/dist/validator.js:118-126` 原文，注意 `validateMetadataFields` 无 `export`）：

```js
/** Validate that only allowed fields are present. */
function validateMetadataFields(metadata) {
  const errors = []
  const extraFields = Object.keys(metadata).filter((k) => !ALLOWED_FIELDS.has(k))
  if (extraFields.length > 0) {
    errors.push(
      `Unexpected fields in frontmatter: ${extraFields.sort().join(', ')}. Only ${[...ALLOWED_FIELDS].sort().join(', ')} are allowed.`,
    )
  }
  return errors
}
```

**对真实验收样本 `lesson-prep` 的实跑**（编排者亲自复跑，非子代理转述）：

```
$ node node_modules/skills-ref/dist/cli.js validate \
    .../thefoolai/apps/electron-app/SKILLs/lesson-prep
Validation failed for .../SKILLs/lesson-prep:
  - Unexpected fields in frontmatter: pipeline. Only allowed-tools, compatibility, description, license, metadata, name are allowed.
exit=1
```

**副产品**：规范允许的顶层键全集由校验器自己吐出——
`allowed-tools` / `compatibility` / `description` / `license` / `metadata` / `name`。
这坐实了 0.3 表中 `metadata` 为规范键（原标「待坐实」）。

**未取得证据**：未穷举全部错误消息文案（只跑了合规样本、缺失路径、`lesson-prep` 三例）。
若后续需要完整错误清单，须逐条读 `dist/validator.js` 的规则，另开任务。

---

## 0.2 新增 subCommand 的既有约定

**1 · mode detection —— 每个命令 `run()` 里自己算，无共享中间件**

判据 `args.silent || args.json || !isTTY`，adapter 用 `await import()` 懒加载。

**证据**：`packages/cli/src/commands/init.ts:45-63`

```ts
const isTTY = Boolean(process.stdout.isTTY)
const isAgentMode = args.silent || args.json || !isTTY
if (isAgentMode) {
  const { runAgentAdapter } = await import('../adapters/agent.js')
  ...
```

与 `openspec/specs/cli-runtime/spec.md:9-10` 一致。新 `skill` 命令须照抄这段判定。

**2 · 错误码 —— core 产出带 `error: '<CODE>'` 的对象，adapter 统一渲染**

⚠️ **两种传递方式并存**，新命令须先选定：`core/version.ts` 用 `throw`；
`core/scaffold.ts` 用**返回值**（`ScaffoldError`），并在 `scaffold.ts:157-165` 用
`try/catch` 把前者的 throw 转成同一形状的返回值。

**证据**：`core/version.ts:40-53`（throw 形态）

```ts
const err: VersionOutdatedError = {
  ok: false,
  error: 'CLI_VERSION_OUTDATED',
  context: { cli_version: cliVersion, min_required: minCliVersion, template: templateId },
  suggested_action: 'npm install -g @cogito.ai/cli@latest',
}
throw err
```

渲染出口：`adapters/agent.ts:19-23` 的 `emit()`。

**3 · `core/*` 保持纯 —— ⚠️ 只有约定与测试，无 lint 强制**

`openspec/specs/cli-runtime/spec.md:93-105` 是 MUST 级要求，但
`eslint.config.js` 中**不存在**针对 `core/` 的 `no-console` / `no-process-exit` 规则
（唯一相关项是 `eslint.config.js:31-35` 为 `scripts/**/*.ts` **关闭** `no-console`）。

**证据**：`grep -rn "process.exit" packages/cli/src` 命中全部落在 `adapters/*.ts`，
`core/*.ts` 零命中；`core/__tests__/core.test.ts:47-55` 断言返回对象的 `error` 字段而非 stdout。

> **推论**：写 `core/skill*.ts` 时**没有任何工具会提醒你写了 `console.log`**，须自守。
> 这是一个可以变成门禁的点（见末尾待办）。

**4 · `main.ts` 挂载 —— citty `defineCommand` + 静态 import**

**证据**：`packages/cli/src/main.ts:1-16`

```ts
export const main = defineCommand({
  meta: { name: 'agentdock', description: '...', version: VERSION },
  subCommands: { init: initCommand, mcp: mcpCommand },
})
```

⚠️ **本刀需要嵌套子命令**（`skill validate` / `skill publish`），而 `init` / `mcp`
**都是叶子命令，仓库内无嵌套先例可抄**。citty 支持嵌套，但这一层要新写。

---

## 0.3 真实样本 frontmatter 实况

**样本**：`.../thefoolai/apps/electron-app/SKILLs/lesson-prep/SKILL.md`

**证据**（`SKILL.md:1-31` 原文全文，未转述）：

```yaml
---
name: lesson-prep
description: 语文备课助手——依据付老师的真实备课流程，围绕中考高频考点、引导式教学设计与情境搭桥，端到端输出可执行的教案 PPT（.pptx）。
metadata:
  thefool.channel: official
  thefool.keywords:
    - 备课
    - 教案
    - 语文
    - 中考
    - 课件
    - PPT
    - 阅读理解
    - 散文
    - 诗歌
    - 小说
    - 初中
# ⚠️ pipeline 原样保留在顶层，不迁入 metadata（skills-metabolism design.md §4：L3 sidecar
# 契约已 DEFER，且这是三处运行时路径按活跃 skill 查 post_processor 的真实依赖）。
# 这个 skill 因此无法通过官方 skills-ref validate（pipeline 不在 spec 允许的顶层键内），
# 这是已知且显式接受的代价，不是遗漏。
pipeline:
  post_processor: md2pptx
  requires_review: true
  output_format: markdown
  resources:
    - type: template
      category: ppt
      required: false
      user_selectable: true
---
```

### 逐键标注

| 键                          | 位置             | 归类                                 | 依据                          |
| --------------------------- | ---------------- | ------------------------------------ | ----------------------------- |
| `name`                      | `SKILL.md:2`     | 规范顶层键                           | 0.1 校验器输出的 allowed 列表 |
| `description`               | `SKILL.md:3`     | 规范顶层键                           | 同上                          |
| `metadata`                  | `SKILL.md:4`     | 规范顶层键（容纳宿主约定的官方口袋） | 同上                          |
| `metadata.thefool.channel`  | `SKILL.md:5`     | **宿主私有约定**（已正确内嵌）       | `thefool.` 前缀               |
| `metadata.thefool.keywords` | `SKILL.md:6-17`  | **宿主私有约定**（已正确内嵌）       | `thefool.` 前缀               |
| `pipeline`                  | `SKILL.md:22-30` | ⚠️ **非规范顶层键，刻意保留**        | 0.1 实跑证实被拒              |

### ★ 关键发现：验收样本与验收标准冲突（已由实跑坐实）

`SKILL.md:18-21` 的注释预言「无法通过官方 skills-ref validate」——**0.1 实跑证实为真**，
且 `lesson-prep` **有且仅有这一条错误**，正落在"未知顶层键"这一类。

它与本 change 三处规定冲突：

1. `tasks.md` 3.1 —— 拿 `lesson-prep` 真跑 validate + publish（唯一指定真实样本）
2. `design.md` §6 验收硬要求 1 —— 同上，且强调「不是构造的假目录」
3. `design.md` §1 —— `publish` 内部先跑 `validate`，**不通过不产出**

即：**唯一指定的验收样本，恰是官方校验器会拒的那一个。**

`design.md` §3 的「非 spec 顶层键 v0 只报告不强制」是预备解法，但 0.1 证明
**校验器不提供错误分类**（返回纯字符串、分类函数未导出），因此"降级某一类错误"
无法通过公开 API 直接表达。§3 的具体写法成为真实决定点 —— 见下方开放决策。

---

## 0.4 错误码与 exit code 实况

| 错误码                 | 定义/抛出处                                                              | 实际 exit code       | 证据                                    |
| ---------------------- | ------------------------------------------------------------------------ | -------------------- | --------------------------------------- |
| `CLI_VERSION_OUTDATED` | `core/version.ts:44`（throw）；`core/scaffold.ts:162`（catch 转 return） | **1**                | `adapters/agent.ts:97-99`               |
| `TARGET_DIR_EXISTS`    | `core/scaffold.ts:171`                                                   | **1**                | 同一出口 `agent.ts:97-99`               |
| `SCAFFOLD_FAILED`      | `core/scaffold.ts:208`                                                   | **1**                | 同上                                    |
| `TEMPLATE_NOT_FOUND`   | `adapters/agent.ts:61`；`adapters/mcp/tools.ts:79,114`                   | **1**（CLI 路径）    | `agent.ts:67` 紧跟 `process.exit(1)`    |
| `MISSING_ARG`          | `adapters/agent.ts:40,50`                                                | **1**                | `agent.ts:46,56` 各自 `process.exit(1)` |
| `UNKNOWN_ERROR`        | **未取得证据** —— 全仓库 grep 零命中，spec 表中有但代码从未抛出          | 不适用（无代码路径） | —                                       |

MCP 路径（`adapters/mcp/*`）的错误走 JSON-RPC 风格返回体（`isError: true`），
进程不退出，exit code 概念在该路径不适用（`mcp/server.ts:75-83` 仅 SIGINT/SIGTERM 走 `exit(0)`）。

**漂移核实结论：属实。**

- spec 声称：`openspec/specs/cli-runtime/spec.md:76` 与 `:89` 两处均写 `CLI_VERSION_OUTDATED` → exit **2**
- 代码实际：`adapters/agent.ts:81-99` 对 `result.error` **无任何特判**，`if (!result.ok) process.exit(1)` 一律 1
- 佐证：`grep -rn "exit(2)\|exitCode" packages/cli/src --include="*.ts"` **零命中**

**本刀不修此漂移**，但新增错误码**不得跟着错**：新码的 exit code 语义须与代码实况一致，
或在本刀显式声明其取值。

---

## ★ 开放决策（阻塞阶段 1，需构建者裁决）

**问题**：`design.md` §3 要求"非 spec 顶层键只报告不强制"，但官方校验器不给错误分类。
两条可行路径：

**甲 · 匹配消息前缀降级**（推荐）
拿 `validate()` 的 `string[]`，把匹配 `"Unexpected fields in frontmatter:"` 的那条降级为
warning，其余一律硬失败。

- 代价：耦合 skills-ref v0.1.5 的**消息文案**
- ★ **但它 fail-closed**：上游若改文案，我方匹配失效 → 该错误**退回硬失败** → `publish` 拒绝
  lesson-prep。是"过严"而非"放行坏 skill"。配一条钉住文案的单测，让上游改动**响亮地红**
- 规则判定权仍完全在 skills-ref，我方不复制任何规则 → **不触碰"不自建校验器"护栏**

**乙 · 硬编码 allowed 键集后剥离再校验**

- 代价：**这就是复制了一条规范规则**（哪些键合法），已擦到护栏边上；且规范新增键时
  **fail-open**（我方剥掉了本该合法的键，静默放行）。**不推荐**

我的建议：**走甲**，并把「非规范顶层键」在 `publish` 时**显式列进 manifest 条目的一个字段**，
让下游（thefoolai 索引层）能看见这个 skill 带着私有扩展，而不是被悄悄咽掉。

---

## 待办（本刀不处理，仅登记）

- [ ] `pipeline` 顶层键的长期去向依赖 `skills-metabolism` 的 L3 sidecar 契约（已 DEFER）。
      注释声称它是「三处运行时路径按活跃 skill 查 `post_processor` 的真实依赖」——
      **该"三处"未在本次排雷中核实**（不在 0.3 范围内），后续若要迁移需先坐实。
- [ ] `core/*` 纯度（spec MUST 级）**无 lint 强制**，仅靠约定+测试。可考虑加一条
      针对 `core/**` 的 `no-console` / `no-process-exit` ESLint 规则，把纪律变成门禁。
- [ ] `UNKNOWN_ERROR` 在 spec 错误码表中存在但代码从未使用——spec/code 漂移第二例。
- [ ] `CLI_VERSION_OUTDATED` 的 exit 2 vs 1 漂移（0.4 已坐实），本刀不修。
- [ ] **`core.test.ts > scaffolds web-nextjs` 在本机超时**（2026-08-14 阶段 1 复核时撞见）。
      **不是坏测试，是被本地残留拖慢**——证据链：
      ① 放宽 `--testTimeout=180000` 后 **18/18 全过**，纯超时非断言失败；
      ② `templates/web-nextjs` 本地 **1.6G**，但 `git ls-files` 只跟踪 **219 个文件**、
      `node_modules` **零跟踪**（时间戳 Jun 9）——那 1.6G 是本机跑过 install/build 的残留；
      ③ `pnpm-workspace.yaml` 只含 `packages/*` / `apps/*`，**`templates/` 不在 workspace**，
      本次 `pnpm install` 碰不到它；④ `core.test.ts` 本次未被修改。
      故与 `cli-skill-publish` 无因果关系，且 **CI 全新 checkout 上大概率不复现**。
      修法方向（本刀不修）：`scaffoldProject` 拷贝时排除 `node_modules`/`.next`/`.turbo`
      （构建脚本的 rsync 已经这么做了，测试路径没有），或单独提高该用例 timeout。
      ⚠️ 真正的隐患是**它在本机红、在 CI 绿**——这类"环境相关的红"会训练人忽略红灯。
- [ ] **验收六条第 4 条「`pnpm format` 无残留 diff」在仓库范围内不可能通过**
      （2026-08-14 阶段 3 验收时撞见）。实测：`npx prettier --list-different "**/*.{ts,tsx,md}"`
      命中 **101 个文件**，且**全部是 git 跟踪的**（非本地残留——曾误判为残留，已证伪：
      仅 8 个在 `templates/` 下，93 个在别处，多为 `.claude/commands/opsx/*.md` 这类
      vendored 文件）。本刀相关的 10 个文件 **prettier-clean**，已单独核实。
      ⚠️ **一道不可能通过的门，实际效果等于没有门**——每个执行者都得自己判断"哪些 diff
      算我的"，而这判断没有记录、无法复核。这比"门是红的"更危险。
      修法方向（本刀不修）：要么一次性 `pnpm format` 全仓库归零并设 CI 门禁守住，
      要么把该条验收改为**只校验本次改动涉及的文件**（`--list-different` 配 git diff 文件名）。
