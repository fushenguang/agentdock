---
roadmap-id: game-web-phaser-template
---

# game-template-verification

> 上游需求来自 cogito-lib 的 `/game-studio` 框架[阶段二 · 建验证层](https://github.com/fushenguang/cogito-lib)
> 第 2/3/4 行。**Gate ① 路线图已批准 · Gate ② 范围与非目标已由构建者 2026-08-09 批准。**

## Why

`templates/game-web-phaser` 今天**没有任何测试基建**：无 `verify.mjs`、无 vitest/playwright、
无状态跳转契约、单一构建目标、单一端口。它的 `AGENTS.md` 用**散文**要求执行者
「截个真实的图看看」「每个键都按一遍」——而实测证据表明散文式规则会衰减：

> 同一个模板的**硬约束**（Scale Manager 配置、`addCapture` 键盘捕获、端口 8080）
> **逐字节传导**到了产物里；而同一个模板的 `PROJECT_CONTEXT.md`（要执行者回头维护的文档）
> **产物里一个字没改**。

**结论：要执行者自觉遵守的东西活不下来；要机器能判定的东西才活得下来。**
所以验证能力必须以**可执行制品**的形式住在模板里，不是以提示的形式住在文档里。

上游那条判据说得更硬：**能力不可知的真正危害不是执行者做得差，是它做得差却报告说做完了。**
对策是把「算不算做完了」的判定权从执行者手里拿走。

### 为什么由模板自己跑，而不是读 agent 的 `browser` 工具结果

上游 2026-08-09 的只读排查（cogito-lib，issue `fushenguang/tarit#34`）查明：
guest 镜像**缺 `/dev/shm`**，chromium 直接 FATAL；加 `--disable-dev-shm-usage` 即可出图。
而 Shelley 是编译好的二进制、由 init 拉起、只有 4 个环境变量、没有配置文件——
**我们没有任何途径让它给 chromium 传这个 flag**。

但这不只是绕路。模板自带脚本**本来就是更对的架构**：闸门靠制品存在性检测，
而 agent 有没有调 `browser`、验了哪几个维度，是它自己决定的——判定权就还在执行者手上。

## What Changes

ship 之后为真、现在不为真的事：

- **模板自带 `scripts/verify.mjs`，`package.json` 有 `verify` 脚本**，跑三级判据：
  - **BH-0 构建**：构建命令退出码 0
  - **BH-1 加载**：headless Chromium 打开产物，**无未捕获异常、无失败的资源请求**
  - **BH-2 渲染**：截图**非空**（用帧熵/像素方差判下限）+ 游戏画布尺寸 > 0
    🔴 **「非空截图」必须真的判定，不能只判文件存在**——纯黑图和正常画面都是合法 PNG。
- **零新依赖**（Gate ② 已定）：直接 spawn 环境里已有的 chromium，用 **Node 内置 `WebSocket`
  说 CDP**（实测 guest 是 Node v22.23.2，`typeof WebSocket === 'function'`）。
  不引 playwright、不引 puppeteer-core。
- **状态跳转契约进模板**：`listStates()` / `jump(id, seed?)` / `isValidStart(id, state)`，
  外加**模板自带的遍历断言**——对每个状态 `jump` 后断言 `isValidStart` 为真，
  且同一种子两次 `jump` 深相等（**合法 + 可复现**）。
  🔴 `jump` 产生的状态**必须是该状态的一个合法起点**，与正常玩到那里在合法性上不可区分——
  半吊子状态会让执行者验出**假 bug**，然后把好代码「修」坏。**假 bug 比没测试更糟。**
- **两个构建目标 + 两个端口**：`build:play` → 8080（对外 public 分享）、
  `build:learn` → 另一端口（非 public，带调试面板）。
  🔴 门禁**必须是结构性的**：客户端运行时开关谁都能改，「一个服务 + `/learn` 路径」
  这条路已被上游判定不可行（同学手动改路径就看到面板了）。
- **`AGENTS.md` 验收清单从散文改成可执行**：把「截个图看看」换成 `pnpm verify` 退出 0。

## Non-goals

🔴 **下面每一条都是 Gate ② 明确切出去的，不是执行时自行收窄。**

| 不做                                                                           | 为什么 / 去处                                                                                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **IA 断言运行器**（把验收项编译成断言逐条判定）                                | 上游 web 侧已落地模板注册表与失败信息格式（`acceptance-assertions`），但**运行器要吃 `jump` 作驱动器**——本刀先把 `jump` 交付出来，运行器归下一刀 |
| **失败信息回流给 agent**                                                       | 需要运行器先存在。本刀只产出**可读**的失败信息，不做结构化回流通道                                                                               |
| ~~`pnpm.onlyBuiltDependencies`~~ **已反转，见下**                              | 原判 Gate ② 未选；**实测证明它是拦路的**，已加回                                                                                                 |
| 模板的 `lint` 脚本                                                             | Gate ② 未选。模板至今没有 eslint，代码质量靠每轮运气                                                                                             |
| 把 `templates/game-web-phaser/**` 加进 `template-validation.yml` 的 paths 过滤 | Gate ② 未选。⚠️ **后果是改这个模板目前零 CI 保护**——本刀新增的 `verify.mjs` 与遍历断言在 CI 里不会被跑到                                         |
| 修 guest 镜像的 `/dev/shm`                                                     | 归 `fushenguang/tarit#34`，构建者已定「专门处理」。本刀带 flag 绕过；镜像修好后无非是可以去掉那个 flag                                           |
| VLM 判分 / agent 写测试                                                        | 上游已定：方案 D 一期只做 B。不在本刀                                                                                                            |
| 状态空间大的游戏 `listStates()` 返回什么                                       | 上游明写「不要在没讨论前就在模板里定死」，需要做第一个平台跳跃 track 时验证。本刀只定契约形状，不定离散化策略                                    |

⚠️ **上面三条 Gate ② 未选的（`onlyBuiltDependencies` / lint / CI paths）都带着已知代价，
如实写在这里而不是省略**——它们是评估文档点名过的缺口，不写下来下次就得重新发现一遍。

## 一处需要显式批准的契约变更

**`templates/game-web-phaser/package.json` 的 `engines.node` 从 `>=18` 提到 `>=22`。**

理由：零依赖方案靠 **Node 内置 `WebSocket`** 说 CDP，那是 Node 22 才稳定的。
guest 是 v22.23.2，没问题；但 `engines` 是对**每一个生成项目**的声明，
写着 `>=18` 而实际需要 22 就是一句不真的话。

`verify.mjs` 同时在运行时自检：`typeof WebSocket !== 'function'` 时**报错退出**，
**不静默跳过 BH-1**——一个能被静默跳过的闸等于不存在。

## 🔴 一处 Gate ② 范围反转（新证据驱动，2026-08-10）

原本 `pnpm.onlyBuiltDependencies` 被 Gate ② 切出去，我当时向构建者报告它"只是一条警告，
不是拦路"。**那个报告是错的**——它基于一次**悄悄带了 `pnpm approto-builds` 变通步骤**的运行。

去掉那个变通步骤后实测：`pnpm install` 报 `ERR_PNPM_IGNORED_BUILDS: esbuild`，
随后 **任何 `pnpm run <script>` 都跑不了**（pnpm 的 `runDepsStatusCheck` 先拦下来）。
也就是说**本刀刚装好的验证闸门一次都跑不起来**，除非有人先手动跑一次 `pnpm approve-builds`。

**一个需要人先做一步额外动作才能跑的闸门，对无人监督的执行者等于不存在**——
那正好把这一刀的全部意义抵消掉。所以加回来，不是"顺手做了范围外的事"，
而是"不做它，范围内的东西就是坏的"。

⚠️ 同时纠正一个技术细节：**pnpm 11 不读 package.json 的 `onlyBuiltDependencies`**，
它读 `pnpm-workspace.yaml` 的 `allowBuilds`（实测 pnpm 11.17.0，`approve-builds --all`
写出来的就是那两行）。所以修法是给模板补一个 `pnpm-workspace.yaml`；package.json 那份
留着只为 pnpm 10 及更早，并已注明只有 yaml 那份经过实测。

🟡 **残留、如实记下**：加了之后 `pnpm install` **仍然打印**那行
`ERR_PNPM_IGNORED_BUILDS` 警告，但**不再阻塞脚本执行**——干净安装后 `pnpm test`（7/7）
与 `pnpm verify`（三闸全过）都能直接跑。噪音还在，拦路没了。
