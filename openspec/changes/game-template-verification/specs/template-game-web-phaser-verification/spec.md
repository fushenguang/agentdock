## ADDED Requirements

### Requirement: 可执行的三级验证（`pnpm verify`）

`templates/game-web-phaser/` MUST 提供 `scripts/verify.mjs` 与对应的 `verify` npm 脚本，
跑三级判据（BH-0 构建 / BH-1 加载 / BH-2 渲染），零新依赖（不引入 playwright /
puppeteer-core / `ws` 等包），通过 spawn 环境里已有的 Chromium 并用 Node 内置
`WebSocket` 说 CDP 完成。

任一级判定失败、找不到浏览器、或 Node 运行时缺少内置 `WebSocket`（<22），
MUST 打印期望与实测并以非 0 退出码结束；MUST NOT 打印"跳过"后以 0 退出。

#### Scenario: 三级判据全部通过

- **WHEN** 在已 `pnpm install` 的生成项目里运行 `pnpm verify`
- **THEN** 依次执行构建、无头 Chromium 加载、截图与画布尺寸检查，全部通过后以退出码 0 结束

#### Scenario: 找不到浏览器时报错退出，不静默跳过

- **WHEN** `CHROME_PATH`、`PLAYWRIGHT_BROWSERS_PATH`、`$HOME/.cache/ms-playwright`、
  `/.cache/ms-playwright`、`PATH` 均未能解析出一个可执行的 Chromium/Chrome 二进制
- **THEN** `pnpm verify` 打印它查找过的每一条路径，并以非 0 退出码结束

#### Scenario: Node 运行时缺少内置 WebSocket 时报错退出

- **WHEN** `typeof WebSocket !== 'function'`（Node < 22）
- **THEN** `pnpm verify` 在执行任何浏览器相关判据之前报错并以非 0 退出码结束

### Requirement: 截图非空判定必须真判定，不能只判文件存在

`scripts/lib/png.mjs` MUST 解码 CDP 返回的 base64 PNG 像素（零依赖，
`zlib.inflateSync` 解 IDAT），并同时用唯一颜色数下限与像素方差下限判定"非空"——
仅判 base64/文件是否存在或字节数 MUST NOT 视为满足本要求。

#### Scenario: 纯色 PNG 被判为空（负例）

- **WHEN** 判定函数收到一张唯一颜色数为 1、方差为 0 的纯色 PNG
- **THEN** 判定结果为「空」（`nonEmpty: false`）

#### Scenario: 有真实视觉内容的 PNG 被判为非空

- **WHEN** 判定函数收到一张唯一颜色数与像素方差均高于下限的 PNG
- **THEN** 判定结果为「非空」（`nonEmpty: true`）

### Requirement: 状态跳转契约与遍历断言

`templates/game-web-phaser/` MUST 在 `src/debug/state-jump.ts` 提供
`listStates()` / `jump(id, seed?)` / `isValidStart(id, state)` 契约，
并为该模板自身的 Boot/Preload/Game 三态提供最小参考实现；`jump` 产生的状态
MUST 是该状态的合法起点，且同一 `(id, seed)` 两次调用 MUST 深相等（可复现）。

`tests/state-jump.test.mjs` MUST 对 `listStates()` 的每个状态分别断言
「`isValidStart` 为真」与「同种子两次 `jump` 深相等」两条独立结论，
不得合并为一条断言；MUST 包含至少一个「半吊子状态被 `isValidStart` 判为假」的负例。

#### Scenario: 每个状态的 jump 结果合法且可复现

- **WHEN** 对 `listStates()` 返回的每个 `id` 以固定种子调用 `jump`
- **THEN** `isValidStart(id, jump(id, seed))` 为真，且同一 `(id, seed)` 的两次 `jump` 结果深相等

#### Scenario: 半吊子状态被拒绝（负例）

- **WHEN** 构造一个字段不合法（如玩家坐标越出世界边界、id 与实际状态不一致）的状态
- **THEN** `isValidStart` 对该状态返回假

### Requirement: 双构建目标，调试面板由构建目标门禁而非运行时开关

`templates/game-web-phaser/` MUST 提供 `build:play`（输出 `dist-play/`，
服务端口固定 8080，`strictPort`，不含调试面板）与 `build:learn`
（输出 `dist-learn/`，服务端口 8090，含调试面板）两个构建目标。

调试面板（`src/debug/panel.ts`）是否编入产物 MUST 由构建时的 `--mode` 决定
（即 `import.meta.env.MODE`，一个编译期常量），MUST NOT 由任何运行时/客户端可读写的
开关决定。`build:play` 的产物 MUST NOT 包含调试面板相关代码。

#### Scenario: build:play 产物不含调试面板代码

- **WHEN** 运行 `pnpm build:play` 生成 `dist-play/`
- **THEN** `dist-play/` 下的 JS 产物中不出现调试面板的标识性字符串或代码

#### Scenario: build:learn 产物包含调试面板

- **WHEN** 运行 `pnpm build:learn` 生成 `dist-learn/`
- **THEN** `dist-learn/` 的产物中包含调试面板代码，且页面加载后可通过挂载点访问

### Requirement: 生成项目的 `engines.node` 如实声明为 ≥22

`templates/game-web-phaser/package.json` 的 `engines.node` MUST 为 `>=22`——
零依赖 CDP 传输依赖 Node 内置 `WebSocket`，该特性在 Node 22 才稳定；
声明 `>=18` 而实际需要 22 会是一句不真的话。

#### Scenario: 生成项目声明 Node ≥22

- **WHEN** 用 `game-web-phaser` 模板脚手架生成一个新项目
- **THEN** 生成项目 `package.json` 的 `engines.node` 为 `>=22`
