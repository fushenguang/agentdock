---
roadmap-id: game-web-phaser-template
---

# AU gate: a declared `player` character must actually be worn by the player

## Why

trial-08（cogito-lib 第二个真实项目「五秒之门」，2026-08-27）的原始现场：
`game-assets.json` 声明了 3 个角色，主角贴图以 `protagonist` key **加载进了
纹理缓存但从未挂到玩家精灵上**——玩家一直是一个程序化方块。AU 门当时的输出
原文是：

```
characters 1/3 in use (unused: protagonist)   →  PASS
```

仪器**当时就看见了**主角未被使用（`unused: protagonist` 点名了它），判定逻辑
没有拦——character 类别的规则是「至少一个声明的角色在用即过」（46536f9 引入，
为的是不强迫游戏用满每个生成的角色），伴角作为场景装饰在用，于是主角的
「已加载未应用」被「别人在用」掩盖成了绿。

构建者试玩判退（原话「逻辑不通，玩不了」，主人物还是正方形）；修复轮把贴图
挂上后同一台仪器才打印 `characters 2/3 in use`。「加载 ≠ 应用」在角色类别上
的最后一道缝就在这里：**哪个角色是玩家，仪器至今无从知道**。

模板自己其实早已声明了这个语义：`src/game-assets.ts` 的保留字
`PLAYER_CHARACTER_KEY = 'player'`——「想让某个生成的角色当玩家精灵，清单
key 必须叫 `player`」。声明这个 key 是一句意图陈述（"这个角色就是玩家"），
而当前 character 规则对这句陈述零敏感：声明了 `player` 却不挂，照样绿。

配套的 cogito-lib 侧契约对齐（平台生成的主角 archetype slug
`protagonist` → `player`，使平台自己的清单开始遵守这个保留字）在本仓之外
另开 change；本刀只修仪器——**两条腿合起来，trial-08 那次的形状会变红**。

## What Changes

- `scripts/lib/asset-usage.mjs` 的 character 类别新增保留字硬规则：
  key 为 `PLAYER_CHARACTER_KEY`（`'player'`）的角色**声明了就必须出现在
  `usedInScene`**——与 bgm 同款的零宽容（declared ⇒ MUST use），不适用
  「至少一个在用」的宽容。理由与 bgm 完全同构：只有一个 bgm key、只有
  一个玩家，"声明了"和"用上了"之间没有部分分可打。
- 其余（非保留字）角色维持现状：至少一个在用即过、未用的逐个点名——
  一个游戏仍然未必用满每个生成的配角。
- `player` 在用/未用永远单独点名进 `reason`（`player character (player)
in use` / failure），不再混进 `x/N in use` 的分数里被平均掉。
- `PLAYER_CHARACTER_KEY` 与 `game-assets.ts` 的镜像一致性入 drift 测试
  （与 `classifyAssetKey()` 的既有 drift 测试同款纪律）。
- 文档同步：`README.md` 的 character 规则条目、`AGENTS.md` 规则 8、
  `skills/game-flow-and-hud/SKILL.md` 的 fallback 段各补一句保留字新语义。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `template-game-web-phaser-verification`: AU 门 character 类别新增保留字
  硬规则（declared `player` ⇒ MUST be in `usedInScene`）。

## Non-goals

- **不改 character 类别对非保留字角色的宽容**——「未必用满每个生成的角色」
  仍是合法形态，一刀切「全都必须用」会错杀只用到部分配角的合法最小游戏。
- **不动三态纪律**（`absent`/`unavailable`/`judged`）、不动
  `judgeAssetUsage()` 的返回字段形状、不动 AU 门在 `verify.mjs` 里的接线。
- **不改 `game-assets.ts` 的契约本身**（`PLAYER_CHARACTER_KEY` 常量、
  约定文案原样保留）——本刀只是让 AU 门开始兑现这个既有约定。
- **不动快照采集**（`usedInScene` 的机制已经能看见挂在玩家身上的贴图，
  trial-08 修复轮 2/3 读数已实证；缺的只是判定规则，不是可见性）。
- 平台侧（cogito-lib）的 slug 改名不在本仓。

## Impact

- 代码：`templates/game-web-phaser/scripts/lib/asset-usage.mjs`（一处
  character 桶的判定分支）。
- 测试：`templates/game-web-phaser/tests/asset-usage.test.mjs`（trial-08
  字面形状回归 + 变异钉 + drift + 行为不变守卫，预计 +4 用例）。
- 文档：`README.md` / `AGENTS.md` / `skills/game-flow-and-hud/SKILL.md`
  各一处。
- Changeset：`@cogito.ai/cli` patch（模板随 CLI 分发）。
- 已脚手架的存量项目拿不到新 `verify.mjs`（模板只在脚手架时复制一次）——
  已知边界，属 cogito-lib 缺陷台账 #3（陈旧环境无浮现）的范畴，不在本刀。
