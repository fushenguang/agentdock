## ADDED Requirements

### Requirement: `skills-registry` 项目模板

平台 MUST 提供一个 `skills-registry` 模板，用于初始化一个「公开 skill 内容仓」：
skill 正典放 git、根目录一份 `skills.json` manifest、一个 docs 站说明写法与约定。

模板 MUST 把 skill 放在 `skills/<name>/`。该路径会被 `skill publish` 写进 manifest 的 `path`，
短而稳的路径对消费者友好。

模板 MUST NOT 包含营销 web 应用，MUST NOT 包含任何后端或数据库依赖。
一个 skill 内容仓的可移植性取决于它不绑定任何宿主的私有基建。

模板 MUST NOT 为 skill 目录提供独立的浏览 UI；skill 目录索引 MUST 由 `skills.json`
生成为 docs 页，避免维护两套渲染。

模板 MUST 自带一个示例 skill，使三道门在仓库初始化后立即有可校验的对象。

#### Scenario: 用模板初始化出的仓库结构正确

- **WHEN** 用 `skills-registry` 模板初始化一个新项目
- **THEN** 产出的仓库含 `skills/<示例 skill>/SKILL.md`、根目录 `skills.json`、一个 docs 应用，且**不含** web 应用与任何数据库配置

#### Scenario: 初始化 + 一条 bootstrap 命令后三道门全绿（负例：不得交付空跑的门）

- **WHEN** 用模板初始化仓库、设好 `origin`、运行模板文档指明的那条 bootstrap 命令
- **THEN** 三道门都对**真实存在的**示例 skill 执行了检查并全部通过，而不是因为没有 skill 而空过

#### Scenario: bootstrap 之前门② 的失败必须指明该跑什么

- **WHEN** 仓库刚初始化、尚未运行 bootstrap 命令（`skills.json` 里的 `source` 还是模板占位值）
- **THEN** 门② 失败，且失败信息**明确指出**要运行哪条命令来生成 manifest

> `skill publish` 的 `source` 从**所在仓的 git remote** 推导，因此模板不可能预置一个正确的
> `skills.json`——它的内容取决于使用者把仓建在哪。这是 `publish` 的固有性质，
> 不是模板的缺陷。处理方式是**把它变成一条被文档和门共同指出的显式动作**，
> 而不是让使用者对着一条说不清缘由的红 CI 猜。

### Requirement: 模板预置三道 CI 门

模板 MUST 预置三道 CI 门，且它们 MUST 在每个 PR 上运行。

**门①（全量校验）**：MUST 对 `skills/` 下的**每一个** skill 运行 `agentdock skill validate`，
MUST NOT 只校验本次改动涉及的 skill。任一 skill 不合法即整体失败。

**门②（manifest 新鲜度）**：MUST 由 `skills/` 重新生成 manifest 并与仓库中已提交的
`skills.json` 对账，不一致即失败。对账 MUST 忽略 `publishedAt`（该字段每次发布都变，
逐字比较会使该门恒红），MUST 逐字比较其余全部字段，MUST 与条目顺序无关。
失败时 MUST 输出具体差异（哪个 id、哪个字段、期望值与实际值）。

**门③（公私边界）**：MUST 对仓库内容扫描禁止模式（私有仓路径、内部域名、个人可识别模式），
命中即失败。模式表 MUST 是可配置的数据文件，MUST NOT 硬编码在脚本里——「什么算私有」因仓而异。

三道门 MUST 不依赖任何构建步骤即可运行；门所依赖的 CLI 版本 MUST 被钉住，
MUST NOT 解析为 `latest`（否则门的行为会随上游发版漂移，仓库一行未改而 CI 忽红忽绿）。

#### Scenario: 新增不合法的 skill 被门① 拦下

- **WHEN** 一个 PR 加入了缺少必需 frontmatter 字段的 skill
- **THEN** 门① 失败并指出是哪个 skill、缺什么

#### Scenario: 改了 skill 却没重新生成 manifest 被门② 拦下

- **WHEN** 一个 PR 改动了某个 skill 的 `description` 但没有更新 `skills.json`
- **THEN** 门② 失败，并指出该 id 的 `description` 期望值与实际值

#### Scenario: 只有时间戳不同不算不新鲜（负例）

- **WHEN** `skills.json` 的内容与重新生成的结果仅 `publishedAt` 不同
- **THEN** 门② **通过**

#### Scenario: 公私边界命中被门③ 拦下

- **WHEN** 一个 PR 引入了配置为禁止的模式（如内部域名）
- **THEN** 门③ 失败并指出命中的文件、行与规则

### Requirement: 模板的 openspec 适用范围被收窄到基建与契约

模板 MUST 携带 openspec，但其适用范围 MUST 被收窄为**只管基建/契约变更**
（manifest schema、校验规则、站点结构），MUST NOT 要求「新增一个 skill」走 openspec 流程。

新增 skill 的门 MUST 只有两条：`agentdock skill validate` 通过 + PR review。

该收窄 MUST 写进模板的 `openspec` 配置与 `AGENTS.md`，而不仅仅是文档里的一句口头约定——
为产品代码库设计的门原样套到内容仓上，会让贡献一个 skill 需要先写 proposal，直接劝退贡献。

#### Scenario: 加一个 skill 不需要 openspec 工件

- **WHEN** 贡献者只新增一个 `skills/<name>/SKILL.md` 并更新 `skills.json`
- **THEN** 仓库的门不要求存在任何 openspec change 工件，PR 可以通过

#### Scenario: 改 manifest schema 仍需走 openspec

- **WHEN** 改动的是 manifest 的字段契约或校验规则
- **THEN** 该改动属 openspec 适用范围，需要相应的 change 工件
