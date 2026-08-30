## MODIFIED Requirements

### Requirement: 断言运行器逐条判定 `assertions.json`

`templates/game-web-phaser/` MUST 提供 `scripts/assert.mjs`，读取项目根的
`assertions.json`（`{ schemaVersion, assertions[{ itemId, templateId, params }] }`），
对上游 8 个模板逐条判定，产出与上游 `AssertionFailure` 同形状的失败详情
（`itemId` / `templateId` / `expected` / `actual` / `hint`）。

运行器 MUST 在每条断言开始前调用 `applyState` 建立该条所需的起点——同一份产物与同一份
清单，**断言顺序改变时结论 MUST 保持一致**。

判定前提不满足（trigger 不存在、状态落不进去、`values` 缺键）MUST 在 `hint` 中说明是
前提不满足，MUST NOT 表述成产物缺陷。**`data_from_files` 的「从未声明数据清单」
不在前提不满足之列**——manifest 缺席、声明了没加载、加载了场景没消费，三种都判
**失败**（那是产物缺陷，正是这条断言存在的理由），失败 `hint` MUST 指向
「先按数据层约定立数据 / 让场景消费数据」的修法，MUST NOT 写「前提不满足」。

`loads_clean` MUST 复用 BH-1 已采集的证据，MUST NOT 重新加载一次页面。

`data_from_files` 的判定 MUST 基于 harness `data` 证据三层
（`declared`/`loaded`/`usedInScene`）全部非空；`data` 为 `null` 等价于第一层
即失败。

#### Scenario: 打乱顺序结论不变

- **WHEN** 同一份清单以两种不同顺序各跑一次
- **THEN** 两次的逐条判定结果深相等

#### Scenario: score_feedback 判界面文本而非内部变量（负例）

- **WHEN** 触发得分条件后内部分数变化但没有任何 HUD 文本变化
- **THEN** 该条判为失败，`actual` 说明 HUD 文本前后一致

#### Scenario: trigger 不存在时记为前提不满足

- **WHEN** 断言引用了一个 `listTriggers()` 里没有的 trigger 名
- **THEN** 该条不通过，且 `hint` 明确指出是前提不满足而不是产物缺陷

#### Scenario: 从未声明数据清单判失败而非前提不满足

- **WHEN** 项目根没有 `game-data.json`（或清单空壳过不了校验），断言含
  `data_from_files`
- **THEN** 该条判失败，`hint` 指向先按数据层约定立数据，MUST NOT 写「前提不满足」

#### Scenario: 空壳数据骗不过

- **WHEN** `game-data.json` 声明了条目、加载器也加载了，但场景构建没消费任何条目
  （`usedInScene` 为空）
- **THEN** `data_from_files` 判失败，`actual` 区分「声明/加载/消费」三层各自的
  状况

### Requirement: 参考实现覆盖全部 8 个模板

`templates/game-web-phaser/` 的参考游戏 MUST 具备 gameplay 与 gameover 两种
`StateRole`、至少一个重开触发方式，并注册得分与失败两个 trigger——且参考场景
MUST 从 `game-data.json` 构建玩法内容——使 8 个断言模板在模板自带的样例清单上
**全部可被真实判定**。

模板 MUST 自带一份样例 `assertions.json`，覆盖全部 8 个模板 id。

#### Scenario: 样例清单在参考实现上全绿

- **WHEN** 在干净安装的模板项目里运行 `pnpm verify`
- **THEN** 三级 BH 通过，`assertions.status` 为 `judged`，8 条全部 `passed: true`，
  退出码 0
