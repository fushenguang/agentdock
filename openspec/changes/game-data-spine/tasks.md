# tasks — game-data-spine

## 1. 数据层约定

- [x] 1.1 `game-data.json` 清单（`levels` 起步，参考关卡 1 的内容数据入内）+
  `src/game-data.ts` 加载器：normalize + 校验（空壳/缺字段抛可定位错误）+
  类型化访问接口 + consumption registry（D2）
- [x] 1.2 加载器单测：合法清单、空壳清单、缺字段、`null` 语义边界
  （无清单时 harness 侧判 `null`，加载器不硬造空集）

## 2. spine 改造

- [x] 2.1 `GameScene.ts`（及引用内容常量的场景）改为从数据接口构建关卡：
  逐关几何/数值出类，解释器设施（画布/HUD/物理全局/流转）留代码（D4 边界）
- [x] 2.2 「换数据即换关」用例：改 `game-data.json` 条目、场景代码不动，
  构建结果随数据变化（spec scenario 的测试化）

## 3. harness 证据与运行器

- [x] 3.1 `harness-types.ts` + `harness.ts`：`DataUsageSnapshot` 类型 +
  `getSnapshot().data` 三层证据（只读，no-setter 不破）
- [x] 3.2 `assert.mjs`：`TEMPLATE_DESCRIBERS`/`KNOWN_TEMPLATE_IDS` 加
  `data_from_files`（措辞逐字 = 上游 design D1）；judge 按 D3 映射
  （null/declared-only/loaded-unused 三缺口全失败、hint 指修法、
  MUST NOT preconditionResult）
- [x] 3.3 judge 单测：三缺口 × 顺序无关（打乱清单结论不变）× 全绿正例

## 4. 模板自食其果与规则

- [x] 4.1 根 `assertions.json` 样例加 `data_from_files` 条目；干净安装
  `pnpm verify` 8/8 全绿、退 0（自食其果闸）
- [x] 4.2 模板 `AGENTS.md` 加数据层规则（新关卡/规则/词条 = 改
  `game-data.json`；场景类不承载内容定义；措辞与判据同源）
- [x] 4.3 `PROJECT_CONTEXT.md`/README 等执行者可见文档同步数据层约定一段

## 5. 闸与发布

- [x] 5.1 本仓全量闸（lint/test/build 按仓内 `ci-gates` 约定跑）
- [ ] 5.2 worktree 内 push → PR（描述含两仓契约面：templateId/措辞/三层证据
  语义，指向上游 `data-layer-gate`）→ merge → changesets 发布
- [ ] 5.3 `npm view @cogito.ai/cli version` 确认新版已上 registry → 在上游
  change tasks 4.2 记录证据（顺序闸放行）
