# Design · ia-assertion-runner

## D1 · harness 是**契约 + 参考实现**，跟 `state-jump.ts` 同一个形状

模板里已经有一个「契约 + 最小参考实现」的先例（`src/debug/state-jump.ts`），本刀照抄那个
形状，不发明新的组织方式。

```ts
// src/debug/harness-types.ts —— 叶子模块，零 import
export type StateRole = 'gameplay' | 'gameover' | 'other'
export interface StateDescriptor { readonly id: string; readonly role: StateRole }
export interface EntitySnapshot { readonly name: string; readonly x: number; readonly y: number }

export interface HarnessSnapshot {
  readonly stateId: string
  readonly score: number | null          // 游戏没有分数概念时是 null，不是 0
  readonly entities: readonly EntitySnapshot[]
  readonly hudTexts: readonly string[]
  readonly values: Readonly<Record<string, number>>
}

export interface GameHarness {
  readonly version: 1
  getSnapshot(): HarnessSnapshot
  listStates(): readonly StateDescriptor[]
  listTriggers(): readonly string[]
  press(key: string, opts?: { durationMs?: number }): Promise<void>
  fire(trigger: string): Promise<void>
  applyState(id: string, seed?: number): Promise<boolean>
}
```

🔴 **`harness-types.ts` 必须保持零 import**，理由与 `dimensions.ts` 那条逐字相同：
它要被 bare Node 导入（`tests/harness.test.mjs` 里的纯判定逻辑），而
`src/debug/harness.ts` 会拉进 Phaser 与全部场景类。**同一个坑不踩第二次。**

`score: number | null` 里的 `null` 是刻意的：`0` 表示「有分数，现在是零」，`null` 表示
「这游戏没有分数这个概念」。合成一个值，`restart` 的「分数归零」就永远判得过。

## D2 · `applyState` 是驱动器，`jump` 保持纯函数

```
jump(id, seed)      —— 纯函数，产出快照。Node 可导入。不动。
applyState(id, seed) —— 浏览器侧：jump() 拿快照 → isValidStart() 自检 → 施加到活实例
                        → 等场景真的切过去 → 返回是否成功
```

🔴 **`applyState` 内部必须先跑一次 `isValidStart`，失败就返回 `false` 而不是硬切过去。**
上一刀写死的那条判据在这里第一次有了真实消费者：**半吊子状态会让运行器验出假 bug，
然后把好代码「修」坏。假 bug 比没测试更糟。**

`applyState` 返回 `Promise<boolean>` 而不是抛：状态切不过去是**运行器要如实上报的判定
前提失败**（记成 `unmet-precondition`），不是脚本崩溃。两者对上游意义不同。

## D3 · harness 进两个构建产物，作弊面靠 API 形状压住

构建者 2026-08-10 裁定：两个构建都进。判据是**判的必须就是发的那份产物**——
`verify.mjs` 今天跑的就是 `dist-play`，让 IA 改判 `dist-learn` 会造出「判的 ≠ 发的」，
而两个构建目标之间的任何差异都能让闸门放过一个真 bug。**这个洞在验证层里比作弊严重。**

代价如实记：公开产物多出一个 `window.__gameHarness`。压住它的是 **API 形状**，不是藏：

| 允许 | 禁止 |
|---|---|
| `getSnapshot()` / `list*()` —— 纯读 | 任何 setter（`setScore`、`setState`…） |
| `press(key)` —— 派发键盘事件，**玩家本来就能按** | 直接改分数 / 直接改实体坐标 |
| `applyState(id)` —— 只能落到 `isValidStart` 认可的**合法起点** | 落到任意构造的状态 |

`fire(trigger)` 是这张表里最弱的一格，**如实说清楚**：它确实能让玩家把某个游戏内事件
按需触发（比如反复触发得分）。约束是 prose 而不是机器判定——

> **注册的 trigger 只许做玩家自己也能造成的事**（例：在玩家脚下生成一枚金币并让碰撞
> 自然发生），**不许直接写状态**（`this.score += 10` 是违规的）。

🔴 **这条守不住的部分要认**：没有任何机械手段能区分「生成金币」和「直接加分」。它写进
`AGENTS.md`，靠人审。**不假装它是自动的**——同一条纪律在上游 `future-features` 那里也是
这么划的界。

## D4 · `assertions.json` 格式，以及「没判」必须是一个独立状态

```jsonc
// 项目根 / assertions.json —— 由上游 web 在 dispatch 前写入（本刀不做投递）
{
  "schemaVersion": 1,
  "assertions": [
    { "itemId": "ai-1", "templateId": "controllable", "params": { "key": "ArrowLeft" } }
  ]
}
```

写进 `.verify-result.json` 的那半：

```jsonc
{
  "schemaVersion": 1,          // 不升，见 proposal
  "ranAt": "...", "passed": false, "gates": [ /* BH-0/1/2，不变 */ ],
  "assertions": {
    "status": "judged",        // judged | absent | unavailable
    "reason": null,            // status !== 'judged' 时必填
    "passedCount": 2, "total": 3,
    "results": [
      { "itemId": "ai-1", "templateId": "controllable", "passed": true, "failure": null },
      { "itemId": "ai-2", "templateId": "score_feedback", "passed": false,
        "failure": {           // 🔴 逐字对齐上游 AssertionFailure
          "itemId": "ai-2", "templateId": "score_feedback",
          "expected": "达成「吃到金币」后，界面上的分数文本发生变化",
          "actual": "hudTexts 前后一致：[\"Score: 0\"]",
          "hint": "trigger「吃到金币」已注册且已触发，但没有任何 HUD 文本变化——检查得分是否只改了内部变量、没有同步到 Text object"
        } }
    ]
  }
}
```

三态的意义**不许合并**：

| status | 什么时候 | 上游该显示 |
|---|---|---|
| `judged` | 读到清单并逐条判完 | 逐条 pass/fail |
| `absent` | 没有 `assertions.json` | 「本轮没有机器验收项」 |
| `unavailable` | 有清单但判不了（harness 没实现 / 版本不认 / 判定过程崩了） | 「IA 未判定」+ 原因 |

🔴 **修正（2026-08-11，实测驱动）：`absent` 与 `unavailable` 不是一回事，原稿把它们捆在
一起是错的。**

原稿写的是「两者都不影响 `passed`」。真机跑出来的后果是：一条断言判失败时，
`.verify-result.json` 写 `passed: true`、退出码却是 `1`——**同一份产物里两个互相矛盾的
答案**。而上游 web 的渲染是 `验收结论：{summary.passed ? '通过' : '未通过'}`，
**那一轮会在 web 上显示「通过」**。一个在验证失败时报告成功的验证层，正是这一刀要消灭的
那种自欺。

修正后的规则：

| status | 含义 | `passed` | 退出码 | 进 `gates[]` |
|---|---|---|---|---|
| `absent` | **没人要求判** IA | 不受影响 | 不受影响 | ❌ 不记（凭空发明一道不适用的闸） |
| `unavailable` | **有人要求了，判不了**（产物里没 harness / 版本不认 / 判定崩了） | `false` | `1` | ✅ 记红行，detail 写原因 |
| `judged` 有失败 | 判了，没过 | `false` | `1` | ✅ 记红行，`n/m 通过` |
| `judged` 全过 | 判了，过了 | 不受影响 | 不受影响 | ✅ 记绿行 |

**`unavailable` 退 0 就是「一道能被静默跳过的闸」**——那正是上一刀写死的第一条纪律禁止的
东西，也是上游原话「绝不当成闸门通过」的直接推论。只有 `absent`（今天所有存量项目）是良性的。

🔴 **`passed` 与退出码 MUST 由同一个函数派生**（`decideVerdict()`）。两处各算一次，
迟早会再次分叉——这次的 bug 就是这么来的。有一条测试遍历全部组合钉死它们永不分歧。

🔴 **IA 记进 `gates[]` 是刻意的**：上游 web 已经在遍历渲染 `gates[]`，
**这样 IA 结论在 web 上零改动就能显示**，而且 `passed: false` 的那一轮总有一行红的说明
是哪道闸挂了，产物自身不再自相矛盾。

## D5 · 逐模板的判定实现

| templateId | 驱动 | 判据 |
|---|---|---|
| `loads_clean` | 无 | **直接复用 BH-1 的证据**（无未捕获异常、无失败资源请求），不重复跑一遍浏览器 |
| `controllable` | `applyState(gameplay)` → snap0 → `press(key, 200ms)` → snap1 | 存在一个同名 entity 的 `x`/`y` 发生变化 |
| `hud_text_present` | `applyState(state)` → snap | `hudTexts` 里有一项**包含**目标文字（子串，不是全等） |
| `value_persists` | `applyState(from)` → 记 `values[v]` → `applyState(to)` → 再记 | 两次相等；`values` 里没有这个键 → `unmet-precondition`，不是 fail |
| `score_feedback` | snap0 → `fire(condition)` → snap1 | `hudTexts` 发生变化。🔴 **判 HUD 文本不判 `score` 字段**——模板判据原话是「界面上的分数文本发生变化」，内部变量变了而界面没变，正是它要抓的 bug |
| `game_over_trigger` | `fire(condition)` → snap | `stateId` 对应的 `role === 'gameover'` |
| `restart` | 先制造非零分（`fire` 得分 trigger，没有就 `press`）→ `press(trigger)` → snap | `role === 'gameplay'` **且** `score === 0` |

🔴 **`unmet-precondition` 与 `fail` 是两回事，不许合并。** 「没有名为 X 的 trigger」
「`applyState` 落不到那个状态」说明的是**这条断言判不了**，不是**产物不合格**。混在一起，
执行者会去「修」一个不存在的 bug——又是假 bug。它记进 `failure.actual`，`passed: false`，
但 `hint` 必须说清楚是前提不满足。

## D6 · 判定顺序与副作用：每条断言前强制 `applyState`

断言之间会互相污染（`game_over_trigger` 跑完游戏就死了，后面的 `controllable` 全 fail）。

对策不是排序，是**每条断言开始前一律 `applyState` 到它需要的起点**——同一份产物、
同样的清单，**换个顺序结论必须一样**。这条要有测试钉死（打乱顺序跑两遍，结果深相等）。

这也正好是 `jump/applyState` 存在的理由被真正用上的地方：不用从头玩过去。

## D7 · `verify.mjs` 与 `assert.mjs` 的分工：一次浏览器会话，两段判定

不新起一个浏览器。`assert.mjs` 导出判定逻辑，`verify.mjs` 在 BH-2 之后**用同一个 CDP
会话**接着跑 IA，然后一次性写结果文件。

理由有三条，第二条是硬的：
1. 起两次 chromium 在 guest 上要多花十几秒；
2. 🔴 **BH 与 IA 必须是同一份产物、同一次加载的结论**。分两次跑，中间任何东西变了，
   `.verify-result.json` 就成了一份自相矛盾的报告；
3. `process.on('exit')` 那个兜底写结果的钩子已经在 `verify.mjs` 里了，只有一个出口才守得住。

`assert.mjs` 仍然可以单独 `node scripts/assert.mjs` 跑（开发时方便），那条路径自己起浏览器。

## D8 · 退出码：IA 失败要不要让 `pnpm verify` 退非 0

**要。** 与 BH 同等对待——IA 有失败项 → 退 1。

理由：上游闸 2「本轮验收」读的就是这些项，而模板的 `AGENTS.md` 已经把「`pnpm verify`
退 0」写成执行者的完成条件。IA 失败却退 0，等于告诉执行者「验收没过也算做完了」。

⚠️ **`absent` 不影响退出码**（BH 过了就退 0）：没有清单的项目（今天所有存量项目）不该
因为一个它还没用上的能力而全部变红。

🔴 **`unavailable` 影响退出码——退 1。** 原稿把它和 `absent` 归成一类，是错的，理由与
修正后的完整表格见 D4。一句话：**`absent` 是没人问，`unavailable` 是问了而闸没跑起来**，
后者退 0 就是一道能被静默跳过的闸。

退出码与结果文件的 `passed` **MUST 由同一个函数派生**（D4）。**三种情况各要有测试**，
外加一条遍历全组合、钉死两者永不分歧的测试。
