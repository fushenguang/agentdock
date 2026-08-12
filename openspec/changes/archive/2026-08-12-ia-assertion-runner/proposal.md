---
roadmap-id: game-web-phaser-template
---

# ia-assertion-runner

> 上游需求来自 cogito-lib 的 `/game-studio` 框架[阶段二 · 建验证层](https://github.com/fushenguang/cogito-lib)
> **第 5 行 IA**——那一行今天标着 🟡「只完成一半」。上一刀
> （`game-template-verification`）的 Non-goals 表第一行把运行器切出去时写的原话是
> 「运行器要吃 `jump` 作驱动器——本刀先把 `jump` 交付出来，运行器归下一刀」。
> **本刀就是那下一刀。**

## Why

上游 web 侧（cogito-lib change `acceptance-assertion-templates`，2026-08-09 归档）已经把
验收项从「自由文本 + 一个标记」改成了「7 个断言模板 + 参数」，并在类型上强制
`kind: 'machine'` 必须带 `templateId`。它自己的文档写了一句**必须被当真的边界**：

> 🔴 本能力让 `machine` **变得可判定**，但**还没有任何东西在判定它**。
> **把「可判定」说成「已判定」是这类系统最常见的自欺形式。**

今天全库只有 `AssertionFailure` 这个**契约类型**，没有任何东西在生产它。下游两道门禁
（闸 2 本轮验收 / 闸 1 历轮回归）都以 `machine` 项为**输入**——输入有了，**执法者没有**。

### 核实出来的两个硬事实（它们决定了本刀的形状）

**① `jump()` 是纯函数，驱动不了活着的游戏。**

`src/debug/state-jump.ts` 的 `jump(id, seed)` 返回一个 plain snapshot，跟运行中的
Phaser `Game` 实例**完全没有连线**；`panel.ts` 点按钮也只是 `JSON.stringify` 打印一下。
它自己的注释很诚实：ships "the shape a future IA assertion runner will drive against"。

**形状 ≠ 驱动器。** 上游文档说「断言的驱动器就是 `jump(state)`」，但要把游戏真的送进某个
状态，还差一个把快照**施加到活实例**上的东西。这不是选择题，是必补的缺口。

**② 7 个模板里，今天判得了的只有 1 个。**

| 模板 | 参数（现状） | 运行器执行得了吗 |
|---|---|---|
| `loads_clean` | 无 | ✅ 它就是 BH-1，上一刀已有 |
| `controllable` | 按键 = 自由文本「方向键」 | ❌ 不知道按哪个键、谁是「主体对象」、坐标从哪读 |
| `restart` | 触发方式 = 自由文本「按下 R 键」 | ❌ 同上 |
| `hud_text_present` | 文字 + 状态 | ❌ Phaser 文字画在 **canvas** 上，DOM 查不到 |
| `value_persists` | 数值名 = 自由文本「生命值」 | ❌ 没有任何东西暴露这个数值 |
| `score_feedback` | 得分条件 = 自由文本「吃到金币」 | ❌ 游戏内事件，机械触发不了 |
| `game_over_trigger` | 失败条件 = 自由文本「碰到障碍物」 | ❌ 同上 |

**结论：光写一个脚本解决不了这件事。** 缺的是**游戏侧的内省与驱动契约**——一个像
`state-jump.ts` 那样住在模板里、由每个生成项目实现的东西。运行器只是它的消费者。

### 为什么由模板自带契约，而不是让运行器去猜

猜就是启发式：从「按下 R 键」里抠出 `R`、从 canvas 截图里 OCR 找文字。**把不确定性引回了
一道以确定性为存在前提的闸门**——上游否掉 VLM（方案 A）的理由逐字适用：

> 一次性判分容忍不确定性；累积回归闸不容忍。
> **一个会随机变红的闸，必然在三、四轮之内被人关掉。**

而且启发式判 fail 时无法追责：用户不知道是产物真差，还是运行器没看懂。

## What Changes

ship 之后为真、现在不为真的事：

- **模板自带 `src/debug/harness.ts`——游戏内省与驱动契约**，挂在 `window.__gameHarness`：
  - `getSnapshot()` → `{ stateId, score, entities[], hudTexts[], values{} }`
    🔴 `hudTexts` **只能由它枚举 Phaser 的 text objects**——canvas 上的字 DOM 查不到，
    这是 `hud_text_present` 唯一判得了的路径。
  - `listStates()` → `{ id, role }[]`，`role` ∈ `gameplay` / `gameover` / `other`
    🔴 **`role` 是必须的**：模板判据文案写死了「回到 PLAYING」「进入 GAMEOVER」，
    而那是**角色**不是状态 id（参考实现的状态叫 `Game`）。判 id 会把判据钉死在一个
    命名习惯上；判 role 才是判那句话本来的意思。
  - `listTriggers()` → 游戏注册的可触发事件名。**这就是 `score_feedback` /
    `game_over_trigger` 条件参数的枚举来源**——上游问卷从自由文本改选项，选项由这里供。
  - `press(key, opts?)` / `fire(trigger)` / `applyState(id, seed?)`
- **`applyState` 把 `jump()` 接到活实例上**，补掉事实 ①。`jump` 仍是纯函数（它的
  Node 可导入性是 `tests/state-jump.test.mjs` 的前提，不许破坏）。
- **模板自带 `scripts/assert.mjs`**：读项目根的 `assertions.json`，复用上一刀的
  `lib/{cdp,find-browser,static-server}.mjs`，逐条判定，产出上游 `AssertionFailure`
  形状的失败详情。
- **判定结果并进 `.verify-result.json` 的 `assertions` 字段**——见下方「一处需要显式批准的
  契约变更」，**不升 `schemaVersion`**。
- **参考实现长出 GAMEOVER 与 restart**（`GameOverScene` + 一个失败条件 + 重开键）。
  🔴 这不是顺手加游戏内容：没有它，7 个模板里有 2 个在参考实现上**无法被证明跑得通**，
  运行器就会以「写完了但没验过」的状态出厂——正是本刀存在的理由所要消灭的那种状态。
- **`AGENTS.md` 增加 harness 的实现要求**：生成项目要让 `pnpm verify` 真的能判 IA，
  就必须实现这份契约。

## Non-goals

🔴 **下面每一条都是本刀明确切出去的，不是执行时自行收窄。**

| 不做 | 为什么 / 去处 |
|---|---|
| **上游问卷参数枚举化**（自由文本 → 选项） | cogito-lib 侧的刀，**必须排在本刀之后**：参数能枚举出哪些选项，取决于 harness 暴露得了什么。反过来做会造出一批判不了的参数——正是今天这个坑再踩一遍 |
| **投递 `assertions.json` 进 VM** | 同上，cogito-lib 侧（走 `ITaritRepository.execute` 短命令通道，dispatch 前配 git 身份已是先例）。本刀只定这份文件的**格式**，并自带一份样例 |
| **IA 结果在 web 上渲染 / 失败信息回流给 agent** | cogito-lib 侧。本刀把结构化失败详情**落进 `.verify-result.json`**，回流通道归上游 |
| **项目级回归集持久化 · 三闸 UI · 废止记录** | 上游已裁定归 cogito-lib change #23，不在阶段二 |
| **VLM 判分（方案 A）/ agent 写测试（方案 C）** | 上游已定：方案 D 一期只做 B |
| **状态空间大的游戏怎么离散化 `listStates()`** | 上一刀刻意未定，本刀不改这个判断。`role` 是给三个已有状态贴标签，不是离散化策略 |
| **模板的 lint 脚本 / CI paths 过滤** | 上一刀 Gate ② 未选，本刀不反转。⚠️ **后果照旧：改这个模板零 CI 保护**，本刀新增的 `assert.mjs` 与 harness 测试在 CI 里不会被跑到 |
| **把 harness 挡在 `dist-play` 外** | 构建者 2026-08-10 已裁定：两个构建都进。理由与代价见 design D3 |

## 一处需要显式批准的契约变更

**`.verify-result.json` 增加顶层 `assertions` 字段，`schemaVersion` 保持 `1`。**

上游 `normalizeGateResults`（`cogito-lib/apps/web/src/core/types/workspace.ts`）对这份文件的
处置是两条不对称的规则：**未知字段丢弃**，**未知版本号整体拒绝**。

- 升到 `2` → 上游 web 更新之前，**存量项目的 BH 结果全变 `unavailable`**。用一次格式升级
  换来一段所有人都看不到闸门结论的窗口期，代价与收益不成比例。
- 加字段 → 今天的 web 静默丢弃它（行为不变），等 web 学会读了，老模板产出的文件只是
  没有这个字段。**两侧可以各按自己的发布节奏走，谁先谁后都安全。**

🔴 **`assertions` 缺失 MUST NOT 被解读成「IA 通过」。** 文件里必须能区分三态：
判了且全过 / 判了有失败 / **没判**（没有 `assertions.json`、harness 没实现、跑挂了）。
这与上一刀「失败时也要写结果文件」是同一条判据的延续——
**只在全过时才出现的验证层，恰好在有话要说时隐身。**
