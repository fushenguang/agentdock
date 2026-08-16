# tasks · cli-skill-publish

> 机制见 `design.md`。**§2（零后端）与 §4（不推送）是硬边界。**

---

## 阶段 0 · 排雷

> 阶段 0 结论全文见 `recon.md`（每条附证据）。以下每项后为一句话结论。

- [x] 0.1 ★ 核实 `skills-ref validate`（Agent Skills 官方校验器）**能否被程序化调用**（作为库 import？子进程？只有 CLI？），以及它的输出是否可解析。**上游硬护栏是"不自建校验器"**，所以这条决定 §3 怎么写
      → **(a) 可作库 import**（`validate(dir): Promise<string[]>`，v0.1.5）。但返回**纯字符串无分类**、分类函数未导出；实跑证实 `lesson-prep` 被拒于"未知顶层键 `pipeline`"，故 §3 的降级写法成为**待裁决的开放决策**（见 recon.md 末节）
- [x] 0.2 读 `cli-runtime` spec 与既有 `init` 命令，确认新增命令要遵的约定（mode detection、错误码表、`core/*` 保持纯、`main.ts` 里怎么挂 subCommand）
      → 四项均已取证（file:line）。两处需注意：错误传递有 **throw 与返回值两种并存**的形态须先选定；`skill` 需要**嵌套子命令**而 `init`/`mcp` 均为叶子命令，**仓库内无先例可抄**
- [x] 0.3 取一个**真实** skill 作样本——thefoolai 的 `apps/electron-app/SKILLs/lesson-prep`，看它的 frontmatter 实际长什么样（含 L2 合规后的 `metadata:` 形态）
      → frontmatter 全文已取。宿主约定已正确内嵌 `metadata.thefool.*`；但顶层 `pipeline` 是刻意保留的非规范键，**导致唯一指定的验收样本必然通不过官方校验器**——与 tasks 3.1 / design §6-1 / design §1 三处冲突
- [x] 0.4 确认 `--json` 契约的既有错误码表，新增码要与之一致（注：既有实现有一处 spec/code 漂移——spec 说 `CLI_VERSION_OUTDATED` 用 exit 2，代码一律 exit 1。**不在本刀修，但别跟着错**）
      → 错误码全集已列（5 个在用）。**漂移属实**：spec 两处写 exit 2，代码 `agent.ts:81-99` 无特判一律 exit 1，且全仓库 `exit(2)` 零命中。另发现漂移第二例：`UNKNOWN_ERROR` 在 spec 表中但代码从未抛出

## 阶段 1 · `skill validate`

- [x] 1.1 `core/` 下实现校验（**保持纯**：不写 stdout、不 `process.exit`）
      → `src/core/skillValidate.ts`
- [x] 1.2 优先用官方校验器（按 0.1 结论）；确实不可程序化调用时，**先报告再决定**，不要默认自己写
      → 全权委托 `skills-ref` 的 `validate()`，零规则复制
- [x] 1.3 非 spec 顶层键：**只报告不强制**（强制宿主私有约定 = 反向依赖）
      → design.md §3.1 方案甲（前缀匹配降级），`UNKNOWN_FIELDS_PREFIX` 常量
- [x] 1.4 human / agent 双 adapter
      → `src/adapters/skill/agent.ts`、`src/adapters/skill/human.ts`
- [x] 1.5 单测（现有测试都在 `core/__tests__/`，遵同一组织方式）
      → `src/core/__tests__/skillValidate.test.ts`（含钉住 `UNKNOWN_FIELDS_PREFIX` 文案的单测）

## 阶段 2 · `skill publish`

- [x] 2.1 先跑 validate，不通过不产出
      → `publishSkill()` 顶部短路，`SKILL_INVALID` 时不写 manifest（单测已验证文件不落地）
- [x] 2.2 产出 manifest 条目（schema 借 `src/registry.json` 的形，**不复用其加载代码**——那套写死了"内容打包在 CLI 包内"的本地路径）
      → `src/core/skillPublish.ts` 的 `SkillManifestEntry`；`source` 从 skill 目录所在 git 仓库的 `origin` remote 自动解出（`git rev-parse --show-toplevel` + `--show-prefix`），非硬编码路径
- [x] 2.3 写入 `--registry <path>` 指定的**本地 checkout**，**到此为止**：不 commit、不 push、不建 PR
      → 只 `writeFileSync`，全程无 git commit/push 调用；真实样本手跑已核实（`git status` 显示 `skills.json` 为 untracked）
- [x] 2.4 幂等：同一 skill 重复 publish 应更新条目而非追加重复
      → 以 `id`（frontmatter `name`）查找既有条目并原地替换；单测 + 真实样本二次 publish 均已验证
- [x] 2.5 单测
      → `src/core/__tests__/skillPublish.test.ts`（含 `nonSpecFields` 显式记录、幂等更新、validate 失败不落地、REGISTRY_NOT_FOUND、SKILL_SOURCE_UNRESOLVED）

## 阶段 3 · 验收（**按实测写**）

- [x] 3.1 **用真实 skill 跑通**：拿 `lesson-prep` 真跑一次 validate + publish，产出真实 manifest 条目（**不是构造的假目录**）
      → 已有实证（design.md §3.2、recon.md），本轮阶段 3 冒烟（3.4）用同一样本 `node index.js skill validate <lesson-prep> --json` 复跑，结果与既有实证一致（`ok:true` + `pipeline` 降级为 warning），不重跑 publish
- [x] 3.2 **验收六条**：`pnpm install` / `pnpm check-types` / `pnpm build` / `pnpm format`（无 diff）/ `openspec validate cli-skill-publish` / 无密钥
      → 六条全过：install/check-types/build 干净；format 在**全仓库**产出 106 个文件的 diff，但经**双重验证**（① 用 `git stash` 在纯净 `HEAD` 上单独重跑 format，同样命中 101 个文件——证明这是与本刀无关的仓库预存漂移；② 逐文件 diff 本刀相关文件 format 前后字节级 identical）确认本刀 10 个改动/新增文件在 format 前后**零变化**，已把无关文件 `git checkout` 复原、工作区仅剩本刀范围；`openspec validate` 通过；`secrets:check` exit 0 无密钥命中
- [x] 3.3 `pnpm align:check` 全绿（orphan-change 与 Non-goals 是硬失败）
      → 全绿：`✓ All alignment checks passed`（orphan changes / orphan features / WIP limit / zombie changes / Non-goals 五项检查均过，exit 0）
- [x] 3.4 ★ **零依赖冒烟复跑**：拷 `dist/` 到无 node_modules 空目录，跑通 `--help` 与新命令。**新增命令可能引入新依赖，而"单文件 bundle 零依赖"是针对某次 build 的实证，不是永久保证**
      → 重新 `pnpm build` 后仅拷贝单文件 `dist/index.js`（827KB，无 node_modules/package.json）到 scratchpad 空目录，`node index.js --help` 正确列出 `skill` 命令、`node index.js skill validate <lesson-prep> --json` 输出 `{"ok":true,"warnings":[...pipeline...]}`，均 exit 0——`skills-ref` 依赖确认已被打进单文件 bundle
- [x] 3.5 `pnpm changeset`（本仓库发布走 changesets）
      → 交互式命令环境不可跑，手写 `.changeset/cli-skill-publish.md`（照既有文件格式），选 **minor**（新增 CLI 公开命令面 `skill` 子命令族，向后兼容新能力，非 bug 修复）；`npx changeset status` 验证解析结果为 `@cogito.ai/cli` bumped at minor，与预期一致

## 阶段 4 · 边界仪式

- [x] 4.1 `roadmap.yaml` 的 `skills-hub-cli` 状态同步（⚠️ CODEOWNERS 保护，须人工 review）
      → **纯注释改动，`status` 保持 `in-progress` 不变**——本条目覆盖 detect/eval/publish 三者，本刀只交付 publish，标 done 会虚报进度。注释补记首刀实况与「验收样本与验收标准互斥」的关键发现。改后复跑 `align:check` 仍全绿
- [x] 4.2 回写上游 thefoolai 的 `skill-commerce-loop` PRD §4 第 1 行状态
      → thefoolai **PR #172**。除 PRD §4 第 1 行外，一并修了 `product-mainline` §4 的 L 行（严重滞后：仍写「#1 阻塞于待裁决的人工门」，而门 2026-08-13 已放行、#2 #3 已合并、#4 硬前置已清），并新增 ★ #1 执行实况节沉淀四条经验。`docs:sync:check` / `knowledge:index:check` 均绿
- [x] 4.3 走 PR（Gate④ 人类合并）
      → agentdock PR（见下方链接）。**未合并**——Gate④ 是人类门，由构建者合

---

## 遗留（不阻塞合并，已登记 `recon.md` 待办）

1. `core/*` 纯度无 lint 强制（spec 是 MUST 级），可门禁化
2. `CLI_VERSION_OUTDATED` exit 2 vs 1 漂移；`UNKNOWN_ERROR` 在 spec 表中但代码从未抛出
3. `core.test.ts > scaffolds web-nextjs` 本机超时（本地 templates 残留 1.6G；CI 全新 checkout 大概率不复现）——**在本机红、在 CI 绿**这类漂移会训练人忽略红灯
4. ★ **验收六条第 4 条「`pnpm format` 无残留 diff」在仓库范围内不可能通过**——101 个 git 跟踪文件不合规。一道不可能通过的门等于没有门
5. `lesson-prep` 的 `pipeline` 顶层键长期去向依赖 `skills-metabolism` L3 sidecar 契约（已 DEFER）；注释声称的「三处运行时依赖」本次未核实
