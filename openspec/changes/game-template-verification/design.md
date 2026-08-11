# Design · game-template-verification

## D1 · 浏览器怎么找：显式解析链 + 失败就报错，不静默跳过

零依赖（Gate ②）意味着我们自己找 chromium。解析顺序：

1. `process.env.CHROME_PATH`（给人一个显式出口）
2. `process.env.PLAYWRIGHT_BROWSERS_PATH` 下的 `chrome-headless-shell` / `chrome`
3. `$HOME/.cache/ms-playwright/**`
4. `/.cache/ms-playwright/**` ← 🔴 **guest 上就是这里**：Shelley 以 root 跑但 `HOME=/`，
   所以浏览器装在了文件系统根下。实测存在 `chromium-1234/chrome-linux64/chrome` 与
   `chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell`
5. `PATH` 里的 `google-chrome` / `chromium` / `chromium-browser`

**一个都找不到 → 打印它找过的每一条路径，退出码非 0。**
MUST NOT 打印「跳过浏览器检查」然后退 0——那正是"闸门被静默关掉"的形状。

## D2 · 必须带的两个 flag，以及为什么

```
--no-sandbox              # guest 里以 root 跑，sandbox 起不来
--disable-dev-shm-usage   # 🔴 guest 镜像缺 /dev/shm，不加这个 chromium 直接 FATAL
```

第二条的完整证据链在 `fushenguang/tarit#34`。**注释里必须写明它是绕 guest 镜像缺陷，
以及镜像修好后可以去掉**——否则将来没人知道这个 flag 为什么在这里，
它会变成一句无人敢删的咒语。

## D3 · 三级判据怎么实现（CDP over 内置 WebSocket）

```
BH-0  构建           → spawn 构建命令，断言退出码 0
BH-1  加载           → 起本地静态服务（Node 内置 http，零依赖）
                       → chromium --remote-debugging-port=0，从 stderr 抓 ws 地址
                       → CDP: Runtime.enable / Log.enable / Network.enable
                       → 收 Runtime.exceptionThrown（未捕获异常）
                            + Network.loadingFailed（失败的资源请求）
                       → 两者皆空才算过
BH-2  渲染           → Page.captureScreenshot → 判非空（见 D4）
                       + Runtime.evaluate 取 canvas 的 clientWidth/clientHeight > 0
```

🔴 **`Runtime.enable` 必须在导航之前开**，否则页面早期抛的异常收不到——
"我以为在验 A、其实在验 B，而且验成功了"是这个仓库记过的坑的形状。

## D4 · 「截图非空」必须真判定

纯黑图和正常画面**都是合法 PNG**，所以判文件存在、判字节数都不够。

判据：解出像素后算**唯一颜色数**与**像素方差**，两者都要过下限。
零依赖解 PNG：CDP 返回的是 base64 PNG，用 Node 内置 `zlib.inflateSync` 解 IDAT
即可拿到原始像素——不引图像库。

⚠️ 这一条**必须自带一个负例测试**：造一张纯色 PNG 喂进判定函数，断言它被判为空。
只测正例的话，判定函数写成 `return true` 也全绿。

## D5 · 状态跳转契约：`jump` 的合法性与可复现性是两条独立断言

```ts
type StateId = /* 该游戏状态的穷尽联合 */
listStates(): StateId[]
jump(id: StateId, seed?: number): GameState
isValidStart(id: StateId, state: GameState): boolean
```

模板自带的遍历断言（这是「闸门靠制品存在性检测」的落地——
不问执行者"你加面板了吗"，而是看这条测试能不能跑绿）：

```
对 listStates() 的每个 id：
  s = jump(id, 固定种子)
  断言 isValidStart(id, s) === true          ← 合法
  断言 jump(id, 同一种子) 与 s 深相等         ← 可复现
```

它一次证明三件事：**跳转合法、状态穷尽、跳转确定性**。
🔴 **可复现不是附加项**：一个不可复现的跳转做不了断言的驱动器。

⚠️ **本刀只交付契约 + 遍历断言 + 一个最小的参考实现**（Boot/Preload/Game 三态）。
「状态空间大的游戏怎么离散化」上游明写不许在模板里定死。

## D6 · 双端口：门禁必须是结构性的

```
build:play   → dist-play/   ，服务跑 8080        ，对外 public 分享，**不含面板**
build:learn  → dist-learn/  ，服务跑另一端口      ，非 public，**含面板**
```

面板是否编入产物由**构建目标**决定，MUST NOT 由运行时开关决定——
客户端开关谁都能改，而「做一个能给同学玩的真实链接」是这个产品最强的动机，
同学打开分享链接看到调试面板，沉浸感就没了。

⚠️ 8080 与 `strictPort` 是**上游冻结的契约**（分享链接指向的就是这个端口），
`build:play` MUST NOT 改它。`build:learn` 的端口是新加的，取一个不冲突的值。

## D7 · `AGENTS.md` 的验收清单从散文改成可执行

现清单 6 项里有两项是散文：「肉眼确认」「每个键都按一遍」。
把能机器判定的那部分换成 `pnpm verify` 退出 0，**剩下真正需要人眼的留给人**——
不假装机器能判"好不好玩"。

这正是这个模板自己已经证明过的那条：硬约束逐字节传导，散文式规则会衰减。

## 影响面

| 面      | 文件                                                                                                                                                                                                                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 模板    | `templates/game-web-phaser/`：新增 `scripts/verify.mjs`、`src/debug/state-jump.ts`（契约 + 参考实现）、`tests/state-jump.test.mjs`（遍历断言）；改 `package.json`（`verify` / `build:play` / `build:learn` / `engines`）、`vite.config.ts`（两个构建目标）、`AGENTS.md`、`index.html`（面板挂载点，仅 learn 构建） |
| CLI     | ⚠️ **大概率零改动**——`scaffoldProject` 是递归拷贝，新增文件自动进模板产物。但 `registry.json` 是**生成的**（`scripts/generate-registry`），`resolvedDependencies` 会随模板 `package.json` 变化，跑一次 `pnpm build` 确认                                                                                           |
| 发布    | 需要一个 changeset（本仓库用 Changesets，`.changeset/` 目前只有 `config.json`）                                                                                                                                                                                                                                    |
| 🔴 不改 | `templates/web-nextjs/**`、`.github/**`（Gate ② 未选 CI paths）、workspace 根依赖                                                                                                                                                                                                                                  |

## D8 · 实现后补的两处（都是实现过程中暴露出来的，不是原设计）

### D8.1 · `dist-play/index.html` 曾漏出一个 `<div id="debug-panel">`

第一版把面板挂载点写在 `index.html` 里，于是**那个空 div 也进了 `build:play` 产物**。
行为上无害（面板代码确实不在里面，产物里零个契约符号、没有 panel chunk），
但它仍然是**公开产物里的一处痕迹**——view-source 能看到 `debug-panel`——
而且它是**无条件的 markup，不由构建目标决定**，与 D6 的主张（"由构建目标决定"）不符。

修法：`index.html` 里那块整段删掉，改由 `panel.ts` 自己 `createElement` 挂载。
这样 markup 和代码走同一道构建期闸门。

**验证**：重新构建后 `dist-play/` 里 `debug-panel` 与契约符号（`listStates`/`isValidStart`）
命中数**都是 0**，而 `dist-learn/assets/` 仍有独立的 `panel-*.js`。

📌 判据留一句：**「行为上无害」不等于「零痕迹」。** D6 声明的是零痕迹，
那就得真的零痕迹，否则声明本身变成一句不准的话。

### D8.2 · `GAME_WIDTH`/`GAME_HEIGHT` 一度被手抄成两份

第一版在 `state-jump.ts` 里手抄了 960/540，附注释说明"config.ts 会拖进 Phaser、
bare Node 跑不了，所以刻意重复；改了记得同步"。

**那正是这个模板其它注释一直在警告的"同一份事实存两处"形状**：改了一处不改另一处，
**遍历断言会继续绿着，但它断言的是过期的边界**——没有任何东西会失败。

修法：提出**零 import 的叶子模块** `src/dimensions.ts`，`config.ts` 与
`state-jump.ts` 都从它 import。两个消费者的需求都满足，重复消失。

🔴 **踩到的坑，记下来**：`state-jump.ts` 必须写 `from '../dimensions.ts'`——
**带显式 `.ts` 扩展名**。省掉扩展名只有打包器解析得动，bare Node 会
`ERR_MODULE_NOT_FOUND`，而那恰好会让契约退回"只能在浏览器里跑"、丢掉它存在的意义。
（tsconfig 已开 `allowImportingTsExtensions`，类型检查认。）
**第一次改完就是这么红的**，`node --test` 直接失败。

## D9 · 结构化结果落盘 `.verify-result.json`（阶段二第 6 行的 VM 半边）

判据要能回流到 web，光有人读的日志不够。`verify.mjs` 额外写一份机器可读结果：

```json
{ "schemaVersion": 1, "ranAt": "<iso>", "passed": true,
  "gates": [ { "id": "BH-0", "label": "构建", "passed": true, "detail": "…" }, … ],
  "abortedBeforeAnyGate": false }
```

🔴 **必须在失败时也写。** 只在全过时才出现的话，web 侧永远只看得见成功——
一个恰好在有话要说的时候隐身的验证层，正是这一刀要消灭的自欺。

🔴 **落盘用 `process.on('exit')` 兜底，不是只在 `fail()` 里写。**
这一条是**跑失败路径跑出来的，不是读代码读出来的**：「找不到浏览器」那条分支住在
`lib/find-browser.mjs` 里、自己 `process.exit(1)`，所以第一次真实失败**一个文件都没留下**。
退出钩子覆盖当下三个退出点，也覆盖后来人新加的——逐点去补则覆盖不到。

`abortedBeforeAnyGate` 区分「某道闸红了」与「还没跑到任何闸就崩了」（环境问题）——
两者对下游是不同的处置，不能合成一个 `passed: false`。

`schemaVersion` 是给**另一个仓库、另一条发布节奏**的消费者用的：
它应当能拒绝一个自己不认识的形状，而不是把新版本悄悄解析错。
