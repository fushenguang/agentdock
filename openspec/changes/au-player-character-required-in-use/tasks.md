# Tasks — AU 门保留字 `player` 零宽容

## 1. 判定规则（`scripts/lib/asset-usage.mjs`）

- [x] 1.1 新增镜像常量 `PLAYER_KEY = 'player'`（头注释写明镜像
      `src/game-assets.ts` 的 `PLAYER_CHARACTER_KEY`、不导入的理由与
      `classifyAssetKey()` 头注释同款）
- [x] 1.2 character 桶拆分：保留字角色 declared ⇒ 必须 used（否则
      `failures.push` 点名 player，措辞写明「声明保留字 = 这个角色就是玩家，
      加载了不等于穿上了」）；非保留字配角维持「至少一个在用 + 未用点名」；
      player 在用时单独 `notes.push` 点名，不混进配角分数
- [x] 1.3 全未用且含 player 时两条规则都命中——failure 文案去重：保留字
      失败已覆盖「0 个在用」的信息时，配角的 0/N 失败不重复报（或反之，取
      更可行动的一条），不许输出自相矛盾的双份失败

## 2. 测试（`tests/asset-usage.test.mjs`）

- [x] 2.1 REGRESSION：trial-08 字面形状（declared player/companion/
      antagonist、loaded 全、usedInScene=[companion]）⇒ `passed: false`、
      reason 含 player——注释里写明真实事故出处（trial-08 §8.5/§8.8 原始现场）
- [x] 2.2 同形状 + player 在用 ⇒ `passed: true`、reason 含
      `player character (player) in use`、unused 配角照旧点名
- [x] 2.3 行为不变守卫：无保留字 key 时配角判定与旧规则逐字一致
- [x] 2.4 drift 测试：`PLAYER_KEY` 镜像 === 真实
      `PLAYER_CHARACTER_KEY`（从 `../src/game-assets.ts` import）
- [x] 2.5 MUTATION GUARD：手算旧判据（无保留字特判）在同一输入上会判
      PASS——断言新旧判据必须不一致（判别力钉死，与 46536f9 的
      mutation guard 同款）

## 3. 文档同步（同 46536f9 的 co-evolution 清单）

- [x] 3.1 `README.md` character 规则条目补保留字硬规则
- [x] 3.2 `AGENTS.md` 规则 8 补保留字零宽容 + trial-08 事故一句
- [x] 3.3 `skills/game-flow-and-hud/SKILL.md` fallback 段（「No character
      keyed `player` → 程序化占位」处）补一句：**声明了** `player` 却不挂会被
      AU 门判失败——fallback 只对「没声明」合法

## 4. 闸门与收尾

- [x] 4.1 模板级 `node --test` 全绿（含既有 20 个 AU 用例零回归）
- [x] 4.2 仓库级 `pnpm format` 无 diff、`pnpm check-types`、`pnpm lint`、
      `openspec validate au-player-character-required-in-use` 全绿

      > 实读：check-types 4/4 绿、lint 绿、validate 绿；`pnpm format` 对
      > main 上既有 ~140 个未格式化文件（.claude/.github/packages/minimax 等，
      > 均不在本刀范围）会产生 diff——46536f9 先例同样只动自己的文件、不做
      > 全仓重排版。本刀 3 个 .md 保持 main 逐字风格只换一行（diff 各 ±1 行），
      > 2 个 .mjs 不在 format glob 内。全仓格式债不入本刀。
- [x] 4.3 `.changeset/` 写 `@cogito.ai/cli` patch（中文取证体，含
      trial-08 原始现场与变异验证读数，对齐 `au-gate-per-category.md` 先例）
- [ ] 4.4 开 PR 合并（cogito-lib 侧的 slug 对齐 change 由姊妹仓另开）
