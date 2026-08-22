---
'@cogito.ai/cli': patch
---

`game-web-phaser` 模板真机验收当场暴露：构建者要求「背景、人物直接用 AI 生成，而
不是用形状代替」，执行者删掉了 `GameScene.ts`、自己写了 `Level1Scene`…`Level5Scene`，
结果五个关卡全是纯色背景 + 色块角色——真机取证 `add.image` 命中数在五个关卡全是 0，
`sound` 命中数也全是 0。根因：`GameScene` 是模板里唯一演示"怎么用背景图/角色贴图"
的地方，它一删，写法就跟着失传了，因为这段逻辑此前是 `GameScene` 的私有方法。

这一刀把"新写的可玩场景怎么消费 `game-assets.json` 清单里的素材"固化成
`game-flow-and-hud` skill 里的明文约定，不再依赖 `GameScene` 这一个类存活：

- `src/game-assets.ts` 新增 `applyLevelBackground(scene, level, width, height)`——
  一个鸭子类型（`BackgroundHostScene`）的共享 helper：检查关卡背景纹理是否已加载，
  加载了就居中绘制、按尺寸铺满、`setDepth(-1)` 压到最底层；没加载就是纯粹的
  no-op（返回 `false`），调用方原有的纯色填充/占位形状就是回退——不猜测、不新增
  任何加载请求。保持零 import（结构类型而非 `import type Phaser`），延续
  `dimensions.ts`/本文件其余部分"裸 Node 可测"的纪律。
- `GameScene.ts`（模板仍保留的参考实现）改为调用这个共享 helper，而不是维护自己的
  私有 `drawLevelBackground()` 方法体——既消除重复，也让"删掉 GameScene 之后这段
  逻辑去哪了"这个问题有一个明确、独立于该类的答案。
- `SKILL.md` 新增一节「Writing a New Playable Scene? This Wiring Comes With It —
  It Is Not `GameScene`'s Private Business」：把这次真实事故写进去，给出可直接抄的
  最小代码，并列出新场景必须搬过去的五件事（背景 helper、玩家贴图键、其他角色的
  manifest 守卫、BGM 留在 `StartScene`、HUD 的 launch/stop 配对）。Gotchas 列表
  新增对应条目；触发词加入"deleting GameScene / new level scene / LevelScene /
  applyLevelBackground"。
- `tests/game-assets.test.mjs` 新增 `applyLevelBackground()` 的单测（用鸭子类型
  mock，不依赖 Phaser/DOM）：清单里有该关背景 ⇒ 铺上、没有 ⇒ 不发请求不抛错、
  只认自己那一关的 key、外加一条变异检验——手写一个忽略 guard 的"坏版本"，证明
  它确实会在没有纹理证据时绘制，而真实的 `applyLevelBackground()` 不会。

顺带修了一个挡在验收路径最前面、与本次改动本身无关但会让 `pnpm install` 直接
跑不起来的缺陷：`templates/game-web-phaser/pnpm-workspace.yaml` 只写了
`allowBuilds`、没写 `packages` 字段。实测（`agentdock init` 脚手架出的独立项目，
pnpm 9.0.0 与 npx pnpm@11.17.0 都复现）：这个文件一旦存在但缺 `packages`，
`pnpm install` 直接报 `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION packages field
missing or empty`——比这个文件当初要修的 `ERR_PNPM_IGNORED_BUILDS` 更早更彻底
地挡路，install 本身都跑不起来。补上 `packages: []`（这个模板不是多包 workspace，
空数组就是字面意义上正确的值）。

真机证据（`agentdock init` 脚手架出的独立项目，`PLAYWRIGHT_BROWSERS_PATH` 指向
本机 ms-playwright 缓存）：
- 无 `public/game-assets.json`（常态）：`pnpm install && pnpm verify` — BH-0/
  BH-1/BH-2 全过，IA 7/7 全过，`.verify-result.json` `passed: true`。
- 补一份带 `backgrounds.level1` + `characters.player` 的合成 manifest 与合成
  PNG 复跑：同样 BH-0/BH-1/BH-2 全过、IA 7/7 全过——新增的三个文件请求
  （`game-assets.json`/`bg/level1.png`/`char/player.png`）均无 `Network.loadingFailed`，
  证明真实存在时这条路径同样不出错。
- `node --test`：本模板 25 个 `game-assets.test.mjs` 用例 + 全部 125 个测试全绿；
  手动把 `applyLevelBackground()` 的 guard 临时改成无条件绘制，重跑后"无纹理时
  不应绘制"那条用例按预期变红，随后已还原。
- `pnpm check-types`（在脚手架出的真实项目里，非 mock）：0 错误——确认
  `BackgroundHostScene` 这个鸭子类型接口与真实 `Phaser.Scene`/`Phaser.GameObjects.Image`
  结构兼容。
