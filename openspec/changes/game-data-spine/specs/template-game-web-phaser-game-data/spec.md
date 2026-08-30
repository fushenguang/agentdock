## Purpose

定义 game-web-phaser 模板的玩法内容数据层：玩法内容（关卡布局、规则、词表）住在独立数据文件里，场景是消费数据的解释器——这是「游戏 = 数据 + 解释器」命题在模板侧的落地，也是上游 `data_from_files` 断言能判的东西。

## ADDED Requirements

### Requirement: 玩法内容数据清单与加载约定

模板生成的项目根 MUST 带一份 `game-data.json`（与 `game-assets.json` 并列），
按节组织玩法内容数据（至少含 `levels`；`rules`/`vocabulary` 等节按需存在），
并带 `src/game-data.ts` 作为唯一加载入口：读入、校验、给出类型化的访问接口
（`game-assets.ts` 同构）。场景 MUST 经由该入口取数据，MUST NOT 各自 `fetch`/手抄
同一份 JSON。

清单为空壳（节存在但零条目、或条目缺内容字段）时加载器 MUST 报错而不是静默给空
——空壳清单是「为了过闸而造假数据」的第一形态，必须在校验层就死掉。

#### Scenario: 干净安装自带可用数据层

- **WHEN** 脚手架生成新项目
- **THEN** 根目录有非空的 `game-data.json`，`src/game-data.ts` 可加载并校验通过

#### Scenario: 空壳清单在校验层报错

- **WHEN** `game-data.json` 的 `levels` 节是空数组或条目缺必需字段
- **THEN** 加载器抛出可定位的校验错误，而不是返回空数据让场景静默落空

### Requirement: 参考场景从数据构建，场景类不承载内容定义

参考实现的场景 MUST 从 `game-data.json` 的条目构建关卡内容（几何、数值、词条）：
同一场景类换一份关卡数据即得到不同关卡，**内容差异 MUST 由数据差异承载**——
类内不再有按关卡写死的内容常量。这是模板给执行者看的**示范**：trial-09 的
负读数（0 数据文件 vs 3985 行场景代码）证明执行者会忠实复制脚手架的形态，
所以脚手架的形态必须是数据驱动的。

基础设施常量（画布尺寸、HUD 带高度、物理全局配置等**与具体关卡内容无关**的
取值）不在此限——它们属于解释器，不属于数据。

#### Scenario: 换数据即换关

- **WHEN** 只改动 `game-data.json` 中某关卡的条目（如平台位置），不改任何场景代码
- **THEN** 该关卡的构建结果随数据变化

#### Scenario: 场景类里没有按关卡写死的内容

- **WHEN** 审查参考实现的场景类
- **THEN** 找不到逐关卡的内容常量（几何/数值/词条）；它们全部来自数据入口

### Requirement: harness 暴露数据使用证据，三态不可合并

`getSnapshot()` MUST 暴露 `data` 字段，形状与 asset-usage 证据同构：

- `declared`：`game-data.json` 里声明的数据条目（id + 节）；
- `loaded`：本次运行时真的加载并解析了的条目；
- `usedInScene`：当前活动场景构建**实际消费**了的条目。

项目没有 `game-data.json` 时 `data` MUST 为 `null`——「从未声明」与「声明了但
没用起来」是两个不同的事实，MUST NOT 塌缩成同一个空集合。

🔴 `data` 证据 MUST 是只读观察（no-setter 契约）：它记录场景构建从哪里取了
内容，MUST NOT 提供任何直接改写游戏数据的通道。

`usedInScene` 证明的是「场景构建读过并用于造东西」，**不证明**数据被正确使用
（读进变量又弃置的骗形它抓不住——这条边界如实记在设计里，不假装覆盖）。

#### Scenario: 未声明数据清单

- **WHEN** 项目根没有 `game-data.json`
- **THEN** `getSnapshot().data` 为 `null`

#### Scenario: 声明了、加载了、场景消费了

- **WHEN** 场景从数据入口取关卡条目并据此构建
- **THEN** 三层证据里该条目分别出现在 `declared` / `loaded` / `usedInScene`

#### Scenario: 声明了但场景没用

- **WHEN** `game-data.json` 有条目、加载器也加载了，但场景构建没消费任何条目
- **THEN** `usedInScene` 为空而 `declared`/`loaded` 非空——两个事实都保留，不合并

### Requirement: 模板 `AGENTS.md` 写明执行者的数据层规则

模板 `AGENTS.md`（执行者在 VM 里读的第一份规则）MUST 含数据层规则：新关卡/
新规则/新词条 = 改 `game-data.json`（必要时扩节）；场景类是解释器，MUST NOT
往里写内容定义。规则 MUST 与上游 `data_from_files` 判据表达同一事实（措辞
同源，不各自演化）。

#### Scenario: 执行者按规则加第二关

- **WHEN** 执行者按 `AGENTS.md` 给游戏加一个新关卡
- **THEN** 做法是在 `game-data.json` 加条目，场景代码不动或只动解释器逻辑
