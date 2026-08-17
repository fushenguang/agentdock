## Purpose

定义 CLI 的 skill 校验与发布能力：把一个目录判定为结构合法的 Agent Skill，
并把它产出为一条可被任何人匿名消费的 git manifest 条目。

## Requirements

### Requirement: skill 结构校验命令

CLI MUST 提供 `agentdock skill validate <dir>`，校验一个目录是否为结构合法的 Agent Skill。

校验 MUST 覆盖：`SKILL.md` 存在且 frontmatter 可解析、Agent Skills spec 的必需字段齐全。

校验 MUST NOT 评判 skill 的**质量**（那属于已 DEFER 的 `eval`）——只判断结构是否合法。

对**非 spec 顶层键**，校验 MUST 只报告、MUST NOT 强制失败。宿主特有的键位约定（例如把非 spec 键迁进 `metadata:` 并加前缀）是某个宿主的私有约定，强制它等于让一个通用工具反向依赖特定宿主。

实现 MUST 优先使用 Agent Skills 官方校验器而非自建校验逻辑。

`core/` 层实现 MUST 保持纯——不写 stdout、不调用 `process.exit`，渲染与退出决策全部在 adapter 层。

#### Scenario: 合法 skill 通过校验

- **WHEN** 对一个含合法 `SKILL.md`（frontmatter 可解析、必需字段齐全）的目录运行 `skill validate`
- **THEN** 命令以 exit 0 结束；`--json` 模式下输出 `ok: true`

#### Scenario: 缺失 SKILL.md 时给出可操作的失败

- **WHEN** 对一个不含 `SKILL.md` 的目录运行 `skill validate`
- **THEN** 命令以非零码结束；`--json` 模式下输出 `ok: false` 且带有错误码与可读 message

#### Scenario: 非 spec 顶层键只报告不失败（负例）

- **WHEN** 校验一个 frontmatter 里含非 spec 顶层键的 skill
- **THEN** 校验**通过**（exit 0），但输出中包含对该键的提示信息

### Requirement: skill 发布命令产出 git manifest 条目

CLI MUST 提供 `agentdock skill publish <dir> --registry <path>`，产出一条 manifest 条目并写入指定的**本地 registry 仓库 checkout**。

`publish` MUST 先执行与 `skill validate` 相同的校验；校验不通过 MUST NOT 产出任何条目。

manifest 条目 MUST 只包含索引信息（如 id、来源 git 地址、版本、名称、描述）。**skill 内容本身 MUST 留在 git**，manifest MUST NOT 内嵌 skill 正文。

同一 skill 重复发布 MUST 更新既有条目，MUST NOT 追加重复条目。

条目的 `source` MUST 是**规范化后的、与凭据无关的** URL，而非 `git remote get-url origin` 的原始输出。判据是：**产出的 URL 能被一个没有任何凭据的人 clone**，而不是「URL 能被解析」。

规范化 MUST 是**确定性的**：同一个仓库，无论发布者本机把 `origin` 配成 SSH、HTTPS 还是 `git://` 形式，产出的 `source` MUST 是同一个字符串。

规范化 MUST 丢弃 URL 中内嵌的凭据（userinfo）。manifest 的用途是提交进公开 registry 仓，**凭据 MUST NOT 出现在产出物里**。

对无法规范化为匿名可 clone 形式的 remote（本地路径、`file://`、无法还原真实主机的 SSH 别名等），`publish` MUST 显式失败并 MUST NOT 写入任何条目；错误信息 MUST 同时包含**原始 remote 原文**与**可执行的修法**。

规范化 MUST NOT 依赖网络：它是对 URL 形式的判断，MUST NOT 探测远端可达性或仓库是否存在。

#### Scenario: 发布产出可被复用的 manifest 条目

- **WHEN** 对一个合法 skill 目录运行 `skill publish --registry <本地 checkout>`
- **THEN** 该 checkout 内的 manifest 新增一条包含 id、git 来源与版本的条目

#### Scenario: 校验不通过时不产出任何条目（负例）

- **WHEN** 对一个缺失必需字段的 skill 目录运行 `skill publish`
- **THEN** 命令失败，且 registry checkout **没有任何改动**

#### Scenario: 重复发布同一 skill 是幂等的

- **WHEN** 对同一 skill 连续运行两次 `skill publish`
- **THEN** manifest 中该 skill 只有一条条目，且内容为最后一次发布的结果

#### Scenario: SSH 形式的 origin 产出匿名可 clone 的 URL

- **WHEN** 在一个 `origin` 为 `git@<host>:<owner>/<repo>.git` 的仓库里发布 skill
- **THEN** 产出条目的 `source` 为 `https://<host>/<owner>/<repo>`

#### Scenario: 同一仓库的不同 origin 形式产出相同的 source（确定性）

- **WHEN** 两位发布者对同一个 `<owner>/<repo>` 发布同一 skill，一位的 `origin` 是 SSH 形式、另一位是 HTTPS 形式
- **THEN** 两次产出的 `source` 字符串**完全相同**

#### Scenario: origin 内嵌的凭据不进入产出物（负例）

- **WHEN** 在一个 `origin` 形如 `https://<user>:<token>@<host>/<owner>/<repo>.git` 的仓库里发布 skill
- **THEN** 产出条目的 `source` 中**不包含**该 token，且为 `https://<host>/<owner>/<repo>`

#### Scenario: 无法规范化的 remote 显式失败而非静默写入（负例）

- **WHEN** 在一个 `origin` 为本地路径（如 `/tmp/some-repo`）的仓库里发布 skill
- **THEN** 命令失败并给出含原始 remote 与修法的错误信息，且 registry checkout **没有任何改动**

### Requirement: 发布不得自动推送，且 CLI 不得依赖任何后端

`publish` MUST 在写入本地 checkout 后停止。它 MUST NOT 执行 git commit、git push，MUST NOT 创建 PR。

理由是本仓库将「发布到 registry」列为必须暂停确认的操作；同时这使 CLI **不需要持有任何凭据**。

CLI MUST NOT 调用任何后端服务、MUST NOT 读写任何数据库。`@cogito.ai/cli` 是发布到 npm 供任意使用者安装的独立包——一旦它依赖某个宿主的私有基建，它就只对那个宿主有意义，而 skill 作为可移植资产的价值随之消失。

新增命令 MUST NOT 破坏「CLI 构建产物为自包含单文件、无需 node_modules 即可运行」这一既有性质。

#### Scenario: 发布后工作区留待人工审阅

- **WHEN** 成功执行 `skill publish --registry <本地 checkout>`
- **THEN** 该 checkout 处于「有未提交改动」的状态，且没有任何 commit 或远端推送发生

#### Scenario: 构建产物仍可零依赖运行（回归）

- **WHEN** 构建 CLI 后，仅将构建产物拷贝到一个不含 node_modules 的空目录并运行新增的 skill 命令
- **THEN** 命令正常执行，不因缺失外部依赖而失败
