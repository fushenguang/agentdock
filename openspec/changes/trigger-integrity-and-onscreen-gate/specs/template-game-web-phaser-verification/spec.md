## ADDED Requirements

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
