# Tasks · ia-assertion-runner

> 四波，严格按依赖串行（2 依赖 1，3 依赖 2，4 依赖 3）。
>
> 🔴 四条纪律：
>
> 1. **不许自行扩大范围。** proposal 的 Non-goals 表里那几条（问卷枚举化、投递
>    `assertions.json`、web 渲染、回流通道、lint/CI）是明确切出去的，**顺手做了也是越界**。
> 2. **判不了就说判不了，不许当成通过。** `absent` / `unavailable` / 前提不满足这三种
>    情况各有各的出口，任何一种都不许走到「IA 通过」那条路上。
> 3. **每个判定函数都要有负例。** 只测正例的话 `return true` 也全绿——这是上一刀写死的
>    纪律，本刀继续。
> 4. **harness 不许长出 setter。** 见 design D3 那张表；新增任何写入型方法都要回来改
>    design 并请示。

## 1. 契约与参考实现 —— 第 1 波

- [x] 1.1 `src/debug/harness-types.ts`：`StateRole` / `StateDescriptor` / `EntitySnapshot` /
      `HarnessSnapshot` / `GameHarness`。🔴 **零 import**（同 `dimensions.ts` 的理由），
      注释里写明这条约束与它保护的是什么
- [x] 1.2 `src/debug/harness.ts`：`installHarness(game)` 把实现挂到 `window.__gameHarness`，
      `version: 1`。`getSnapshot()` 枚举当前 scene 的 `Phaser.GameObjects.Text` 得到
      `hudTexts`（🔴 canvas 上的字 DOM 查不到，这是唯一路径）
- [x] 1.3 `applyState(id, seed?)`：`jump()` → `isValidStart()` 自检 → 施加到活实例 →
      等场景真的切过去 → 返回 boolean。**自检不过返回 `false`，不硬切**
- [x] 1.4 `listStates()` 返回 `{ id, role }[]`；`jump/isValidStart` 签名与 Node 可导入性
      **不许动**
- [x] 1.5 `src/main.ts`：**无条件**调 `installHarness(game)`（两个构建都进，design D3）。
      不要放进 `import.meta.env.MODE === 'learn'` 那个分支
- [x] 1.6 `tests/harness-types.test.mjs`：bare Node 导入 `harness-types.ts` 成功
      （守 1.1 那条零 import 约束，跟 `state-jump.test.mjs` 同一个做法）

## 2. 参考实现长出 gameover / restart / trigger —— 第 2 波（依赖 1）

> 🔴 这一波是**为了让运行器能被证明跑得通**，不是加游戏内容。做到够判定为止，不做多。

- [x] 2.1 `src/scenes/GameOverScene.ts` + 一个失败条件（`role: 'gameover'`）
- [x] 2.2 重开：一个按键触发，回到 gameplay 且分数归零
- [x] 2.3 注册两个 trigger（得分 / 失败），🔴 **只做玩家自己也能造成的事**——
      在世界里生成对象并让碰撞自然发生，**不许 `this.score += n`**（design D3）
- [x] 2.4 `state-jump.ts` 的 `StateId` 与 `isValidStart` 同步覆盖新状态，
      既有遍历断言与负例保持绿

## 3. 断言运行器 —— 第 3 波（依赖 2）

- [x] 3.1 `scripts/assert.mjs`：读 `assertions.json`，格式不认识 / 文件不存在 →
      分别产出 `unavailable` / `absent`，**都不是失败，也都不是通过**
- [x] 3.2 7 个模板的判定实现，逐条照 design D5 那张表。
      🔴 `score_feedback` **判 HUD 文本不判 `score` 字段**
- [x] 3.3 每条断言前强制 `applyState` 建立起点（design D6）；
      测试：同一清单打乱顺序跑两遍，结果深相等
- [x] 3.4 前提不满足（trigger 缺失 / 状态落不进去 / `values` 缺键）走独立出口，
      `hint` 说明是前提不满足。**测试钉死它不被表述成产物缺陷**
- [x] 3.5 失败详情逐字对齐上游 `AssertionFailure`（`itemId`/`templateId`/`expected`/
      `actual`/`hint`）。`expected` 用上游 `describe(params)` 那句原文
- [x] 3.6 `loads_clean` 复用 BH-1 证据，不重新加载页面
- [x] 3.7 负例：给每个判定函数一份"该失败"的输入，断言它真的红

## 4. 并进 verify.mjs 与结果文件 —— 第 4 波（依赖 3）

- [x] 4.1 `verify.mjs` 在 BH-2 之后**用同一个 CDP 会话**接着跑 IA（design D7），
      一次性写结果文件；`assert.mjs` 保留可单独运行的入口
- [x] 4.2 `.verify-result.json` 增加 `assertions` 字段，🔴 **`schemaVersion` 保持 `1`**
      （proposal 的契约变更一节）
- [x] 4.3 退出码与结果文件的 `passed` **由同一个函数派生**（design D4/D8 修正版）：
      `judged` 有失败 → 退 1 且 `passed: false`；`unavailable` → 同样退 1 且 `passed: false`；
      **只有 `absent` 不影响两者**。IA 记进 `gates[]`（`absent` 不记）。
      **三种情况各有测试，外加一条遍历全组合钉死退出码与 `passed` 永不分歧的测试**
- [x] 4.4 `process.on('exit')` 兜底钩子仍然覆盖新增的所有退出路径——
      上一刀就是靠真跑失败路径才发现漏了一个出口，本刀照跑一遍
- [x] 4.5 模板自带样例 `assertions.json`，覆盖 7 个模板 id
- [x] 4.6 `AGENTS.md`：harness 的实现要求 + 🔴 trigger「只做玩家能造成的事」那条 prose 约束
      （design D3 已承认它守不住的部分靠人审，**不假装它是自动的**）
- [x] 4.7 `PROJECT_CONTEXT.md` / `README.md` 同步（模板文档与能力共演）

## 5. 验收

- [x] 5.1 干净安装后 `pnpm test` 全绿、`pnpm check-types` 退 0
- [x] 5.2 `pnpm verify` 在参考实现上：三级 BH 过 + 7 条断言全绿 + 退 0
- [x] 5.3 🔴 **真机证据**：把样例清单改坏一条，确认它变红且失败详情指得准；
      删掉 `assertions.json`，确认 `absent` 且仍退 0。**两条都要有实际输出贴进
      `fidelity-check` 或 PR 描述**——不许只凭读代码下结论

> ⚠️ **一条如实记下的边界：上面四种情形是在 macOS 上用 `CHROME_PATH` 指向本机
> Chrome 跑出来的，不是在 guest VM 上。** 证明的是判定逻辑正确，**不是**「它在
> guest 上跑得起来」。guest 那边多两个变量：`--disable-dev-shm-usage`
> （`fushenguang/tarit#34`，上一刀已带 flag）和 chromium 解析路径
> （`HOME=/` → `/.cache/ms-playwright`，上一刀已实测过）。
>
> **合并前必须在 guest 上真跑一次 `pnpm verify`**——上一刀的 BH 是在 guest 上验过的，
> 本刀的 IA 还没有。不补这一次就合并，等于把「在我机器上是绿的」当成验收。
