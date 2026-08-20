# design · phaser4-template-upgrade

## D1 · 升级时最容易踩的三处（来自官方 Migration Guide，逐条复核，不许略过）

| 变更 | 为什么危险 | 本模板的暴露面 |
|---|---|---|
| **纹理坐标原点翻转**（v3 左上 → v4 GL 原点，**Y=0 在底部**） | 不是 API 改名，是坐标语义整体翻转——**不报错，只是画面不对** | 模板用 `Graphics` 生成纹理（`PreloadScene`），要眼看核对 |
| **`Math.TAU` 语义改变**（v3 错定义为 `PI/2`，v4 修正为 `PI*2`，旧值挪到 `Math.PI_OVER_2`） | 同名不同值，**编译期无感、运行时角度全错** | 现有代码 grep 无命中，但改完要再 grep 一次 |
| **Pipeline → RenderNode**、FX/Mask → 统一 Filter、`setTintFill()` 移除 | 只影响自定义渲染代码 | 模板不用自定义 Pipeline/Shader，**预期不受影响，但要复核** |

模板实际用到的 Phaser API 面已清点（`grep -o 'Phaser\.[A-Za-z.]*'`）：`Scene` / `Game` /
`Physics.Arcade.{Sprite,Group,Body,World}` / `Input.Keyboard.*` / `Scale.{FIT,CENTER}` /
`GameObjects.{Text,Graphics,GameObject}` / `Scenes.Events.CREATE` / `Sound.WebAudioSoundManager` /
`Types.*`。**面很窄，这是预期改动小的依据**——但依据不等于结论，以构建与 verify 的真实结果为准。

## D2 · registry 改在哪一层：仓库级是**危险**的，模板级才是对的

三层爆炸半径完全不同：

| 层 | 影响 | 判决 |
|---|---|---|
| 用户级 `~/.npmrc` | 构建者本机所有项目 | 不碰——那是人的机器配置 |
| 🔴 **仓库级 `agentdock/.npmrc`** | 所有克隆 **+ CI** | **禁止**。`release.yml:45-51` 用 `setup-node` 把 registry 指向官方并写入 token；**仓库级 `.npmrc` 的 `registry=` 优先级高于用户级**，加了会让 `changeset publish` 往一个**只读镜像**发包，直接弄坏发布链路 |
| ✅ **模板级 `.npmrc`** | 生成项目（含 VM 里的执行者） | **正是需要的一层**，且顺带消掉「VM 用哪个源」这个我们现在查不到的未知数 |

⚠️ **记一条不对称**：既有两个模板（`web-nextjs` / `skills-registry`）的 `.npmrc` 是**纯注释、
没有 `registry=` 行**。本刀是第一个写 registry 的模板。这不是疏忽，是范围选择——它们没被这个
问题挡住。**但下一个人会看到三个模板两种写法**，所以在本模板的 `.npmrc` 里写清为什么。

## D3 · 🔴 `PLATFORM_CONTEXT` 的翻转有一个 PRD 没写到的副作用，因此不进本刀

PRD 记的顺序是「模板升级 → 再改 `PLATFORM_CONTEXT`，或两者同窗口发布」。**但那条记录默认了
翻转是安全的，实际不是**：`PLATFORM_CONTEXT` 是一个**全局常量**，喂给每一次 Run，
**包括存量项目的 Run**。而存量项目（「用话造关」「打星星」等，实测 `package.json` 全是
`^3.90.0`）**不会因为模板升级而改变自身依赖**。

⇒ 翻成 Phaser 4 之后，**存量 Phaser 3 项目的执行者会被告知按 Phaser 4 写**，
而它装到的是 Phaser 3。这与今天的矛盾**方向相反、性质相同**，不是改进。

正确形态多半是**按项目实际依赖决定这句话**（读该项目的 `package.json`），
那是设计，不是改一个常量字符串。**留给下一刀，本刀不碰。**

## D4 · 为什么 `pnpm verify` 全绿是硬判据，且不许放宽

本仓库刚落地的三条判据（触发器完整性 A、实体越界 B、失败路径不漏进程 C）**全部依赖 Arcade
物理与 harness 的运行时行为**，而这正是 3→4 最可能出变化的区域（`Body`、`immovable`、
`world.bounds`、纹理原点）。

🔴 **升级如果让 verify 变红，只许修模板代码，不许改判据的阈值、跳过条件或采样时机。**
放宽判据来让一次升级通过，与 E-15 是同一族的错法——那一族的定义就是"改判法让它通过"。
