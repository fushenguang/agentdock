# design — game-data-spine

## Context

上游姊妹 change（cogito-lib `data-layer-gate`）把 `data_from_files` 立为第 8 个
断言模板；本仓的模板与运行器必须先长出它要判的东西。现状：`GameScene.ts` 的
关卡几何/速度常量全在类内——脚手架教的形态就是硬编码（trial-09：执行者 3985 行
照做）。素材腿已有完整同构先例（`game-assets.json` 清单 + `game-assets.ts`
加载器 + harness `assets` 证据 + runner judge），本刀沿它铺数据腿。

## Goals / Non-Goals

**Goals**：数据层约定 + spine 改造 + harness 三层证据 + 第 8 judge + 模板自食其果
（自带样例 8/8 全绿）。

**Non-Goals**：TS 数据模块/Tiled 等替代形态（真实使用数据后再议）；判内容正确性；
平台侧腿；`schemaVersion` 变更；import 图静态分析（见 D4 残余）。

## Decisions

### D1 · `game-data.json`（根）+ `src/game-data.ts`（唯一入口）

与 `game-assets.json`/`game-assets.ts` 逐位同构：JSON 清单放根（执行者一眼可见、
运行器可读），TS 加载器做 normalize + 校验 + 类型化访问接口。场景只 import
加载器。否掉 `src/data/*.ts` 数据模块（trial-07 H5 形态）：bundle 后 declared/
loaded/used 无法机械区分，证据层会退化成一层。

### D2 · 三层证据的机械语义

- `declared` = 清单 normalize 后的条目（静态事实）；
- `loaded` = 加载器真的初始化并解析过（场景链上有人 import 了 `game-data.ts`；
  项目从未 import ⇒ loaded 空——这正是 V2 的形态：清单可以有，没人碰）；
- `usedInScene` = 活动场景构建期间经访问接口**取走**的条目（加载器内部记一次
  consumption registry，harness 只读它）。

三层各自独立的失败签名：只有 declared（没人用数据模块）／有 declared+loaded
没 used（import 了但没消费）／全非空（过）。空壳清单死在加载器校验（spec 已定）。

### D3 · judge 映射：三种缺口都是失败，hint 指修法

`data === null`（无清单）→ 失败，hint「先按数据层约定立 game-data.json」；
loaded 空 → 失败，hint「场景链上没人用数据入口」；used 空 → 失败，hint
「让场景构建消费数据条目」。全部走 `failResult`，MUST NOT 走
`preconditionResult`（spec delta 已把这条写死——缺席即失败是本刀对 0 vs 3985
的直接回应）。

### D4 · spine 改造的边界：内容进数据，解释器留代码

进 `game-data.json`：逐关卡的几何（平台/出生点/收集物位置）、逐关卡数值
（速度/得分权重等规则参数）、词表类内容。留在代码：画布尺寸、HUD 带、
物理全局配置、场景流转——**与具体关卡内容无关**的解释器设施（spec 的判据）。
参照原作 post-2 的量级（252 行 JS + 1 份 JSON）：参考实现保持小，
改的是**形态**不是内容量。

**残余骗形（如实）**：场景经接口消费了数据、又另写一份常量几何（双份记账）。
used 层抓「没消费」，抓不住「消费了又不用」。不为此加 import 图分析/实体计数
相关判据——真跑发现骗过再补刀（E-15 教训记着：断言不能假装覆盖它没覆盖的）。

### D5 · harness 快照加法式字段，版本不动

`HarnessSnapshot` 加 `data: DataUsageSnapshot | null`（additive；老消费方不读即
不受影响），`version` 保持 `1`。consumption registry 在 `game-data.ts` 模块内，
harness 读它——不新增任何 setter（no-setter 契约）。

### D6 · describe 镜像逐字同步

`TEMPLATE_DESCRIBERS.data_from_files` = 上游 design D1 定稿的判据句
（「玩法内容（关卡/规则/词表）定义在独立数据文件中，且运行时实际从数据文件加载
（场景代码不承载内容定义）」）。跨仓无机械守卫（既有如实记录纪律）；两 PR 同
评审窗口互指。

## Risks / Trade-offs

- [spine 改造范围膨胀] → D4 边界判据 + 「参照 post-2 量级」；review 时对照。
- [执行者绕开加载器直接 import JSON] → 绕开 = used 恒空 = 闸门红，天然被 D2
  逼回正路；不需要额外防线。
- [双份记账骗形] → D4 残余，如实记录，不假装覆盖。
- [上游措辞漂移] → D6 手工镜像纪律；上游侧 agent-server 有守卫、本仓没有
  （跨仓），两边 design 互指。

## Migration Plan

1. 本 change 合并 → changesets 发 `@cogito.ai/cli` 新版（registry）。
2. `npm view @cogito.ai/cli version` 确认 → 通知上游合并 `data-layer-gate`
   （其 tasks 4.2 的顺序闸）。
3. 回滚 = revert 本仓 PR + 上游不翻默认集即可；无数据迁移（新项目新约定，
   存量项目目录内自带旧 runner，不受影响）。

## Open Questions

（无——上游约定名 `game-data.json` 已由本 design 定稿，上游铁律段按此落）
