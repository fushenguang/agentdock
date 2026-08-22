---
'@cogito.ai/cli': minor
---

`game-web-phaser` 模板新增开始页（`StartScene`）与平台素材投递契约
(`game-assets.json`)，落实构建者的两条方向：「即使是原型也从开始页做起，当成完整
游戏」，以及「背景音乐/背景/人物直接用 AI 生成，而不是用形状代替」：

- **`StartScene`**：接入 `Boot -> Preload -> Start -> Game` 链路，成为进入
  `Game` 的唯一入口（标题读 `document.title`、副标、「开始游戏」按钮）。同步更新
  `debug/state-jump.ts`（`StateId` 新增 `'Start'`）与 `debug/harness.ts`
  （`STATE_ROLES` 新增 `Start: 'other'`，与 Boot/Preload 同类，区别于被排除在
  state 之外的并行 `UiScene`）
- **`game-assets.json` 契约**（`src/game-assets.ts`，仿 `game-doc.ts` 同形）：
  描述 `public/assets/title.png` / `bg/level<N>.png` / `char/<slug>.png` /
  `bgm/main.mp3` 四类平台生成素材的相对路径、人话描述、所属关卡。`PreloadScene`
  按清单加载，清单缺失/损坏/单个文件 404 时优雅退化到既有形状占位，绝不白屏、
  绝不抛异常、绝不多发一个猜测性请求（`planAssetLoads()` 是纯函数，见
  `tests/game-assets.test.mjs` 的缺失退化与变异验证）
- **BGM**：`StartScene`「开始游戏」点击（唯一的用户手势）内启动循环播放，
  `UiScene` 新增静音开关（只切 `this.sound.mute`，不控制播放本身）
- **一处真实 bug，由新增场景暴露而非凭空引入**：`GameScene.create()`
  补一行 `this.scene.stop('Start')`——`applyState()`（`pnpm verify` 的 IA
  判据用来跳转状态）走的是 `game.scene.start(id)`（Phaser 顶层 SceneManager），
  不会像场景自身的 `this.scene.start()` 那样连带停掉调用方场景；不补这一行会让
  `Start` 场景在自动化判据下永远停留在活跃列表里，`activeGameplayScene()` 因
  排序优先命中 `Start` 而不是真正在跑的 `Game`
- **`this.load.json()` → `this.load.text()` + 自控 `try/catch`**：manifest 用
  `this.load.text()` 加载、`safeParseJson()` 解析——Phaser 自带的 JSON 加载器
  遇到「200 但 body 不是合法 JSON」会在其内部 `JSON.parse()` 处直接抛出未捕获
  异常（404 本身不会，这条已有 `game-doc.json` 先例），实测会打红
  `scripts/verify.mjs` 的 BH-1 闸门
- `skills/game-flow-and-hud/SKILL.md` 新增「Platform-Delivered Assets」一节

新增测试覆盖：清单解析、缺失/malformed 退化、`level<N>` 键与关卡序号对应、
`safeParseJson` 的异常隔离。本地 `pnpm verify`（无素材 / 有素材 / 单文件 404 /
manifest 损坏四种场景）与 `pnpm test` 均已跑绿。

不在本次范围：不动 `src/game-doc.ts` / `doc-panel*.ts` 既有行为；不改
`dimensions.ts` 的 `HUD_BAND_HEIGHT`/`PLAYFIELD_HEIGHT`；不动
`web-nextjs` / `skills-registry` 两个模板；模板不自带示例素材文件。
