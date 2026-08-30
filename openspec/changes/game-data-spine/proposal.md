---
roadmap-id: game-web-phaser-template
---

# game-data-spine

## Why

上游 cogito-lib 的标杆验证（trial-09 §九）拿到最硬负读数：最终产物**0 个独立数据
文件 vs 3985 行场景代码**——执行者把词表/关卡/规则全部写死在场景类里，机器断言
6/6 全绿。根因一半在上游（没有判据维度，姊妹 change `data-layer-gate` 已开），
另一半在**本模板自己**：参考实现 `GameScene.ts` 的关卡几何、速度、规则全是类内
常量——**脚手架教的就是硬编码**，执行者忠实照做了。上游第 8 个断言模板
`data_from_files`（判据：玩法内容定义在独立数据文件且运行时实际加载）需要本仓的
运行器先认得它、模板先长出数据层——「游戏 = 数据 + 解释器」的解释器侧就是这把
刀，参照原作 post-2 Dynamic Platformer 的分层（252 行 JS + 1 份 Tiled JSON，
「关卡当场变」的原语就两行）。

## What Changes

- **数据层约定**：项目根新增 `game-data.json`（与 `game-assets.json` 并列的玩法
  内容清单：`levels` / `rules` / `vocabulary` 分节）+ `src/game-data.ts` 加载器
  （normalize + 单一 import 入口，`game-assets.ts` 同构先例）。
- **spine 改造**：参考实现的场景从 `game-data.json` 构建关卡/规则——场景类不再
  承载内容定义（几何/数值/词条挪进数据），模板**自食其果**：自己的示例必须过
  自己的数据层闸门。
- **harness 数据证据**：`getSnapshot()` 新增 `data: DataUsageSnapshot | null`
  （`declared` / `loaded` / `usedInScene` 三层，asset-usage 同构；`null` =
  未声明 `game-data.json`）。
- **运行器第 8 judge**：`assert.mjs` 的 `TEMPLATE_DESCRIBERS`/`KNOWN_TEMPLATE_IDS`
  加 `data_from_files`（describe 措辞与 cogito-lib 逐字一致——手工镜像纪律）；
  judge 语义 = 三层证据全非空才过，**manifest 缺席判失败（不是前提不满足）**
  ——「零数据文件 + 全写死」正是这条要抓的缺陷，把它归为前提不满足等于放行。
- **模板自带样例 `assertions.json`** 加 `data_from_files` 条目；模板 `AGENTS.md`
  加数据层规则（执行者在 VM 里读的就是它：新关卡/新规则改数据文件，场景类不承载
  内容定义）。

## Non-goals

- ❌ 不做 Tiled/外部编辑器格式——JSON 清单起步，TS 数据模块等形态留待真实使用
  数据再议（闭集注册表「从最小可用集起步」的同一条纪律）。
- ❌ 不判内容质量/好玩——判**形态**（数据层成立与否）。
- ❌ 不做 cogito-lib 平台侧（品类默认集、投递铁律、agent-server 镜像）——姊妹
  change `data-layer-gate` 的腿。
- ❌ 不动 `assertions.json` 的 `schemaVersion`（形状不变，只是闭集多一个 id）。
- ❌ 不给 harness 加任何 setter（既有 no-setter 契约）。

## Capabilities

### New Capabilities

- `template-game-web-phaser-game-data`: 游戏模板的玩法内容数据层——清单与加载
  约定、场景从数据构建的 spine 要求、harness 数据证据三态、执行者规则。

### Modified Capabilities

- `template-game-web-phaser-verification`: 运行器闭集从 7 扩到 8
  （`data_from_files` judge 及其「缺席即失败」语义）；参考实现与样例清单从
  覆盖 7 个模板改为覆盖 8 个。

## Impact

- `templates/game-web-phaser/`：新增 `game-data.json`、`src/game-data.ts`；
  改 `src/scenes/GameScene.ts`（及引用内容常量的场景）、
  `src/debug/harness-types.ts`、`src/debug/harness.ts`、`scripts/assert.mjs`、
  根 `assertions.json` 样例、`AGENTS.md`、`tests/`（judge 三态×骗形用例、
  harness 用例、自食其果用例）。
- 上游契约：`data_from_files` 的 describe 措辞与 cogito-lib
  `assertion-templates.ts` 逐字同步（既有手工镜像纪律，无机械守卫——如实记录）。
- 发布：changesets 发 `@cogito.ai/cli` 新版到 registry——**cogito-lib 姊妹 change
  的合并时点闸**（上游先发、平台后翻，顺序颠倒 = 存量执行环境上所有机器断言
  整份 `unavailable`）。
- 存量已脚手架项目不受影响（runner/模板文件在项目目录内，随项目走）。
