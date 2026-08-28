---
'@cogito.ai/cli': patch
---

`game-web-phaser` 的 AU（素材使用）闸门在第二个真实项目（trial-08，
2026-08-27，从本模板脚手架的平台仓）上又跑出一次「仪器看见了、规则放行了」：
主角贴图以 `protagonist` key 声明并加载进了纹理缓存，**从未挂到玩家精灵上**
——玩家一直是一个程序化方块，构建者真机试玩的判词是「逻辑不通，玩不了」
（主人物还是正方形）。AU 门当时的输出原文：

```
characters 1/3 in use (unused: protagonist)   →  PASS
```

伴角作为场景装饰在用，恰好满足 46536f9 定下的「角色类别至少一个在用」；
`unused: protagonist` 点了名，判定逻辑没有拦。修复轮把贴图挂上后，同一台
仪器才打印 `characters 2/3 in use`。

这一刀把 character 类别**按保留字拆开**判：清单里 key 为
`PLAYER_CHARACTER_KEY`（`'player'`）的角色，声明了就必须出现在
`usedInScene`——与 bgm 同款的零宽容（declared ⇒ MUST use）。理由与 bgm
完全同构：保留字是模板自己声明的意图标记（「这个角色就是玩家精灵」），
声明即意图、唯一 key、没有部分分可打；「加载了」和「玩家真的穿着它」
之间不许再被「别的角色在用」平均掉。其余（非保留字）角色维持既有宽容：
至少一个在用即过、未用者逐个点名——一刀切「全部必须在用」会错杀只用到
部分配角的合法最小游戏，刻意不做。`player` 在用/未用从此单独点名
（`player character (player) in use` / 失败时点名 `player`），不再混进
`x/N in use` 的分数里。

清单契约一处没动：`game-assets.ts` 的 `PLAYER_CHARACTER_KEY` 常量与约定
文案原样，`classifyAssetKey()`/`judgeAssetUsage()` 的返回字段形状原样，
三态纪律（`absent`/`unavailable`/`judged`）逐字节原样，零新依赖，
没有为任何具体游戏写特判——判据只依赖清单自己的保留字声明。

测试（`tests/asset-usage.test.mjs`，20→24 用例）：

- **REGRESSION（trial-08 字面形状）**：declared `player`/`companion`/
  `antagonist`、全部加载、`usedInScene=[companion]` ⇒ `passed: false`、
  `reason` 点名 `player`——即真实事故的原样输入。
- **MUTATION GUARD**：手算旧判据（角色类 ≥1 在用、不分保留字）在同一
  输入上会判 PASS，断言新判据必须与它不一致——换措辞不换判据时这条会红。
- **行为不变守卫**：清单里没有保留字 key 时，配角判定与旧规则逐字一致。
- **drift 测试**：判定侧手工镜像的 `PLAYER_KEY` 必须恒等于
  `game-assets.ts` 的真实 `PLAYER_CHARACTER_KEY`（导出仅为这条断言，
  与 `classifyAssetKey` 的既有模式一致）。

变异验证（真实跑过）：把保留字失败分支临时中和（`&& false`）后
`node --test` 3 个用例变红——trial-08 回归、MUTATION GUARD、以及既有
「loaded but never drawn/played」用例（它断言的正是新失败文案）；还原后
24/24 全绿。本刀只改纯判定函数与文档，`verify.mjs` 接线零改动，故未重跑
脚手架真机链（BH/IA 交互面未动）。

已知边界：已脚手架的存量项目拿不到新 `verify.mjs`（模板只在脚手架时复制
一次），新判据只约束新项目——平台仓的缺陷台账（陈旧环境无浮现机制）另立
change 处理。平台侧的配套契约对齐（主角 archetype 的 slug 从 `protagonist`
改成 `player`，使平台自己的清单开始遵守保留字）在姊妹仓另开 change。
