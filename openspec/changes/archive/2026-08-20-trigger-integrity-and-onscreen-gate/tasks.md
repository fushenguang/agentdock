# tasks · trigger-integrity-and-onscreen-gate

> 🔴 判据先于实现定死，见 proposal「判据」一节。
> ✅ **归档时补记（2026-08-20）：判据「真投一次 Run」已还。** 新项目「打星星P4」
> （Run `1d4bbe7d`、会话 `cOJBJ46`，Phaser 4.2.1）实测：`assertions.triggerIntegrityCheck
> = {ran:true}`（A 参与）、BH-2 detail 含 `entities within bounds across 2 samples`（B 参与）、
> VM 上 `ps` 查无残留 Chrome（C 成立），IA 6/6、`itemId` 集合逐条相同，**全绿无假红**。
> 构建者已真机试玩该产物并判「逻辑是通的，可以玩」。

## 1 · A：触发器完整性

- [x] 1.1 `src/debug/harness.ts` 的 `fire()` 在 `handler()` 前后**同步**读取名为 `player` 的
      实体坐标，等值比较，任一坐标变化即抛错（错误文案要指出违规的 trigger 名、前后坐标）
- [x] 1.2 没有 `player` 实体时不抛错，但把"未生效"这一事实带到 `.verify-result.json`
      （D3：不许静默）
- [x] 1.3 `scripts/assert.mjs`：`fire()` 抛错的这条断言按既有 `unavailable` 语义计入，
      `hint` 说明是**触发器违规**而不是"前提不满足"
- [x] 1.4 `src/scenes/GameScene.ts` 保持 `this.player.name = 'player'`；`AGENTS.md:70` 那条
      "enforced by human review, not by the type system" 改写为"平台会判"，并写明 `player` 命名是契约

## 2 · B：BH-2 边界判据

- [x] 2.1 harness 快照增加**只读**的世界边界（优先 `physics.world.bounds`，退回画布尺寸，
      带 `source` 字段）。🔴 不得新增任何 setter
- [x] 2.2 `scripts/verify.mjs` 的 BH-2 增加命名实体越界判据，detail 写明越界实体与边界来源
- [x] 2.3 无开关、无环境变量、无清单跳过字段

## 3 · 判据（实现完必须真跑，结果贴进 `fidelity-check.md` 或本文件末尾）

- [x] 3.1 **变异验证 A**：把 `spawnCoinAtPlayer` 改成"把玩家传送到硬币处" → A 必须红；
      **改回后必须绿**，且 `git diff` 归零
- [x] 3.2 **拿真实坏件验 B —— 已执行（2026-08-20），结论是负的，如实记**。
      从 VM 只读取回「用话造关 v2」真实源码（`/home/workshop/v2-d8ec77a4`），本地叠加本刀判据跑
      `pnpm verify`：**BH-2 没红**。不是"没越界"，是两次采样里**从来没出现过 goal 或刺**——
      那份游戏只给 `player` 命了名（`GameScene.ts:316`），而 goal/刺全都没有 `.name`
      （`:320-336`），`collectEntities()` 明写 `if (!named.name) continue`。
      🔴 **B 的可见范围建立在一条没人保证的契约上，而那正是散文纪律。** 详见 design **D9**。
      ✅ **同一次取证里 A 是真红的**：`m-score_feedback` / `m-game_over_trigger` 因该游戏
      "把玩家瞬移到目标处"而判违规——**主防线成立**，见 design **D10**。
      修法方向（不依赖命名的信号）见 **D11**，留给下一刀，本刀不改已发布行为。
- [x] 3.3 单元测试：`tests/` 下补 A 的判据测试（`fire()` 的等值比较不依赖浏览器的部分）
- [x] 3.4 `pnpm build` / `pnpm test`（65/65）/ `pnpm check-types` 全绿。
      ⚠️ **本条原文写的 `pnpm lint` 不存在**：该模板没有 lint 脚本，根 `eslint.config.js`
      显式排除 `templates/**`（"Templates manage their own lint setup"）。执行者如实报了
      这条而不是发明一个 lint 脚本或静默跳过——**这是对的**，任务清单的模板化措辞错了，不是它漏做

## 4 · C：失败路径的进程清理（构建者 2026-08-19 裁定并进本刀）

- [x] 4.1 `fail()` 不再 `process.exit(1)`——改为设置 `process.exitCode` 并让控制流走到 `finally`，
      或把 `proc.kill()` / `server.close()` 提到无论成败都会执行的位置
- [x] 4.2 🔴 清理必须覆盖**所有**退出路径（`fail()`、未捕获异常、Node 版本自检失败），
      不许只修 `fail()` 一条
- [x] 4.3 判据：跑一次必然失败的 verify，之后 `ps` 核对无残留 headless Chrome、端口已释放。
      **按精确 PID 判定，不许按名字子串匹配**

## 5 · 发布与登记

- [x] 5.1 changeset（模板改动，patch 或 minor 由 changeset 判）
- [x] 5.2 ✅ 已完成（cogito-lib PR #3 已合并）：台账 E-15 处置改写 + PRD 决策日志四行。原文如下：cogito-lib 侧登记：台账 E-15 的「处置」从"记录"改为本 change 认领；
      `vm-coding-agent-harness` PRD § 3 决策日志追加一行
- [x] 5.3 ✅ **核完：本仓库不需要同步改动**。`normalizeGateResults`
      （cogito-lib `core/types/workspace.ts:1844`）里 gate 的 `id` 是自由字符串，
      新增的 `BH-2 render (entity bounds, second sample)` 不会被拒；`schemaVersion` 仍是 1；
      新增的 `triggerIntegrityCheck` 落在 `assertions` 段，而 web 侧 `GateResultSummary`
      本来就不读那一段。`gate-templates.ts` / `assertion-templates.ts` 的注释镜像引用的是
      `KEY_TABLE` / `readValues()` / HUD 文案，本刀都没动
