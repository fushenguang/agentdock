# tasks · cli-skill-publish

> 机制见 `design.md`。**§2（零后端）与 §4（不推送）是硬边界。**

---

## 阶段 0 · 排雷

- [ ] 0.1 ★ 核实 `skills-ref validate`（Agent Skills 官方校验器）**能否被程序化调用**（作为库 import？子进程？只有 CLI？），以及它的输出是否可解析。**上游硬护栏是"不自建校验器"**，所以这条决定 §3 怎么写
- [ ] 0.2 读 `cli-runtime` spec 与既有 `init` 命令，确认新增命令要遵的约定（mode detection、错误码表、`core/*` 保持纯、`main.ts` 里怎么挂 subCommand）
- [ ] 0.3 取一个**真实** skill 作样本——thefoolai 的 `apps/electron-app/SKILLs/lesson-prep`，看它的 frontmatter 实际长什么样（含 L2 合规后的 `metadata:` 形态）
- [ ] 0.4 确认 `--json` 契约的既有错误码表，新增码要与之一致（注：既有实现有一处 spec/code 漂移——spec 说 `CLI_VERSION_OUTDATED` 用 exit 2，代码一律 exit 1。**不在本刀修，但别跟着错**）

## 阶段 1 · `skill validate`

- [ ] 1.1 `core/` 下实现校验（**保持纯**：不写 stdout、不 `process.exit`）
- [ ] 1.2 优先用官方校验器（按 0.1 结论）；确实不可程序化调用时，**先报告再决定**，不要默认自己写
- [ ] 1.3 非 spec 顶层键：**只报告不强制**（强制宿主私有约定 = 反向依赖）
- [ ] 1.4 human / agent 双 adapter
- [ ] 1.5 单测（现有测试都在 `core/__tests__/`，遵同一组织方式）

## 阶段 2 · `skill publish`

- [ ] 2.1 先跑 validate，不通过不产出
- [ ] 2.2 产出 manifest 条目（schema 借 `src/registry.json` 的形，**不复用其加载代码**——那套写死了"内容打包在 CLI 包内"的本地路径）
- [ ] 2.3 写入 `--registry <path>` 指定的**本地 checkout**，**到此为止**：不 commit、不 push、不建 PR
- [ ] 2.4 幂等：同一 skill 重复 publish 应更新条目而非追加重复
- [ ] 2.5 单测

## 阶段 3 · 验收（**按实测写**）

- [ ] 3.1 **用真实 skill 跑通**：拿 `lesson-prep` 真跑一次 validate + publish，产出真实 manifest 条目（**不是构造的假目录**）
- [ ] 3.2 **验收六条**：`pnpm install` / `pnpm check-types` / `pnpm build` / `pnpm format`（无 diff）/ `openspec validate cli-skill-publish` / 无密钥
- [ ] 3.3 `pnpm align:check` 全绿（orphan-change 与 Non-goals 是硬失败）
- [ ] 3.4 ★ **零依赖冒烟复跑**：拷 `dist/` 到无 node_modules 空目录，跑通 `--help` 与新命令。**新增命令可能引入新依赖，而"单文件 bundle 零依赖"是针对某次 build 的实证，不是永久保证**
- [ ] 3.5 `pnpm changeset`（本仓库发布走 changesets）

## 阶段 4 · 边界仪式

- [ ] 4.1 `roadmap.yaml` 的 `skills-hub-cli` 状态同步（⚠️ CODEOWNERS 保护，须人工 review）
- [ ] 4.2 回写上游 thefoolai 的 `skill-commerce-loop` PRD §4 第 1 行状态
- [ ] 4.3 走 PR（Gate④ 人类合并）
