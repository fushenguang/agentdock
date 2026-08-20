# tasks · phaser4-template-upgrade

## 1 · 依赖与源

- [x] 1.1 新增 `templates/game-web-phaser/.npmrc`：`registry=https://mirrors.tencent.com/npm/`，
      注释写清**为什么**（npmmirror 的 phaser 停在 2026-04-10、4.2.1 返回 404、包体 19.5 MB）
      与**为什么只有这个模板写**（D2 的不对称说明）
- [x] 1.2 `package.json`：`"phaser": "^3.90.0"` → `"^4.2.1"`
- [x] 1.3 `pnpm install` 更新 lockfile，**读回确认锁的是 4.2.1**
- [x] 1.4 🔴 **不许**在 agentdock 仓库根加 `registry=`（design D2：会弄坏 CI 发布）

## 2 · 代码迁移

- [x] 2.1 `pnpm build` + `pnpm check-types`，按报错逐条修
- [x] 2.2 逐条复核 design D1 的三处：纹理原点翻转（要眼看画面）、`Math.TAU`（改完再 grep 一次）、
      Pipeline/Filter/`setTintFill`
- [x] 2.3 `pnpm test` 全绿

## 3 · 判据（真跑，贴真实输出）

- [x] 3.1 `pnpm verify` 全绿，**含新落地的 A/B/C 三条判据**。
      🔴 红了只许修模板代码，**不许放宽任何判据**
- [x] 3.2 `node_modules/phaser/skills/` 下 `SKILL.md` 计数 **= 28**（读回，不是推断）
- [x] 3.3 截图眼看一次 —— **规划方亲自看过**（不是转述执行者描述）：HUD「Score: 0」在左上角、
      底部提示文字均**正向**，布局正常。<br/>
      ⚠️ 执行者如实标了一条局限：三个占位纹理（player 圆角方块 / bullet-coin 圆 / obstacle 方块）
      **上下对称**，翻转发生在它们身上肉眼分不出。**但文字不是对称的**——文字正向就是纹理原点
      未翻转的直接证据，这条比"对称素材看不出"强，记在这里免得下次重复纠结

## 4 · 同步与发布

- [x] 4.1 `pnpm generate-registry`，核对 `registry.json` 的 `resolvedDependencies.phaser`
      与那句 `"Phaser 3 + Vite + TypeScript starter…"` 描述
- [x] 4.2 模板内文档的 Phaser 3 字样逐处核对（`AGENTS.md` / `README.md` / `PROJECT_CONTEXT.md`）
- [x] 4.3 changeset（`@cogito.ai/cli`，破坏性提示要写清：**新脚手架项目从此是 Phaser 4**）
- [x] 4.4 ✅ **由规划方完成**（执行者因禁令"不许碰 cogito-lib"与本条冲突而停下上报——**它停对了，
      冲突是规划方造的**）。cogito-lib 分支 `docs/phaser4-upgrade-registration`：PRD 决策日志两行 +
      backlog 条目 0.5 改写。原文如下：cogito-lib 侧登记：PRD `vm-coding-agent-harness` 决策日志记一行，
      并把 design D3 那条（`PLATFORM_CONTEXT` 翻转的副作用）写进 backlog 条目 0.5
