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

### Requirement: 可执行的三级验证（`pnpm verify`）

`templates/game-web-phaser/` MUST 提供 `scripts/verify.mjs` 与对应的 `verify` npm 脚本，
跑三级判据（BH-0 构建 / BH-1 加载 / BH-2 渲染），零新依赖（不引入 playwright /
puppeteer-core / `ws` 等包），通过 spawn 环境里已有的 Chromium 并用 Node 内置
`WebSocket` 说 CDP 完成。

任一级判定失败、找不到浏览器、或 Node 运行时缺少内置 `WebSocket`（<22），
MUST 打印期望与实测并以非 0 退出码结束；MUST NOT 打印"跳过"后以 0 退出。

#### Scenario: 三级判据全部通过

- **WHEN** 在已 `pnpm install` 的生成项目里运行 `pnpm verify`
- **THEN** 依次执行构建、无头 Chromium 加载、截图与画布尺寸检查，全部通过后以退出码 0 结束

#### Scenario: 找不到浏览器时报错退出，不静默跳过

- **WHEN** `CHROME_PATH`、`PLAYWRIGHT_BROWSERS_PATH`、`$HOME/.cache/ms-playwright`、
  `/.cache/ms-playwright`、`PATH` 均未能解析出一个可执行的 Chromium/Chrome 二进制
- **THEN** `pnpm verify` 打印它查找过的每一条路径，并以非 0 退出码结束

#### Scenario: Node 运行时缺少内置 WebSocket 时报错退出

- **WHEN** `typeof WebSocket !== 'function'`（Node < 22）
- **THEN** `pnpm verify` 在执行任何浏览器相关判据之前报错并以非 0 退出码结束

### Requirement: 截图非空判定必须真判定，不能只判文件存在

`scripts/lib/png.mjs` MUST 解码 CDP 返回的 base64 PNG 像素（零依赖，
`zlib.inflateSync` 解 IDAT），并同时用唯一颜色数下限与像素方差下限判定"非空"——
仅判 base64/文件是否存在或字节数 MUST NOT 视为满足本要求。

#### Scenario: 纯色 PNG 被判为空（负例）

- **WHEN** 判定函数收到一张唯一颜色数为 1、方差为 0 的纯色 PNG
- **THEN** 判定结果为「空」（`nonEmpty: false`）

#### Scenario: 有真实视觉内容的 PNG 被判为非空

- **WHEN** 判定函数收到一张唯一颜色数与像素方差均高于下限的 PNG
- **THEN** 判定结果为「非空」（`nonEmpty: true`）

### Requirement: 状态跳转契约与遍历断言

`templates/game-web-phaser/` MUST 在 `src/debug/state-jump.ts` 提供
`listStates()` / `jump(id, seed?)` / `isValidStart(id, state)` 契约，
并为该模板自身的 Boot/Preload/Game 三态提供最小参考实现；`jump` 产生的状态
MUST 是该状态的合法起点，且同一 `(id, seed)` 两次调用 MUST 深相等（可复现）。

`tests/state-jump.test.mjs` MUST 对 `listStates()` 的每个状态分别断言
「`isValidStart` 为真」与「同种子两次 `jump` 深相等」两条独立结论，
不得合并为一条断言；MUST 包含至少一个「半吊子状态被 `isValidStart` 判为假」的负例。

#### Scenario: 每个状态的 jump 结果合法且可复现

- **WHEN** 对 `listStates()` 返回的每个 `id` 以固定种子调用 `jump`
- **THEN** `isValidStart(id, jump(id, seed))` 为真，且同一 `(id, seed)` 的两次 `jump` 结果深相等

#### Scenario: 半吊子状态被拒绝（负例）

- **WHEN** 构造一个字段不合法（如玩家坐标越出世界边界、id 与实际状态不一致）的状态
- **THEN** `isValidStart` 对该状态返回假

### Requirement: 双构建目标，调试面板由构建目标门禁而非运行时开关

`templates/game-web-phaser/` MUST 提供 `build:play`（输出 `dist-play/`，
服务端口固定 8080，`strictPort`，不含调试面板）与 `build:learn`
（输出 `dist-learn/`，服务端口 8090，含调试面板）两个构建目标。

调试面板（`src/debug/panel.ts`）是否编入产物 MUST 由构建时的 `--mode` 决定
（即 `import.meta.env.MODE`，一个编译期常量），MUST NOT 由任何运行时/客户端可读写的
开关决定。`build:play` 的产物 MUST NOT 包含调试面板相关代码。

#### Scenario: build:play 产物不含调试面板代码

- **WHEN** 运行 `pnpm build:play` 生成 `dist-play/`
- **THEN** `dist-play/` 下的 JS 产物中不出现调试面板的标识性字符串或代码

#### Scenario: build:learn 产物包含调试面板

- **WHEN** 运行 `pnpm build:learn` 生成 `dist-learn/`
- **THEN** `dist-learn/` 的产物中包含调试面板代码，且页面加载后可通过挂载点访问

### Requirement: 生成项目的 `engines.node` 如实声明为 ≥22

`templates/game-web-phaser/package.json` 的 `engines.node` MUST 为 `>=22`——
零依赖 CDP 传输依赖 Node 内置 `WebSocket`，该特性在 Node 22 才稳定；
声明 `>=18` 而实际需要 22 会是一句不真的话。

#### Scenario: 生成项目声明 Node ≥22

- **WHEN** 用 `game-web-phaser` 模板脚手架生成一个新项目
- **THEN** 生成项目 `package.json` 的 `engines.node` 为 `>=22`

### Requirement: 触发器完整性——handler 不许搬动玩家

`fire(trigger)` MUST 在**同步**调用 handler 的前后各读一次名为 `player` 的实体坐标
（两次读取之间 MUST NOT 有 `await`，以保证其间不发生物理步），坐标发生任何变化时
MUST 判为触发器违规并抛错，由断言运行器计入 `unavailable`（按既有三态语义为红）。

判据 MUST 是等值比较，MUST NOT 引入位移阈值——免疫性与位移大小无关。

`templates/game-web-phaser/` 的参考实现 MUST 把玩家实体命名为 `player`，该命名 MUST 被
`AGENTS.md` 记为契约而非习惯。

产物中不存在名为 `player` 的实体时，该检查 MUST NOT 判红，但 MUST 在 `.verify-result.json`
里留下可见记录，说明该检查未生效。MUST NOT 静默跳过。

#### Scenario: 把玩家传送到目标处的触发器被判违规（变异验证）

- **WHEN** 一个 handler 执行 `player.setPosition(target.x, target.y)` 后被 `fire()` 调用
- **THEN** 该断言判为 `unavailable`，`pnpm verify` 以非 0 退出码结束，详情说明触发器搬动了玩家

#### Scenario: 参考实现的"在玩家脚下生成一枚硬币"照常通过

- **WHEN** handler 只新增实体（`spawnCoinAtPlayer` / `spawnObstacleAtPlayer`）
- **THEN** 检查通过，`score_feedback` / `game_over_trigger` 判定不受影响

#### Scenario: 没有 player 实体时不静默放行（负例）

- **WHEN** 产物中没有任何名为 `player` 的实体
- **THEN** 判定不因此变红，但 `.verify-result.json` 中可见地记录"触发器完整性检查未生效"

### Requirement: BH-2 判定命名实体是否仍在世界边界内

`scripts/verify.mjs` 的 BH-2 MUST 在既有画布尺寸与截图非空判据之外，增加一条判据：
`getSnapshot().entities` 中每个命名实体的坐标 MUST 落在世界边界内（含明确的 margin）。

边界来源 MUST 优先取 `physics.world.bounds`，不可得时退回画布尺寸，且
`.verify-result.json` 的 detail MUST 写明本次采用的是哪一个来源，以及越界实体的名称与坐标。

该判据 MUST NOT 提供任何开关或跳过机制（环境变量、清单字段皆不允许）。

#### Scenario: 受重力下坠出画面的终点对象被判红

- **WHEN** 一个终点/障碍对象只调了 `setImmovable(true)` 而未关闭重力，加载后持续下坠
- **THEN** BH-2 判红，详情给出该实体名称、坐标与所用边界来源

#### Scenario: 边界来源可见

- **WHEN** 游戏未调用 `physics.world.setBounds`
- **THEN** 判定退回画布尺寸，并在 detail 中写明来源为画布尺寸而非世界边界

### Requirement: `pnpm verify` 在任何退出路径上都不留下自己启动的进程

`scripts/verify.mjs` MUST 在**所有**退出路径（判据失败、未捕获异常、环境自检失败、正常通过）
上关闭它自己启动的无头浏览器与静态服务器。MUST NOT 通过 `process.exit()` 跳过清理。

#### Scenario: 判据失败时不残留进程

- **WHEN** 任一 BH 或 IA 判据失败导致 `pnpm verify` 以非 0 退出码结束
- **THEN** 它启动的无头浏览器进程与静态服务器端口均已释放，按精确 PID 核对无残留

#### Scenario: 正常通过时不残留进程

- **WHEN** `pnpm verify` 以退出码 0 结束
- **THEN** 同上，无残留

### Requirement: 模板锁定 Phaser 4.x，并自带可用的 registry

`templates/game-web-phaser/` 的 `package.json` MUST 依赖 `phaser@^4.2.1`，
lockfile MUST 锁到该版本。

该模板 MUST 自带 `.npmrc` 指定一个**实测能提供 `phaser@4.2.1` tarball** 的 registry，
以免生成项目的安装结果取决于宿主环境的默认源。
MUST NOT 在 agentdock 仓库根写 `registry=`（会覆盖 CI 发布用的 registry）。

升级 MUST NOT 通过放宽既有验收判据来通过——`pnpm verify` 的 BH/IA 判据、触发器完整性检查与
实体越界判据 MUST 保持原样，判定失败时修的是被判定的代码。

#### Scenario: 生成项目能装上 Phaser 4

- **WHEN** 在生成项目里执行 `pnpm install`
- **THEN** 装到 `phaser@4.2.1`，且不依赖宿主环境的 registry 默认值

#### Scenario: 升级后全部判据仍然通过

- **WHEN** 升级完成后运行 `pnpm verify`
- **THEN** BH-0/1/2 与 IA 全部通过，且判据本身未被修改

#### Scenario: 官方 skill 随依赖到位

- **WHEN** 安装完成后检查 `node_modules/phaser/skills/`
- **THEN** 存在 28 个 `SKILL.md`

