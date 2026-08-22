# @cogito.ai/cli

## 0.19.2

### Patch Changes

- 241740f: `game-web-phaser` 真机验收暴露：平台把 AI 生成的素材投进项目、清单形状对、
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

## 0.19.1

### Patch Changes

- 593f593: `init` 脚手架出来的项目里，`{{PROJECT_NAME}}` 直接原样出现在玩家能看到的地方——
  `game-web-phaser` 开始页标题、浏览器标签页、以及三个模板的 `README.md`——因为
  `init` 一直只是把模板拷贝过去，从没拿 `--name` 替换过这个占位符。
  - `scaffoldProject`（`packages/cli/src/core/scaffold.ts`）在拷贝模板、改写
    `package.json` 之后，新增一步 `replaceProjectNamePlaceholder`：把目标目录里
    所有文本文件中的 `{{PROJECT_NAME}}`（单一来源常量 `PROJECT_NAME_PLACEHOLDER`）
    替换成 `--name` 的值
  - **白名单而非黑名单**：只处理 `.ts/.tsx/.js/.jsx/.mjs/.cjs/.json/.html/.md/
.mdx/.css/.yml/.yaml/.txt`，其余一律跳过——模板里未来可能带 `.mp3`/`.png`
    等二进制资产，按字节做字符串替换会直接损坏它们
  - 跳过 `node_modules`、`.git`、`dist` 三个目录，不管出现在树的哪一层
  - `--name` 的值会原样落进 HTML `<title>` 文本节点与 TS/JS 字符串字面量。两条
    路线里选了**校验而非转义**：新增 `validateProjectName`，在动文件系统之前
    拒绝含 `< > & " ' \`` \\` 或控制字符的名字（`scaffoldProject` 新增
    `INVALID_NAME` 错误分支）。选校验不选转义的原因写在代码注释里——转义要按
    每个文件的语法上下文分别处理（HTML 用实体编码、TS 字符串用 JS 转义……），
    漏一个新文件/新上下文就静默出错；校验只有一处，两个适配器（agent/human）
    都会经过同一个 `scaffoldProject` 入口
  - Unicode/中文名字（如「金鹅小镇」）不受影响，只挡语法层面会破字符串/标签的字符

  新增 `packages/cli/src/core/__tests__/scaffoldPlaceholder.test.ts`：文本文件被
  替换、伪造的二进制 `.png`（含占位符字节）逐字节不变、`node_modules`/`.git`/
  `dist` 不被进入、不安全字符名被 `scaffoldProject` 在建目录前就拒绝。

- b99b986: `game-web-phaser` 模板真机验收当场暴露：构建者要求「背景、人物直接用 AI 生成，而
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

## 0.19.0

### Minor Changes

- 791fa53: `game-web-phaser` 模板新增开始页（`StartScene`）与平台素材投递契约
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

## 0.18.0

### Minor Changes

- d39f577: `game-web-phaser` 模板补发三项此前已合入 `main` 但从未发布的能力（PR #70/#71/#72，
  `.changeset/` 当时全部漏加，`npm pack @cogito.ai/cli@0.17.0` 实测解包后 `game-doc` /
  `doc-panel` / `UiScene` / `game-flow-and-hud` 零命中——脚手架出来的项目此前一直拿不到
  这三刀）：
  - **HUD 带 + 独立 UI Scene**：`dimensions.ts` 新增 `HUD_BAND_HEIGHT` /
    `PLAYFIELD_HEIGHT` 常量，把「世界几何必须落在可玩区、HUD 必须落在 HUD 带」这条约束
    前移到骨架层；新增并行的 `UiScene`（`registry.events` 事件驱动更新 + `SHUTDOWN`
    时解绑监听器，不再每帧轮询），修复此前 HUD 元素与游戏世界元素几何重叠的问题
  - **平台自带 `game-flow-and-hud` skill**：随 Phaser 官方 28 个 skill 一起，由
    `postinstall`（`scripts/install-phaser-skills.mjs`，现支持两个 skill 来源）注入
    Shelley 的 skill 目录，供执行者按需激活
  - **游戏内文档面板**：HUD 带内新增「?」悬浮入口，点开展示 `public/game-doc.json`
    描述的游戏背景/玩法/当前关卡/未做事项，供人工试玩时对照设计意图判断——`game-doc.json`
    不存在时入口不显示，不会露出空面板

  不在本次范围：不动 `web-nextjs` / `skills-registry` 两个模板；`PLATFORM_CONTEXT` 常量
  未翻转（各模板独立演进）。

## 0.17.0

### Minor Changes

- 25c6135: `game-web-phaser` 模板新增 `postinstall`（`scripts/install-phaser-skills.mjs`），把
  `node_modules/phaser/skills/` 下的 28 个官方 Phaser 4 skill（连同 8 个带 `references/`
  的 `REFERENCE.md`）复制进 `${HOME}/.config/shelley/`，让 Shelley 能看到并按需激活它们。

  **背景**：这些 skill 随 Phaser 4 升级已经装进每个生成项目的 `node_modules`，但此前没有
  任何通道把它们接到 Shelley 的 skill 目录——素材在磁盘上，执行者看不见、也不会自己去翻。
  - 路径由 `${HOME}` 在运行时推导，不硬编码 `/root/.config` 或 `/.config`
    （VM guest 里 `HOME=/`，硬编码会静默失效）
  - 守卫：`${HOME}/.config/shelley` 不存在时 no-op、退出 0——开发者本机不会被写入
  - 复制整个 skill 目录（不只 `SKILL.md`），幂等可重复运行
  - 零新依赖，只用 Node 内置 `fs`/`path`/`url`

## 0.16.0

### Minor Changes

- 19af3d6: `skill publish` 现在始终打印解析出的 `source`/`path`，并在 skill 自己所在仓库与
  `--registry` checkout 的 `origin` 不一致时大声告警；`publishSkill()`/`--json`
  输出相应新增 `registrySource` / `sourceRepoDiffersFromRegistry` 字段。

  **起因是一次真实的踩坑**：`entry.source`/`entry.path` 一直来自 skill 自己所在的 git
  仓库（其 `origin` remote），而不是 `--registry` 指向的仓库——这个行为本身没变，但此前
  输出对此只字不提。一次从私有仓库发布、`--registry` 指向公开内容仓的真实操作，因此
  写出了一条 `source` 指向私有仓库的 manifest 条目，装的人会在 `git clone` 那一步失败，
  私有仓库地址也就此进了一份公开文件——而人类可读输出和 `--json` 都没有任何信号能看出
  这一层。
  - 人类/agent 两种输出模式都新增一行 `source: <url> (path: <path>)`，无论是否与
    `--registry` 一致都会打印
  - 当 skill 自己仓库的 `origin` 与 `--registry` checkout 自己的 `origin` 不同（且两者都
    能解析出）时，额外打印一条醒目告警——这是告警，不是拦截：从私有/无关仓库发布 skill
    仍然是合法场景
  - `SkillPublishResult` 新增 `registrySource?: string`（`--registry` checkout 自己
    解析出的 `origin`，仅在能解析出时出现）与 `sourceRepoDiffersFromRegistry?: boolean`
    （仅在 `registrySource` 同时存在时出现，避免"解析不出"被误读成"确认一致"）
  - 刻意不检测"这个仓库是不是私有"——那需要联网请求与鉴权，不可靠；只把解析出的
    `source` 摆出来，判断留给发布者自己

  **未变化的行为**：`source`/`path` 的来源和取值逻辑本身没有任何改动，这次只是让已有
  行为对用户可见；manifest 写入、索引请求的时机与条件均未触碰。

## 0.15.0

### Minor Changes

- ca9e25a: `skill publish` 索引进 registry 时现在会带上 skill 在仓库内的 `path` 与所在 `branch`，
  让服务端能拼出 skill 级的 `git_url`，而不再是仓库根 URL。

  **这修的是一个真实的付费绕过**：registry 之前只存到仓库根 URL，安装门用它下载时会把
  该仓库下**全部** skill 一起装下来——在一个多 skill 仓库里装一个免费 skill，会连同仓库里
  的付费 skill 一起被装进去（thefoolai 侧已先上线止血）。
  - 请求体新增 `path?`（镜像 manifest 条目自身的 `path` 字段，skill 在仓库根目录时省略）
    与必填的 `branch`（`git branch --show-current`，取不到时回退 `main`）
  - 索引失败时的报错更可操作：非 2xx 响应会读服务端 JSON body 的 `message`，不再折叠成
    裸的 `HTTP <status>`；拿不到有效信息时才退回"升级到最新 CLI"的提示

  **未变化的行为**：未登录仍不发索引请求；索引请求失败仍只告警、不阻塞不回滚已经写好的
  manifest；老服务端目前按固定字段读 body、没有"未知字段拒绝"逻辑，会直接忽略新增的
  `path`/`branch`，因此这是纯新增字段、不影响现有 publish 流程。

## 0.14.0

### Minor Changes

- 8ed798c: `game-web-phaser` 模板：`phaser` 依赖从 `^3.90.0` 升到 `^4.2.1`。

  🔴 **破坏性提示：从本版本起，新脚手架出来的 `game-web-phaser` 项目默认是 Phaser 4，
  不再是 Phaser 3。** 已经生成的存量项目不受影响——它们的 `package.json` 已经锁定了自己的
  版本，不会因为模板升级而改变依赖。

  起因：这个决定四个月前已经拍板（"如果 4.x 协议仍是开放的，那就把模板升级到 4.x"），但代码
  一直没跟上——本次落地，不重开讨论。

  改了什么：
  - `templates/game-web-phaser/package.json`：`phaser` 依赖版本升级，lockfile 同步锁定 `4.2.1`
  - 新增 `templates/game-web-phaser/.npmrc`，固定指向 `mirrors.tencent.com/npm`——本机默认源
    `registry.npmmirror.com` 上的 `phaser@4.2.1` 直接 404（该源的 phaser 副本停在 2026-04-10、
    最高只到 4.0.0），腾讯源实测有货且最快。只有这一个模板写这一行，其余两个模板未受这个问题
    阻塞，未改动
  - 复核了官方 Migration Guide 里最容易踩的三处（纹理坐标原点翻转、`Math.TAU` 语义改变、
    Pipeline→RenderNode / `setTintFill()` 移除）——模板实际用到的 API 面很窄，`grep` 确认
    零命中，`pnpm verify`（BH-0/1/2 + 7/7 IA 断言）全绿，未改动任何判据
  - `node_modules/phaser/skills/` 下的 28 个官方 `SKILL.md` 随依赖到位（本刀只让它们变得
    可得，不负责接入 Shelley 的 skill 目录——那是另一刀的范围）
  - 模板文档（`AGENTS.md` / `README.md`）里的 "Phaser 3" 字样同步更新为 "Phaser 4"

  不在本次范围内（各有独立理由，见
  `openspec/changes/phaser4-template-upgrade/design.md`）：
  - cogito-lib 的 `PLATFORM_CONTEXT`（它是喂给每一次 Run 的全局常量，翻转会让存量 Phaser 3
    项目被错误地告知按 Phaser 4 写——需要单独设计，已记入 backlog）
  - 把 28 个 skill 接进 Shelley 的 skill 目录
  - 其它两个模板（`web-nextjs` / `skills-registry`）

## 0.13.0

### Minor Changes

- 6854699: `game-web-phaser` 模板：把「触发器只能做真实玩家能造成的事」从散文纪律挪进代码层，并给 BH-2
  加一条独立于 `assertions.json` 的越界判据。

  起因是一次真实事故：一版平台跳跃游戏里旗子与刺一直下坠、掉出画面，构建者试玩当场发现，
  **而四道机器闸全绿、IA 6/6**。根因不在断言判错了对象——判的确实是清单里那几条——而在断言的
  **触发方式**：`registerTrigger('level_advance', () => this.player.setPosition(goal.x, goal.y))`
  把玩家传送到旗子的**当前**位置。旗子掉到哪，玩家就被传送到哪，overlap 照常触发、分数照常变。
  **断言与被验对象共同移动，因此对这个 bug 完全免疫。**

  模板 `AGENTS.md` 规则 6 早就写着"handler 只能做真实玩家能造成的事"，但那一条**明写着靠人工
  review 兜、不靠类型系统**——这次就是它失效了。所以本次改的不是补一条规矩，是让平台自己判：
  - **触发器完整性**：`fire()` 在**同步**调用 handler 的前后各读一次名为 `player` 的实体坐标
    （两次读取之间没有 `await`，其间不可能插入物理步，因此自然位移必为 0，任何差值都只能是
    handler 自己造成的）。坐标变化即抛错，该条断言以「触发器违规」计红——**等值比较，无阈值**，
    免疫性与位移大小无关。`player` 因此从参考实现的习惯升成命名契约；项目若没有该实体，
    不判红，但 `.verify-result.json` 里会**可见地**记下"这项检查没运行"。
  - **BH-2 越界判据**：`getSnapshot().entities` 里每个命名实体必须落在世界边界内
    （优先 `physics.world.bounds`，退回画布尺寸，**采用哪一个会写进 detail**）。采样两次：
    加载 settle 后一次，再 `applyState(gameplay)` 后等一个观察窗口采一次，任一次出界即红。
    ⚠️ 如实标注：它是**采样判据不是不变量**，比观察窗口更慢的漂移抓不到。
  - **`pnpm verify` 不再漏进程**：`fail()` 原本以 `process.exit(1)` 结束，**跳过了 `finally`**
    ——于是每一次失败的 verify 都留下一棵 headless Chrome 与一个静态服务器。实测捞到过一棵活了
    11 分钟、GPU helper 吃 24% CPU 的孤儿进程树。在 VM 里 verify 失败是常态不是例外，
    这条泄漏走的正是最常走的那条路。现在所有退出路径都走同一个 `finally`。

## 0.12.0

### Minor Changes

- a8f9fdb: `skill publish` 写完 manifest 后会额外把条目索引进托管 registry，web 可查看、app 可安装

  之前 `skill publish` 只写本地 git manifest（`skills.json`）——发布出去的 skill 从来没有
  一条在 thefoolai 托管 `skills_registry` 里出现过：web 看不到、app 装不了。现在 manifest
  写入成功之后，CLI 会额外 `POST {webUrl}/api/skills/publish`（`Authorization: Bearer
<access_token>`，复用 `cli-auth-via-endpoint` 已建立的零密钥传输——磁盘上已有登录凭据即可，
  不引入任何新密钥/配置）。

  请求体只含 `skill_id` / `git_url` / `name` / `description` / `version?` / `license?`；
  `access_tier` / `is_official` / 任何扫描或安全状态字段全部由服务端赋值，CLI 从不携带。

  边界（未变化的行为）：
  - 未登录时**不发请求**，`skill publish` 照常只写 manifest
  - 请求失败（含端点不可达、超时、非 2xx）**只告警，绝不阻塞、绝不回滚**已经写好的 manifest
  - **不重试**——一次性、15s 超时的尽力而为调用，不是登录轮询那种退避重试

  适配层（`agentdock skill publish` 的人类可读输出与 `--json` 输出）会区分"未登录跳过"与
  "请求失败"两种告警，索引成功时不额外输出。

## 0.11.0

### Minor Changes

- d23b887: `agentdock auth` 现在零配置可用，且 `skill publish` 的署名会带上可读名字

  之前 `agentdock auth login` / `logout` / `status` 必须先手动配一个 `AGENTDOCK_AUTH_ANON_KEY`
  才能用，否则直接报 `PROVIDER_NOT_CONFIGURED`。现在 CLI 改为调用 provider 的
  `{webUrl}/api/device-auth/consume` HTTP 端点（而不是直连 PostgREST RPC），不再
  需要任何密钥——**装完就能登录**，不用先配置环境变量。
  - `agentdock auth login`：打开系统浏览器完成授权，凭据保存到 `~/.agentdock/credentials.json`（权限 `0600`）
  - `agentdock auth logout`：清除本地凭据
  - `agentdock auth status`：查看当前登录身份（从不打印 token）
  - 想指向自建 hub：设置 `AGENTDOCK_AUTH_WEB_URL`，或在 `~/.agentdock/config.json` 里配置具名 provider——不用改代码、不用传密钥
  - 旧的 `AGENTDOCK_AUTH_ANON_KEY` / `AGENTDOCK_AUTH_SUPABASE_URL` 如果还设置着，现在只打一条"已不再需要"的提示，不会报错

  `agentdock skill publish` 产出的 manifest 条目里，登录后的 `author` 字段现在会带上
  服务端解析出的可读名字（`author.name`），而不只是一个 UUID（`author.id`）——旧版本
  只有 `id` 是预期行为，不需要重新登录来补。

  **未变化**：`skill publish` 未登录仍可正常发布，只是 manifest 条目不带 `author`；
  登录流程本身（浏览器授权、轮询节奏、5 分钟超时上限）不变。

  ***

  `agentdock skill publish` 新增 skill 版本号（semver）门

  manifest 条目现在可以带一个 `version` 字段，从 `SKILL.md` frontmatter 的
  `metadata.version`（或 thefoolai 现有的 `metadata['thefool.version']`）读取——
  **不读顶层 frontmatter**，因为 Agent Skills 规范本身没有 `version` 这个顶层键。
  - 提供的版本必须是合法 semver（`major.minor.patch`，可选 `-prerelease` /
    `+build` 后缀，例如 `1.2.3` 或 `1.2.3-beta.1`）；`v1.2.0`、`2026-08-19`、
    `1.x`、`latest` 这类形状一律在 publish 时直接拒绝（`SKILL_VERSION_INVALID`），
    错误信息会同时给出收到的值与期望形状
  - 没提供版本不会阻止发布，但会打一条醒目告警——没有版本号的条目今后无法和它自己
    的新版本做 diff
  - 幂等：同一 skill 重复 publish，manifest 里的版本会被新值覆盖，不会产生重复条目

## 0.10.0

### Minor Changes

- ccdba3a: `skills-registry` 模板新增第四道 CI 门：`scripts/gates/license-provenance.mjs`（`pnpm
gate:license-provenance`，已接入 `pnpm gates` 与 `.github/workflows/gates.yml`）。

  既有三道门都不回答"我有没有权利发布这个 skill"：门①查结构合法、门②查 manifest 新鲜、门③查
  有没有泄漏宿主自己的身份——第三方版权与宿主身份是正交的两件事，一份 `© <year> <holder>` 声明
  里没有一个字符属于宿主，门③永远不会看它一眼。这道缺口是真实发生过的：三道门全绿、8 个 skill
  被门③判为"干净"，逐个打开许可才发现其中 5 个不是自有内容（2 个供应商专有、3 个
  Apache-2.0）——差一步把别人的专有内容推成公开 MIT 仓。

  门④对每个 `skills/<name>/` 收集三类证据（目录内 `LICENSE*`/`NOTICE*` 文件、`SKILL.md`
  frontmatter 的 `license` 字段、正文中的版权声明形状）并与新增的 `license-policy.json`
  （仓库自身许可 + 允许转发的第三方许可白名单 + 已登记的转发 skill 列表，数据不是代码）比对。
  默认保守：发现任何证据且未显式登记为"第三方转发"即失败；已登记的转发 skill 仍需声明许可在
  白名单内、原始许可文件确实在场。不做法律判断，不自动改写许可，只指出证据与声明不一致，由人
  处理。

  选 **minor**：新增能力，向后兼容——已存在的 `skills-registry` 仓库升级 CLI 后需要补一份
  `license-policy.json`（模板会随下一次 `agentdock init` 自带），门本身不回填历史仓库的配置。

## 0.9.0

### Minor Changes

- 3e19711: 新增 `skills-registry` 项目模板（`agentdock init --template skills-registry`）

  用于初始化一个公开的 Agent Skills 内容仓：`skills/<name>/SKILL.md` 正典 + 根目录生成的
  `skills.json` manifest + Fumadocs 文档站，并预置三道 day-one CI 门（纯 Node ESM，零构建步骤）：
  - 门①全量校验——对 `skills/` 下每一个目录跑 `agentdock skill validate`，不是只跑改动的
  - 门②manifest 新鲜度——重新 publish 全部 skill 与已提交的 `skills.json` 对账（忽略
    `publishedAt`，逐字比较其余字段），同时校验 `apps/docs/content/docs/skills/*` 是否与
    `skills.json` 保持同步
  - 门③公私边界——按可配置的 `boundary-rules.json` 正则表扫描全部 git 跟踪文件，拦截私有仓路径 /
    内部域名 / 个人可识别模式

  由 `web-nextjs` 模板派生，去掉 `apps/web`、`supabase/`、`packages/openspec-docs-sync/`；
  `openspec/` 收窄为只管基建/契约变更（manifest schema、门规则、文档结构），新增一个 skill 不需要
  proposal，只需要 `agentdock skill validate` 通过 + PR review。

  选 **minor**：新增的项目模板是向后兼容的新能力，不是缺陷修复——和 `cli-skill-publish.md`
  （新增 `skill` 子命令族）同一判断。

  > ⚠️ 已知未完成项：`templates/skills-registry/package.json` 里 `@cogito.ai/cli` 的
  > devDependency 目前是占位符 `PENDING-SEE-TASK-2.7`（等
  > `feat/cli-publish-source-normalization` 分支合并发版后填入真实版本号，见本 change 的
  > `tasks.md` 2.7）；补上真实版本号需要再发一版才能让 `init` 出的项目真正 `pnpm install` 通过。

## 0.8.1

### Patch Changes

- 2c655c2: `skill publish`: normalize the manifest `source` into an anonymous, credential-free URL.

  Previously the raw output of `git remote get-url origin` was written verbatim, so whether a
  published manifest could be installed by anyone else depended on the publisher's local git
  config — the same repo published by two contributors produced one installable and one
  non-installable manifest, and the difference was invisible to the publisher (their own clone
  always works).

  SSH (`git@host:owner/repo.git`), `ssh://`, `git+ssh://` and `git://` forms are now normalized to
  `https://host/owner/repo`. Credentials embedded in the URL (`https://user:token@host/...`) are
  stripped — a manifest is meant to be committed into a public registry repo. Remotes that cannot
  be normalized into something a stranger can clone (local paths, `file://`, dotless hosts that are
  almost certainly `~/.ssh/config` aliases) now fail with an actionable error instead of being
  written silently.

## 0.8.0

### Minor Changes

- 4d223bb: 新增 `agentdock skill validate` / `agentdock skill publish` 命令

  `skill validate <dir> [--json]` 全权委托官方参考实现 `skills-ref` 的 `validate()`
  校验 Agent Skill frontmatter；非 spec 顶层键（如宿主私有的 `pipeline`）降级为
  `warnings` 而非拒绝（`UNKNOWN_FIELDS_PREFIX` 前缀匹配），不强制上游未定义的私有
  约定。`skill publish <dir> --registry <path>` 先跑 validate、不通过不产出，产出
  的 manifest 条目写入 `--registry` 指定的**本地 registry checkout**（不 commit、
  不 push、不建 PR，交由人工 review），`source` 字段从 skill 目录所在 git 仓库的
  `origin` remote 自动解出；按 skill `name` 幂等更新，重复 publish 更新而非追加
  重复条目。

  新增外部依赖 `skills-ref`（纯 JS，`js-yaml`/`argparse`）；已验证仍可打进单文件
  bundle 在零 `node_modules` 环境下运行（design.md §3.2、§6-2）。

  选 **minor** 而非 patch：这是新增的 CLI 公开命令面（`skill` 子命令族），是向后
  兼容的新能力，不是缺陷修复。

## 0.7.1

### Patch Changes

- ed1432c: web-nextjs 模板：`UpgradeButton` 接入 dashboard header

  `add-payments-to-web-nextjs` 落地时定义了 `UpgradeButton` 组件，但从未在任何页面
  引用（`grep UpgradeButton` 除组件自身定义外零命中），验收清单第 11.6 项一直是
  未完成状态。现已接入 `src/components/dashboard/site-header.tsx`（header 右上角，
  `source="dashboard-header"`），点击跳转 `/pricing`，与既有 client 组件路由模式
  一致。`pnpm check-types` + `pnpm build`（apps/web）通过。

## 0.7.0

### Minor Changes

- cfcacd7: game-web-phaser 模板新增 IA 断言运行器：让「可判定」真的被判定

  BH 三闸（构建 / 加载 / 渲染）只能证明「东西跑起来了、画面上有东西」，
  证明不了「这个游戏真的能玩」。2026-08-12 一次真实 Run 把这个洞打了出来：
  产物 BH 三闸全绿，而真人一按空格就抛 `TypeError: a[l] is not a function`——
  交互层根本不在任何一闸的覆盖范围内。

  本次新增 `scripts/assert.mjs`（`runAssertions` + `RemoteHarness`），
  在 BH 之后追加一层 IA 断言，通过真实 CDP 驱动真实浏览器判定 7 个模板断言：
  `loads_clean` / `controllable` / `restart` / `hud_text_present` /
  `value_persists` / `score_feedback` / `game_over_trigger`。

  `.verify-result.json` 新增顶层 `assertions` 字段。
  🔴 消费者 **MUST NOT** 把它读成「IA 通过了」，除非
  `assertions.status === 'judged'` 且 `results` 里每一条都 passed——
  verify 中途夭折（BH 失败、浏览器没起来等）时该字段会是 `not_run` 带 reason，
  两者对消费者完全不同。IA 失败同样让 `pnpm verify` 退出非零（design D8）。

  **guest 真机验证已完成**（2026-08-12，Tarit guest VM）：
  `VERIFY_EXIT=0`，四闸 `BH-0/BH-1/BH-2/IA` 全 true，
  `assertions.status: "judged"`、7/7 通过，走真实 headless chromium + CDP，非 mock。
  模板自测 49/49 通过。

## 0.6.0

### Minor Changes

- c9022ef: Add a self-verifying test harness to the `game-web-phaser` template: `pnpm verify`
  runs three executable gates — build succeeds, headless Chromium loads the built
  game with no uncaught exception or failed resource request, and the rendered
  screenshot is provably non-empty (not just "a PNG exists") with a non-zero-size
  canvas. Zero new dependencies — it spawns whatever Chromium already exists in the
  environment and speaks CDP over Node's built-in `WebSocket`.

  Why: this template's `AGENTS.md` used to ask an agent to "take a screenshot and
  eyeball it" — prose an agent can silently skip and still report success. This
  replaces that floor check with an artifact that either passes or exits non-zero
  with what it expected vs. what it found; it never prints "skipping" and exits 0.

  Also new in this template:
  - A `listStates()` / `jump(id, seed?)` / `isValidStart(id, state)` state-jump
    contract (`src/debug/state-jump.ts`) plus a minimal Boot/Preload/Game reference
    implementation and a traversal assertion (`tests/state-jump.test.mjs`) that
    checks both legality and reproducibility of every state's `jump()`.
  - Two build targets: `build:play` (→ `dist-play/`, port 8080, the public share
    link — no debug panel) and `build:learn` (→ `dist-learn/`, port 8090, includes
    a debug panel). Which one you get is decided by the build target
    (`import.meta.env.MODE`), not a runtime switch anyone could flip in the
    browser.

  **Contract change**: the generated project's `package.json` now declares
  `engines.node: ">=22"` (up from `>=18`) — the zero-dependency CDP transport needs
  the built-in `WebSocket` global that only exists from Node 22 onward, and
  `verify.mjs` itself refuses to run on an older Node instead of silently skipping
  BH-1. Existing `game-web-phaser` projects on Node 18–21 are unaffected until they
  pull in this template update; new projects scaffolded after this change need
  Node ≥22.

  Minor, not patch: this is new opt-in capability layered onto an already-shipped
  template (a new `verify`/`test`/`build:learn` script and a new `src/debug/`
  module), not a bug fix — nothing existing was broken or removed, and the CLI's
  own `engines.node` requirement is unchanged.

  Also in this release:
  - `verify.mjs` writes a machine-readable `.verify-result.json` (gate ids, pass/fail,
    detail) so the outcome can be surfaced outside the VM. It is written on failure as
    well as success — a verification layer that is invisible exactly when it has
    something to say is worse than none.
  - The template now ships `pnpm-workspace.yaml` with `allowBuilds: esbuild: true`.
    Without it `pnpm install` leaves esbuild's build unapproved and pnpm then refuses
    to run **any** script, so `pnpm verify` could not run at all on a freshly
    scaffolded project until someone manually ran `pnpm approve-builds`. Note pnpm 11
    reads `allowBuilds` from this file, not `pnpm.onlyBuiltDependencies` in
    package.json.
  - 🔴 `engines.node` is now `>=22` (the zero-dependency CDP transport uses the
    built-in `WebSocket` global). Generated projects on Node 18–21 will fail
    `pnpm verify` with an explicit message rather than skipping the gate.

## 0.5.0

### Minor Changes

- f351439: Add the `game-web-phaser` template — a Phaser 3 + Vite + TypeScript scaffold for
  browser games written by AI coding agents.

  Why this template exists: two real agent-driven runs, given only a
  natural-language goal, hand-wrote vanilla JS + Canvas from scratch and shipped a
  canvas-offset bug and a space-key hang. Prose in the prompt did not prevent it.
  This template encodes the constraints as executable scaffolding instead:
  - Phaser's Scale Manager (`FIT` + `CENTER_BOTH`) so the canvas cannot drift out
    of the visible area
  - A conventional input setup that stops space/arrow keys from scrolling the page
  - Boot / Preload / Game scenes split up front, so the agent has structure to
    extend rather than a blank file to improvise in
  - `dev` / `preview` pinned to port 8080, so the surrounding system can create a
    stable share link
  - An `AGENTS.md` for the _generated_ project carrying the hard-won operational
    rules: never run a non-exiting foreground process, commit every verifiable
    step, and verify real rendered position and real key presses rather than
    property values

## 0.4.10

### Patch Changes

- 2ba5b10: add supabase schema

## 0.4.9

### Patch Changes

- add data layer & schema selection to CLI init flow, fix template routing bugs with i18n Link double-locale, parameterize SQL migrations with **SCHEMA** placeholder

## 0.4.8

### Patch Changes

- 9978b27: fixed react-query issues
- 9978b27: to correct the right version

## 0.4.6

### Patch Changes

- 91e8cdc: enhance web-nextjs template

## 0.4.5

### Patch Changes

- 08c8fa8: new content

## 0.4.4

### Patch Changes

- b9bae37: add payments to web-nextjs

## 0.4.3

### Patch Changes

- 71f9ce2: develop web-nextjs template and refine docs

## 0.4.2

### Patch Changes

- c94deed: refine web-nextjs and docs app

## 0.4.1

### Patch Changes

- 83a32e7: resolve web-nextjs template css issues

## 0.4.0

### Minor Changes

- dff1e2b: refine web-nextjs template

## 0.3.5

### Patch Changes

- 64ef5b6: docs: add release-pitfalls guide covering template packaging trap, Release Bot diverge, and CI-only publish workflow
- b158ca5: refine CLI commands

## 0.3.4

### Patch Changes

- fixed template issues: remove hello route, fix zh.json translations, fix dashboard getTranslations, add ThemeProvider and Toaster

## 0.3.3

### Patch Changes

- 7d5709c: fixed template issues

## 0.3.2

### Patch Changes

- 9a29b0b: enhanced web-nextjs template

## 0.3.1

### Patch Changes

- 4ed79a6: Remove rewriteTurboJson post-processing from scaffold; template turbo.json is now standalone (no extends) so no post-processing is needed after scaffolding.

## 0.3.0

### Minor Changes

- 0c23f70: Initial release: agentdock init (human + agent mode) and agentdock mcp (stdio MCP server)

## 0.2.0

### Minor Changes

- Initial release: agentdock init (human + agent mode) and agentdock mcp (stdio MCP server)
