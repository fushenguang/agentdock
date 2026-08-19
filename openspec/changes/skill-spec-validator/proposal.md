---
roadmap-id: skills-hub-cli
---

# skill-spec-validator

> 构建者 2026-08-19 裁决：**自研 + 对拍**，并明确三条要求——①严格遵循官方/行业规范 ②充分测试 ③**开源，完善并补充开源生态**。排在 B3 之后执行。

## Why

CLI 的发布门只用了 `skills-ref` 的两个 API（`validate(dir)`、`readProperties(dir)`），即「解析 SKILL.md 的 YAML frontmatter + 按规范校验」。但这块地基查下来是空的。

### 一 · 我们装的不是官方实现

| | 官方 | npm `skills-ref@0.1.5`（我们在用）|
|---|---|---|
| 位置 | `agentskills/agentskills`（Apache-2.0，24k★）| npm，**无 repository / homepage** |
| 语言 | **Python**（PyPI `skills-ref@0.1.1`，作者 `klazuka@anthropic.com`）| JavaScript |
| 许可 | Apache-2.0 | MIT |
| 维护者 | Anthropic | 匿名个人 |

**官方从未发布 npm 包。** 当初「不自建校验器、判定权 100% 留在官方实现」的护栏，**事实上从来没有成立**。

### 二 · 但接官方也不行（实测三条硬伤）

- **官方自己说不用于生产**：`skills-ref/README.md` 首句 —— *"This library is intended for demonstration purposes only. It is not meant to be used in production."*（npm 那个是照抄它，所以这句话是**上游对自己参考实现的定性**，不是移植者的问题）
- **接口在漂移**：PyPI 0.1.1 装出来的可执行文件叫 **`agentskills`**，而 main 分支 pyproject 写的是 `skills-ref` —— 已发布版与主干对不上
- **跨语言依赖**：给一个纯 Node CLI 强加 Python 3.11+ 运行时，破坏「装了就能用」

### 三 · 生态里没有可用的库

| 包 | 周下载 | 为什么用不了 |
|---|---:|---|
| `skills`（vercel-labs，29k★）| 840 万 | 是**安装器**不是校验器；`main`/`exports` 均为 null，无可 import 的 API |
| `skill-check`（187★）| 2.6 万 | 规则覆盖对得上，但 npm 包 `main`/`exports`/`module` **全为 null**，只能当 CLI/Action |
| `agent-skills-ts-sdk` | 402 | 唯一真正的库、设计最贴规范；但 **0★、2 个月新、单人维护** |

⇒ **「有一个能当库用、生产可用的 JS 校验器」这件事，生态里目前是空的。** 这正是可以补上的位置。

### 四 · 三家实现都有同一个静默损坏（对拍实测）

同一批样本跑三个实现：

| 实现 | 顶层 `version:` | **`metadata` 塞嵌套对象** |
|---|---|---|
| 官方 Python `skills-ref` | error | ❌ 静默转字符串，判 **valid** |
| npm `skills-ref@0.1.5` | error | ❌ 静默转 `"[object Object]"`，判 **valid** |
| `agent-skills-ts-sdk` | error | ✅ 抛错，判 **invalid** |

规范白纸黑字写着 `metadata` 是 *a map from string keys to string values*。**遇到非字符串值就该报错**——静默强转是实现缺陷，不是规范允许的宽容。

## What Changes

新建一个**独立开源包**（暂名待定，见「待裁决」），提供两个函数：`validate(dir)` 与 `readProperties(dir)`，行为**严格依据规范正文**。

### 三条硬要求（构建者定）

1. **严格遵循规范** —— 每条规则在代码里注明它对应规范的哪一句。**不发明规则**：
   - ⚠️ 关键区分：拒绝非字符串 `metadata` 值**不是发明规则**，而是**执行规范里已经写着的约束**（三家实现都没执行）。**偏离的是实现，不是规范。**
   - ⚠️ **semver 门不进这个包**。那是 **thefoolai registry 的准入规则**，不是 Agent Skills 规范的一部分。规范对 `metadata` 的值不作任何形状约束。**混进去就是把我们的私有偏好冒充成标准**——留在 agentdock 的 publish 路径里。
2. **充分测试** —— 每条规则一组表驱动用例（正例 + 反例），外加一套**样本语料**；反例必须覆盖"看起来像但不合规"的写法（顶层 `version:`、嵌套 `metadata`、大写 name、首尾连字符、超长 description…）
3. **开源，补充生态** —— MIT 发布到 npm，README 里逐条标注规范出处，并**显式声明与两个参考实现的已知行为差异**（metadata 严格性），让使用者知道差在哪、为什么。

### 对拍（这一刀区别于"又一个校验器"的地方）

在 CI 里跑**差异对拍**：同一批样本同时喂给我们的实现与**官方 Python 实现**，逐样本比对判定结果；不一致就告警并要求人工裁决——**是我们错了，还是官方实现没执行自己的规范**。

这样"发散"是**可检测的**，而不是靠信任。Python 依赖只存在于 CI，不落到用户机器。

## Non-goals

- **不做 `toPrompt`**（生成 `<available_skills>` XML）—— 当前无消费者，等有需求再说
- **不做 skill 质量评测** —— 那是 `skill-doctor` / `claude plugin eval` 那一类 LLM 驱动的事，与"格式合不合规"是两件事
- **不把 registry 准入规则（semver 等）放进这个包**（理由见上）
- **不 vendor `agent-skills-ts-sdk` 的代码** —— 可以参考其正确设计（MIT 允许），但要自己按规范正文实现，否则等于把它的判断连同风险一起继承
- **不改 CLI 现有的"未知顶层键降级为 warning"策略** —— 那是 agentdock 侧的产品决策（`cli-skill-publish` 方案甲），与本包无关，单独评估

## 待构建者裁决

1. **包名**：`agent-skills-spec` / `skill-md` / `agentskills-spec` / `skills-md-parser` —— **四个 npm 上都可用**（实测 404）。面向生态采用，名字要一眼看出"这是 Agent Skills 规范的实现"，我倾向 `agent-skills-spec`
2. **放哪个仓**：agentdock（MIT，已有 `packages/` 与发布链路，最省事）vs 单独开一个仓（更像"生态项目"而不是"某公司工具的一部分"，利于采用）
3. **要不要给上游提 issue** —— 拿我们的对拍证据，把 metadata 静默强转报给 `agentskills/agentskills`。**这既是回馈，也是 hub 的存在感**

## 验收判据

- 我们的实现 vs 官方 Python 实现，**样本语料逐条对拍**，差异只剩下已声明的那一处（metadata 严格性），且该差异**在 README 与测试里都被显式钉住**
- **反向对照**：故意注入一条规则错误 → 对应用例变红（绿→红→绿三态齐全）
- 发布到 npm 后，**在一个干净目录里 `npm i` 并真的 `import` 调用一次**（不是看 CI 绿）
- agentdock 的 CLI 切到本包后，既有 publish/validate 测试**全部仍绿**
