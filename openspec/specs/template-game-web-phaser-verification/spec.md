# template-game-web-phaser-verification Specification

## Purpose
TBD - created by archiving change ia-assertion-runner. Update Purpose after archive.
## Requirements
### Requirement: 游戏内省与驱动契约（`window.__gameHarness`）

`templates/game-web-phaser/` MUST 提供 `src/debug/harness-types.ts`（契约类型，**零 import**）
与 `src/debug/harness.ts`（安装到 `window.__gameHarness` 的参考实现），暴露
`getSnapshot()` / `listStates()` / `listTriggers()` / `press()` / `fire()` / `applyState()`。

harness MUST 在 `build:play` 与 `build:learn` **两个构建目标里都存在**——判定的产物必须
就是对外分发的那一份。

harness MUST NOT 暴露任何直接写入游戏状态的方法（setter）。`press()` MUST 通过派发键盘
事件驱动，`applyState()` MUST 只落到 `isValidStart()` 认可的合法起点。

`getSnapshot().score` 在游戏没有分数概念时 MUST 为 `null`，MUST NOT 为 `0`。

#### Scenario: harness 在两个构建产物里都可用

- **WHEN** 分别构建 `dist-play/` 与 `dist-learn/` 并在无头浏览器里加载
- **THEN** 两份产物里 `window.__gameHarness` 均存在且 `version === 1`

#### Scenario: 契约类型模块保持 bare Node 可导入

- **WHEN** 用 `node --test` 直接导入 `src/debug/harness-types.ts`
- **THEN** 导入成功（该模块不含任何 import，不拉入 Phaser 或场景类）

#### Scenario: 没有分数概念时 score 是 null 而不是 0（负例）

- **WHEN** 一个不含分数的游戏调用 `getSnapshot()`
- **THEN** `score` 为 `null`，且 `restart` 断言 MUST NOT 因此判为通过

### Requirement: `applyState` 把状态跳转接到活着的游戏实例上

`applyState(id, seed?)` MUST 先用 `jump(id, seed)` 取快照、再用 `isValidStart(id, state)`
自检，自检不通过 MUST 返回 `false` 且 MUST NOT 把游戏切到该状态。

`jump()` MUST 保持纯函数与 bare Node 可导入性——`applyState` 是浏览器侧的新增消费者，
MUST NOT 改变 `jump()` 的既有签名或依赖。

#### Scenario: 合法状态被真的施加到运行中的实例

- **WHEN** 在加载完成的游戏里调用 `applyState('Game')`
- **THEN** 返回 `true`，且随后 `getSnapshot().stateId` 为该状态

#### Scenario: 半吊子状态被 isValidStart 挡下（负例）

- **WHEN** `jump()` 返回一个 `isValidStart` 判假的快照
- **THEN** `applyState` 返回 `false`，游戏状态不变，运行器记为前提不满足而非产物失败

### Requirement: 断言运行器逐条判定 `assertions.json`

`templates/game-web-phaser/` MUST 提供 `scripts/assert.mjs`，读取项目根的
`assertions.json`（`{ schemaVersion, assertions[{ itemId, templateId, params }] }`），
对上游 7 个模板逐条判定，产出与上游 `AssertionFailure` 同形状的失败详情
（`itemId` / `templateId` / `expected` / `actual` / `hint`）。

运行器 MUST 在每条断言开始前调用 `applyState` 建立该条所需的起点——同一份产物与同一份
清单，**断言顺序改变时结论 MUST 保持一致**。

判定前提不满足（trigger 不存在、状态落不进去、`values` 缺键）MUST 在 `hint` 中说明是
前提不满足，MUST NOT 表述成产物缺陷。

`loads_clean` MUST 复用 BH-1 已采集的证据，MUST NOT 重新加载一次页面。

#### Scenario: 打乱顺序结论不变

- **WHEN** 同一份清单以两种不同顺序各跑一次
- **THEN** 两次的逐条判定结果深相等

#### Scenario: score_feedback 判界面文本而非内部变量（负例）

- **WHEN** 触发得分条件后内部分数变化但没有任何 HUD 文本变化
- **THEN** 该条判为失败，`actual` 说明 HUD 文本前后一致

#### Scenario: trigger 不存在时记为前提不满足

- **WHEN** 断言引用了一个 `listTriggers()` 里没有的 trigger 名
- **THEN** 该条不通过，且 `hint` 明确指出是前提不满足而不是产物缺陷

### Requirement: IA 判定结果并入 `.verify-result.json`，三态不可合并

`.verify-result.json` MUST 增加顶层 `assertions` 字段，`schemaVersion` MUST 保持 `1`
（上游对未知字段丢弃、对未知版本号整体拒绝）。

`assertions.status` MUST 为 `judged` / `absent` / `unavailable` 三者之一，且
`status !== 'judged'` 时 MUST 附带人类可读的 `reason`。

`absent` 与 `unavailable` MUST NOT 被表述为 IA 通过。

`absent`（没有 `assertions.json`）MUST NOT 改变 `passed`、MUST NOT 影响退出码、
且 MUST NOT 在 `gates[]` 中产生条目。

`unavailable`（有清单但判不了）与 `judged` 且存在失败项两种情况，MUST 使 `passed` 为
`false`、`pnpm verify` 以非 0 退出码结束，并 MUST 在 `gates[]` 中记入一条 `id: 'IA'` 的
失败条目。

🔴 结果文件的 `passed` 与 `pnpm verify` 的退出码 MUST 由同一个判定函数派生，
MUST NOT 出现「文件写 `passed: true` 而进程退非 0」这类同一份产物内部互相矛盾的结论。

#### Scenario: 没有 assertions.json 时 BH 仍照常判定并退 0

- **WHEN** 项目根没有 `assertions.json` 且三级 BH 判据全部通过
- **THEN** `pnpm verify` 退出码 0，结果文件里 `assertions.status` 为 `absent`，
  且 `gates[]` 中没有 `IA` 条目

#### Scenario: harness 未实现时记为 unavailable，且不是通过（负例）

- **WHEN** 存在 `assertions.json`，但产物里没有 `window.__gameHarness`
- **THEN** `assertions.status` 为 `unavailable` 并写明原因，`passed` 为 `false`，
  `gates[]` 含一条失败的 `IA` 条目，`pnpm verify` 以非 0 退出码结束

#### Scenario: IA 有失败项时退非 0 且结果文件不报成功

- **WHEN** 清单被逐条判定且至少一条失败
- **THEN** `pnpm verify` 以非 0 退出码结束，结果文件 `passed` 为 `false`、
  `gates[]` 含一条失败的 `IA` 条目，并逐条列出失败详情

#### Scenario: 退出码与 `passed` 在任何组合下都不矛盾

- **WHEN** 遍历 BH 结论 × 三种 `assertions.status` × 各种逐条结果的全部组合
- **THEN** 退出码为 0 当且仅当 `passed` 为 `true`

### Requirement: 参考实现覆盖全部 7 个模板

`templates/game-web-phaser/` 的参考游戏 MUST 具备 gameplay 与 gameover 两种
`StateRole`、至少一个重开触发方式，并注册得分与失败两个 trigger——使 7 个断言模板
在模板自带的样例清单上**全部可被真实判定**。

模板 MUST 自带一份样例 `assertions.json`，覆盖全部 7 个模板 id。

#### Scenario: 样例清单在参考实现上全绿

- **WHEN** 在干净安装的模板项目里运行 `pnpm verify`
- **THEN** 三级 BH 通过，`assertions.status` 为 `judged`，7 条全部 `passed: true`，退出码 0

