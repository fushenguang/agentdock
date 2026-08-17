# tasks · cli-publish-source-normalization

## 0 · 前置：补齐漏同步的 base spec

- [x] 0.1 把 `openspec/changes/archive/2026-08-16-cli-skill-publish/specs/cli-skill-publish/spec.md`
      的 `## ADDED Requirements` 内容搬进 `openspec/specs/cli-skill-publish/spec.md`
      （去掉 `## ADDED Requirements` 标题行，逐字保留其下全部 Requirement/Scenario，**不改语义**）。
      理由见 proposal「附带修正」。

## 1 · 实现

- [x] 1.1 新建 `packages/cli/src/core/gitRemoteUrl.ts`，导出纯函数
      `normalizeGitRemoteUrl(remote: string): { url: string } | { error: string }`，
      按 design §1 规则表实现。**零外部依赖**（只用字符串处理 + Node 内置 `URL`；
      SCP 形式手写分支，`URL` 解析不了它）。不读文件、不跑子进程、不联网。
- [x] 1.2 错误 message 按 design §2：含**原始 remote 原文** + `git remote set-url origin https://…` 修法。
- [x] 1.3 `skillPublish.ts` 的 `resolveGitSource` 改为把 `git remote get-url origin` 的输出
      过一遍 `normalizeGitRemoteUrl`；失败时沿用既有错误码 `SKILL_SOURCE_UNRESOLVED`
      （**不新增错误码**）。`path` 推导逻辑一行不动。

## 2 · 测试

- [x] 2.1 新建 `packages/cli/src/core/__tests__/gitRemoteUrl.test.ts`，表驱动覆盖
      design §1 全部 11 行（含 4 行错误路径）。
- [x] 2.2 `skillPublish.test.ts`：把既有断言 `entry.source === FAKE_REMOTE` 改为断言
      **规范化后**的值（旧断言正好锁死了缺陷行为）。
- [x] 2.3 `skillPublish.test.ts` 新增「确定性对照」用例：同一 `owner/repo`，一个 repo 的
      origin 设 SSH、另一个设 HTTPS，分别 publish → 两条 entry 的 `source` **字符串相等**。
- [x] 2.4 `skillPublish.test.ts` 新增「凭据不进产物」用例：origin 含 token →
      产出的 `source` 中搜不到该 token 子串。
- [x] 2.5 `skillPublish.test.ts` 新增「本地路径 origin 失败且 registry 无改动」负例。
- [x] 2.6 `pnpm --filter @cogito.ai/cli test` 全绿。

## 3 · 真机验收（判据 = 陌生人能 clone，不是退出码）

- [x] 3.1 `pnpm --filter @cogito.ai/cli build`，在**本仓库内**（origin 为
      `git@github.com:fushenguang/agentdock.git`，仓库 PUBLIC）对一个真实 skill 目录跑一次
      `skill publish --registry <一次性目录>`。
- [x] 3.2 **读产出的 `skills.json` 内容**（不是只看退出码），确认
      `source == https://github.com/fushenguang/agentdock`。把内容贴进验收记录。
- [x] 3.3 正向：`GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND=/bin/false git clone --depth 1 <产出的 URL>`
      → 成功。（需要时 `export https_proxy=http://127.0.0.1:7897`，**只加在这一步**，不进代码/配置）
- [x] 3.4 **反向对照（不可省）**：同样环境 clone 原始 `git@github.com:fushenguang/agentdock.git`
      → 必须失败。只验 3.3 无法排除「本来就没问题」。

## 4 · 四道门（AGENTS.md 验收条件）

- [x] 4.1 `pnpm install` exit 0
- [x] 4.2 `pnpm check-types` exit 0
- [x] 4.3 `pnpm build` exit 0
- [x] 4.4 `pnpm format` 后，**本 change 触碰的文件**无 diff。
      ⚠️ 全仓另有 **101 个既有不合格文件**（本刀开工前实测的基线，与本刀无关），
      不得拿它当挡箭牌，也不得顺手格式化它们（会淹没 diff）。判据：
      `git status --short` 里出现的文件必须全部是本刀有意改动的。
- [x] 4.5 `openspec validate cli-publish-source-normalization` exit 0
- [x] 4.6 `pnpm align:check` 全绿
- [x] 4.7 无真实密钥（本刀恰好新增了「凭据不得进产物」的逻辑，顺带自查测试固件里
      **不得**写真 token —— 用明显的假串如 `FAKE-TOKEN-DO-NOT-USE`）

## 5 · 收口

- [x] 5.1 回写 thefoolai `apps/wiki/content/docs/prd/skill-commerce-loop.mdx` §4.2 ★★：
      标记该缺陷已修 + 指向本 change。（跨仓，属 thefoolai 侧改动，走它自己的门）
- [x] 5.2 归档本 change 时**同步 base spec**（把 delta 合进 `openspec/specs/cli-skill-publish/`）——
      上一次归档正是漏了这一步，见 task 0.1。
