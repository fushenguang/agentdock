---
roadmap-id: game-web-phaser-template
---

# trigger-integrity-and-onscreen-gate

> 2026-08-19 由 cogito-lib 台账 **E-15** 触发（「用话造关 v2」，Run `93d7b1ae`，会话 `cPSMO4X`）。
> 构建者试玩原话：**「比之前好了不少，但是游戏本身有 bug，旗子都不知道掉到哪里去了」**——
> 而四道机器闸**全绿**：BH-0/1/2 通过、IA **6/6**，`.verify-result.json` 的 `itemId` 集合与
> 平台送出集合**完全相同**（判的确实是我们的东西，不是判错了对象）。

## Why

### 一句话

**断言的触发方式，使它对被验对象的损坏免疫。**

### 真实经过

那一版游戏里旗子（终点）与刺**一直往下掉、掉出画面**。直接根因在游戏代码：

```ts
this.goal = this.physics.add.sprite(...)
this.goal.setImmovable(true)     // ← Arcade 里 immovable 不关重力，只表示"不会被碰撞推动"
```

要静止得 `setAllowGravity(false)` 或用 `staticSprite`；刺同理用了动态的 `physics.add.group()`，
而地面用的是 `staticGroup()`（正确）。全文件只有一处 `staticGroup`、零处 `setAllowGravity`。

**但这一刀不修那个游戏。** 要修的是下面这件事：

```ts
registerTrigger('level_advance', () => this.simulateReachGoal())
// simulateReachGoal() → this.player.setPosition(this.goal.x, this.goal.y)
```

它把玩家传送到旗子的**当前**位置。**旗子掉到哪，玩家就被传送到哪**——overlap 照常触发、
分数照常变、`score_feedback` 照常绿。**断言与被验对象共同移动，因此永远不会红。**

### 🔴 这条规矩本来就有，它是靠人工 review 兜的，然后它失效了

`templates/game-web-phaser/AGENTS.md:70` 逐字写着：

> **The handler may only do what a real player's own actions could cause** — spawn something in
> the world and let the existing overlap/collision logic react …
> **This one line is enforced by human review, not by the type system**; do not treat "the linter
> didn't complain" as permission.

模板参考实现做的是**往玩家脚下生成一枚硬币**（`GameScene.ts:261` `spawnCoinAtPlayer`），让既有
overlap 逻辑自己反应。执行者写的是**反过来的**：把玩家搬到目标处。它**没违反字面**（没直接写
score），却破坏了意图。

所以本刀的形态不是"补一条规矩"，是**把一条已被实测证明会失效的散文纪律挪进代码层**——
与 cogito-lib backlog 条目 13 同形态，也与该仓库既有的三处做对了的先例同形态
（`scaffold-probe.ts` / `git-identity.ts` / `artifact-port.ts` 都把判断从散文挪成了平台执行的探测）。

### 影响面不是这一版游戏

**凡是用「`registerTrigger` + 把玩家传送到目标处」这种模式实现的断言，都有同样的免疫性**——
它绕过了"玩家能不能真的走到那里"这个真问题。而模板文档鼓励的正是 `registerTrigger` 这套机制。

## What Changes

两条机器判据，**拓的是不同层**：A 让断言重新有效，B 直接抓"对象真的坏了"。

### A · 触发器不许搬动玩家（`src/debug/harness.ts` 的 `fire()`）

`fire()` 在**同步**调用 handler 的前后各取一次玩家坐标。此时物理步还没跑（`handler()` 是同步的，
`TRIGGER_SETTLE_MS` 的等待在其后），**自然位移必为 0，任何差值都只能是 handler 自己造成的**。
名为 `player` 的实体坐标被 handler 改动 → **判违规并抛错**，该条断言按既有 `unavailable` 语义
计入，`decideVerdict` 已经规定 `unavailable` 是红（不是"跳过"）。

触发器只允许**新增**实体（参考实现的 `spawnCoinAtPlayer`/`spawnObstacleAtPlayer` 原样通过）。

### B · BH-2 增加「命名实体是否仍在世界边界内」

旗子掉出画面 → **红**，与断言怎么写无关。`getSnapshot().entities` 已经带 `name/x/y`，
本刀给 harness 增加一个**只读**的世界边界字段供判定（纯读，不违反"harness MUST NOT 暴露 setter"）。

### C · 把 `player` 这个名字从"参考实现的习惯"升成契约

今天 `this.player.name = 'player'` 只出现在 `GameScene.ts:94`，是习惯不是约定。A 依赖它，
所以本刀把它写进 spec 与 `AGENTS.md`。

🔴 **并且不许静默失效**：游戏若没有名为 `player` 的实体，A 的检查会无声跳过——按本模板自己
「能被静默跳过的闸不是闸」的第一条纪律，这种情况 MUST 在结果里留下可见的一行，不许默默放行。

### D · `pnpm verify` 失败时不许漏进程（🔴 2026-08-19 复核本刀时撞出，构建者裁定并进本刀）

`scripts/verify.mjs:337-340` 的清理写在 `finally` 里，看起来是对的——**但 `fail()` 的最后一行是
`process.exit(1)`（`verify.mjs:149`），它跳过 `finally`**。

于是：**verify 通过 → 干净；verify 失败 → headless Chrome 与静态服务器都留着。**
复核本刀时实测到一棵 11 分钟、GPU helper 吃 24% CPU 的孤儿进程树。

🔴 **爆炸半径有先例**：2026-08-12 在 4 vCPU 的开发机 guest 里，六棵孤儿 headless Chrome 让
load average 冲到 19，`waitForShelleyHealthy` 超时，平台把 `dev_machines.status` 写成 `error`,
**构建者在界面上看到「Shelley 环境准备失败」，而 Shelley 一直是好的**。
而在 VM 里，**执行者迭代期间 `pnpm verify` 失败是常态不是例外**——泄漏走的正是最常走的那条路。

形状与 E-14 同族：**清理写在成功路径上，失败路径没有任何东西会告诉你它没执行。**

## 判据（🔴 先于实现定死，见 cogito-lib PRD `vm-coding-agent-harness` 护栏四）

1. **变异验证 A**：把参考实现的 `spawnCoinAtPlayer` 改成"把玩家传送到硬币处"，A **必须红**；
   改回必须绿。
2. **拿真实坏件验 B**：用「用话造关 v2」那一版真实产物（旗子/刺会下坠）跑 `pnpm verify`，
   B **必须红**。比造一个人工样本硬——它是真实发生过、且当时全绿的那份代码。
3. **失败路径不漏进程**：构造一次必然失败的 verify（沿用判据 1 的变异即可），跑完后按精确 PID
   核对**没有**残留的 headless Chrome 与静态服务器端口。🔴 判"有没有残留"只能靠 `ps`，
   不能靠"代码看起来会清理"。
4. **真投一次 Run**：新脚手架项目跑一遍，A/B 都不许对**正确**实现产生假红。
   ⚠️ **本刀不做判据 4**，构建者 2026-08-19 明确安排"先实现，投 Run 等我有空"。
   归档时如实标注「未真投 Run」，**不许假装验过**。

## Non-goals

- ❌ **不修「用话造关」那一版游戏**。存量生成项目不会自动拿到模板改动（发布链路是
  changeset → Version Packages PR → npm → 下一次脚手架）。这一点如实记在这里，不假装它被修了。
- ❌ **不改断言模板集合**（仍是上游 7 个），不新增 `templateId`。
- ❌ **不给 A/B 任何逃生阀**（环境变量开关、`skip` 字段）。能被关掉的闸不是闸。
- ❌ **不动 `press()` / `applyState()` 的既有契约**，不新增任何 setter 形状的 harness 方法。
