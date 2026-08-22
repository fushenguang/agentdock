# @cogito.ai/cli

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
