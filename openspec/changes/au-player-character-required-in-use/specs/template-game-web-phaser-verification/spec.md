## ADDED Requirements

### Requirement: AU 门对保留字 `player` 角色零宽容——声明了就必须真用在场景里

AU（asset usage）门的 character 类别按既有规则（2026-08-22 起按类别判定）
要求「至少一个声明的角色在用」并对未用者点名。本条对**保留字角色**单独收紧：
清单里 key 等于 `PLAYER_CHARACTER_KEY`（`'player'`）的角色，MUST 与 bgm
同款零宽容——**声明了就必须出现在 `usedInScene`**，否则该次 AU 判定 MUST 为
失败、`passed` 为 `false`、`pnpm verify` 以非 0 退出码结束，且 `reason` MUST
点名 `player`（MUST NOT 把它混进 `x/N in use` 的分数里被「别的角色在用」
平均成通过）。

理由（trial-08 原始现场，2026-08-27）：主角贴图以任意角色 key 加载进缓存、
从未挂到玩家精灵，玩家一直是程序化方块，而 AU 门打印
`characters 1/3 in use (unused: protagonist)` 仍判 PASS——仪器看见了主角
未被使用，判定规则放行了它。`PLAYER_CHARACTER_KEY` 是模板自己声明的意图
标记（"这个角色就是玩家精灵"），声明它就意味着玩家必须真的穿着它；bgm 与
player 在这一点上完全同构：唯一 key、声明即意图、没有部分分可打。

非保留字角色（配角）MUST 维持既有宽容不变：至少一个在用即过、未用者逐个
点名——一个游戏仍然未必用满每个生成的配角，MUST NOT 因为本条把它们一刀切
成「全部必须在用」。

`player` 在用时 MUST 在 `reason` 里单独点名（`player character (player)
in use`），不混入配角分数；镜像常量与 `src/game-assets.ts` 的
`PLAYER_CHARACTER_KEY` 的一致性 MUST 由 drift 测试守住。

#### Scenario: 声明了 player 但从未挂在场景里（trial-08 字面形状）

- **WHEN** 清单声明角色 `player`/`companion`/`antagonist` 且全部加载成功，
  `usedInScene` 只含 `companion`（作为场景装饰）
- **THEN** AU 判定为失败（`passed: false`），`reason` 点名 `player` 未用，
  `pnpm verify` 以非 0 退出码结束

#### Scenario: player 挂上了则照常通过并单独点名

- **WHEN** 同上一形状，但 `usedInScene` 含 `player`（例如还含 `companion`）
- **THEN** AU 判定通过，`reason` 含 `player character (player) in use`，
  未用的配角照旧以 `(unused: …)` 点名、不影响通过

#### Scenario: 未声明 player 时配角宽容不变（行为不变守卫）

- **WHEN** 清单只声明 `companion`/`antagonist`（无保留字 key），其中
  `companion` 在用、`antagonist` 未用
- **THEN** 判定与既有规则逐字一致：通过，`reason` 点名未用的 `antagonist`
  ——本条不收紧配角

#### Scenario: 判定规则退回旧形状必须被变异钉逮住

- **WHEN** 有人把 character 分支改回「不分保留字、至少一个在用即过」
- **THEN** 上述 trial-08 形状的回归用例 MUST 变红（变异钉守护本条的
  判别力，防止换措辞不换判据）
