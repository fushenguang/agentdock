---
'@cogito.ai/cli': patch
---

`game-web-phaser` 真机验收暴露：平台把 AI 生成的素材投进项目、清单形状对、
`PreloadScene` 也把文件真的加载进了纹理/音频缓存，`pnpm verify` 的 BH-0/BH-1/
BH-2 与 IA 7 条断言全绿——但产物实测 `Level1`…`Level5` 的 `add.image` 命中数
全是 0，背景图、角色贴图一处没用上，构建者试玩时也确认「没有背景音乐，没有
使用 AI 设计的人物形象」。根因：现有闸门只判"文件有没有被加载"，对"加载的
文件有没有被真的画出来/播放出来"完全没有区分力，只能靠人玩才能发现。

这一刀给 `pnpm verify` 加一道新闸门 **AU（素材使用）**，紧跟在 BH-2 之后、
IA 之前，回答两个问题：

1. **清单里列出的素材，有几个真的进了运行时**——`src/debug/harness.ts` 新增
   `readAssetUsage()`：从 `PreloadScene` 已经缓存的清单原始文本（新导出常量
   `game-assets.ts` 的 `GAME_ASSETS_RAW_CACHE_KEY`，避免"同一事实存两份"）
   重新跑一遍 `normalizeGameAssets()`/`planAssetLoads()`，逐个查
   `this.textures.exists(key)` / `this.cache.audio.exists(key)`。
2. **当前场景里，背景/角色是不是真的在用这些纹理**——`usedImageKeys()` 扫描
   每个当前激活场景的直接子级，找 `.texture.key` 命中声明纹理的 GameObject；
   `usedAudioKeys()` 查 `game.sound.get(key)`，证明该音频 key 至少被
   `.add()`/`.play()` 引用过一次。两者都诚实标注了能证明什么、不能证明什么
   （证明不了"画得好看"或"真的能听见"）。

`HarnessSnapshot` 新增 `assets: AssetUsageSnapshot | null` 字段
（`src/debug/harness-types.ts`），`null` 表示"这次快照没有清单"，与 `score`
字段的 `null` 约定一致。新增 `scripts/lib/asset-usage.mjs` 的纯函数
`judgeAssetUsage()`，把一个或多个快照的 `assets` 字段合并判成三态，与
`assert.mjs`/`exit-decision.mjs` 已有的 IA 三态纪律完全一致：

- **`absent`**——本次运行每个快照的 `assets` 都是 `null`（没有清单）。**不算
  失败**：大多数已生成项目从未声明过清单。
- **`unavailable`**——一个快照都没有带 `assets` 字段（构建自更旧的、还没有
  这道闸的 harness，或调用方一次快照都没拿到）。**算失败**——"读不懂就判
  unavailable，绝不默认通过"。
- **`judged`**——真的比较过，再细分两种 `passed: false`：清单声明了但一个都
  没进缓存；或者进了缓存但当前场景/声音管理器里一个都没用上（正是本刀要抓
  的那个真实缺陷）。

`scripts/verify.mjs` 把 AU 挂在已有的两次 entity-bounds 快照上（`applyState()`
到 gameplay 状态前后各一次），零额外 CDP 往返；`judgeAssetUsage()` 对两次快照
的 `usedInScene` 取并集，这样标题页素材（只在 Start 状态可见）和关卡素材
（只在 gameplay 状态可见）都不会被单次快照的时间点遗漏。AU 失败会让整个
`pnpm verify` 退出非零、`.verify-result.json` 新增顶层字段 `assetUsage`（同
`assertions` 一样不升 `schemaVersion`），并新增一条 `gates[]` 行——`absent`
时不占行，`unavailable`/`judged`-失败都占。顺带修了一处因为"以前只有 IA
能让 exit code 非零"这个假设写死的日志分支：AU 单独失败、IA 全过的情况下，
原代码会误打印"IA assertions — FAILED (0/0 failed)"，现在按各自状态精确归因。

未改动清单契约的形状（`GameAssetEntry`/`GameAssets` 一个字段没动）、未碰
`dimensions.ts`、未加任何运行时依赖（`scripts/lib/asset-usage.mjs` 与
`src/debug/harness.ts` 的新增函数都只用已有的 `game-assets.ts` 导出）、没有
为任何具体游戏写特判。

真机证据（`agentdock init` 脚手架出的三个独立项目，
`PLAYWRIGHT_BROWSERS_PATH` 指向本机 ms-playwright 缓存，`pnpm install &&
pnpm verify`）：

- **无 `public/game-assets.json`**（常态）：`AU asset usage — absent`，
  `.verify-result.json` 无 `AU` 行，`passed: true`，exit 0，与改动前完全一致。
- **声明 `characters.guard`（合成 PNG）、但模板默认代码从不绘制非
  player 角色**：`AU asset usage — judged: FAIL — 1/1 declared asset(s)
  loaded (guard) but none of them are referenced by any GameObject...`，
  `gates` 新增 `{"id":"AU","passed":false}`，`passed: false`，**exit 1**——
  IA 仍然 7/7 通过，两者互不干扰。
- **声明 `backgrounds.level1`（合成 PNG），`GameScene` 默认调用的
  `applyLevelBackground()` 会真的画它**：`AU asset usage — judged: PASS —
  1/1 declared asset(s) loaded, 1 in active use (bg-level1)`，
  `passed: true`，exit 0。

变异验证：手动把 `judgeAssetUsage()` 里"loaded 但 usedInScene 为空"分支的
`passed` 改成 `true`（模拟"没用上也算过"），`tests/asset-usage.test.mjs` 的
mutation-check 用例按预期变红，随后已还原并重新确认 11/11 全绿。

`node --test`：本模板全部 136 个用例（125 个既有 + 11 个新增
`asset-usage.test.mjs`）全绿。`pnpm check-types`（脚手架出的真实项目，非
mock）：0 错误。仓库级 `pnpm lint`/`pnpm align:check`/`pnpm arch:check` 全绿；
`packages/cli` 的 `vitest run` 除一个与本改动无关的既有超时用例
（`scaffolds web-nextjs: rewrites root package.json`，在改动前的 `main`
上同样超时，已用 `git stash` 核实）外全绿。

`AGENTS.md`/`README.md` 同步补了 AU 闸门的说明（rule 8、Project layout、
Verifying 一节的"Asset usage judging (AU)"小节）。
