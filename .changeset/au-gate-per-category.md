---
'@cogito.ai/cli': patch
---

`game-web-phaser` 的 AU（素材使用）闸门第一次在真实项目上跑出的读数暴露它判得
太松：`assetUsage.reason` 写着「7/7 declared asset(s) loaded, 2 in active use
(title, bg-level1)」，`passed: true`——但 3 个声明的角色和声明的 bgm 一个都没
在用，构建者真机试玩的原话正是「没有背景音乐，没有使用 AI 设计的人物形象」。
根因：闸门原来的判据是「整体至少有一个声明的素材在用」，title+一张背景就足够
撑起这句话为真，跟角色/bgm 到底有没有用上完全无关。

这一刀把判据从「整体至少一个在用」改成**按类别分别判**
（`scripts/lib/asset-usage.mjs` 新增 `classifyAssetKey()`，从 key 本身推断类别
——`title`/`bgm`/`"bg-level"+N`/否则视为角色，镜像 `game-assets.ts` 的同名常量，
不导入，理由与 `harness-types.ts` 手工镜像 `DeclaredAssetKind` 完全一致，
`tests/asset-usage.test.mjs` 新增一条 drift 测试防止两边分叉）：

- **bgm**——声明了就必须在 `usedInScene` 里，否则失败。
- **背景**——声明了就要求**至少一个**声明的背景在用，不要求「每一关的背景都
  在用」：一次快照只扫描当前激活的场景，本轮探针根本没访问过的关卡，它的背景
  显示 0 次使用是预期行为，不能算这个项目的错。
- **角色**——同样要求至少一个在用（一个游戏未必用满每个生成的角色），但
  `reason` 里永远点名哪些没用上，不再被"至少一个"悄悄掩盖成"看起来都挺好"。
- **title**——不作硬性要求（判定时可能已经离开开始页），只在 `reason` 里
  列出供人核对。

清单契约的形状一处没动（`GameAssetEntry`/`AssetUsageSnapshot`/
`judgeAssetUsage()` 的返回字段都没变），三态纪律（`absent`/`unavailable`/
`judged`）逐字节不变，没加任何运行时依赖，没有为任何具体游戏写特判。

**过程中意外验出一个会导致这道更严闸门"错杀"正确实现的真实缺口**：按新规则
在脚手架出的、完全未改动的模板项目上实测，declared bgm 即使真实存在、
`PreloadScene` 也真的把它加载进了缓存，`pnpm verify` 仍然判 AU 失败——因为
`src/debug/harness.ts` 的 `applyState()` 是直接 `game.scene.start('Game')`，
从不模拟真实点击，而这个模板的参考实现里 bgm 播放**只**挂在
`StartScene.handleStart()`（"开始游戏"按钮的 `pointerdown` 处理器，浏览器
autoplay 手势要求决定的，唯一正确的做法）。也就是说，任何完全照抄这个模板
正确写法的项目，在新的分类判据下都会被永远判失败——这是探针没给 bgm 一个被
看见的机会，不是代码真的坏了。

修法：给 `GameScene.applyHarnessState()`（design D2 已有的、专为
"`applyState()` 之外还要做点什么"设计的挂钩，只会被 harness 的合成跳转调用，
真实玩家的点击路径完全不经过它）加上和 `StartScene.handleStart()` 完全相同的
幂等 `cache.audio.exists() && !sound.get()` 判断 + `sound.play()` 调用。真实
玩家的自动播放时机一处没变（点击那条路径原样保留）；这只是让 harness 的合成
跳转兑现它自己已经声明的前提——`applyState('Game')` 成功即代表"这是一个真实
玩家能合法到达的状态"（design D2），而进入 `Game` 唯一的门是 Start 的点击，
所以任何真实玩家到了这里，bgm 必然已经在播。`AGENTS.md`/`README.md`/
`skills/game-flow-and-hud/SKILL.md` 都同步补了这一条，防止未来重写
`GameScene` 时把它当"重复代码"删掉。

真机证据（脚手架出的独立项目，`PLAYWRIGHT_BROWSERS_PATH` 指向本机
ms-playwright 缓存，`pnpm install && pnpm verify`，三个场景）：

- **无 `public/game-assets.json`**：`AU asset usage — absent`，
  `passed: true`，exit 0——与改动前逐字节一致。
- **声明 title/bg-level1/角色 player/bgm，全部合成素材真实放在
  `public/assets/`，`GameScene`/`StartScene` 未改动**：
  `AU asset usage — judged: PASS — 4/4 declared asset(s) loaded; bgm playing;
  background in use (bg-level1); characters 1/1 in use; title in use`，
  `passed: true`，exit 0。
- **同一份清单，人为把 `StartScene`/`GameScene` 里两处 `sound.play(bgm)`
  调用都删掉（模拟一个真正没接对 bgm 的生成项目）**：
  `AU asset usage — judged: FAIL — 4/4 declared asset(s) loaded; bgm declared
  (bgm) but not currently playing`，`passed: false`，**exit 1**，IA 仍然
  7/7 通过，互不干扰。

变异验证（手动把 `judgeAssetUsage()` 的分类判据整段换回旧的"整体至少一个在
用"分支，重新跑 `tests/asset-usage.test.mjs`，随后已还原并重新确认 20/20
全绿）：20 个用例里 9 个变红，其中包括专门复刻真实缺陷形状的 REGRESSION 用例
和断言"新旧判据必须不一致"的 MUTATION GUARD 用例——证明新判据确实在做旧判据
做不到的事，不是换了措辞而已。

`node --test`：本模板全部 145 个用例（含新增到 20 个的
`asset-usage.test.mjs`）全绿。`pnpm check-types`（脚手架出的真实项目）：
0 错误。仓库级 `pnpm lint`/`pnpm check-types`/`pnpm align:check`/
`pnpm arch:check` 全绿；`packages/cli`/`packages/minimax` 的 `vitest run`
除一个与本改动完全无关的既有超时用例（`scaffolds web-nextjs: rewrites root
package.json`，在改动前的 `main` 上用 `git stash` 核实过同样超时）外全绿。
