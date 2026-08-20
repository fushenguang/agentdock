---
roadmap-id: game-web-phaser-template
---

# phaser4-template-upgrade

> 构建者 2026-08-16 已拍板：**「如果 4.x 协议仍是开放的，那就把模板升级到 4.x，不再讨论了」**。
> 本刀只是把那个决定落地，**不重开讨论**。

## Why

决定下了四个月，代码里一个字没变——`templates/game-web-phaser/package.json` 仍是 `^3.90.0`。
这不是"文档待更新"，是**决定与代码的落差**，而且它正在持续产生两个后果：

1. **平台每一次 Run 都在告诉执行者用 Phaser 3。** 下游 cogito-lib 的 `PLATFORM_CONTEXT`
   第一条逐字写着「技术栈固定为 Phaser 3」，它是平台约束的单一来源，同喂投递消息、讨论 agent
   与 PRD agent。那条**现在是对的**（模板实装就是 3.90.0），正因如此它不能先改——顺序必须是
   模板先升。
2. **28 个官方 skill 拿不到。** 它们是 4.x 独有资产，3.x 有 **0 个**。

### 本刀开工前实测的四条事实（不是引用文档，是现查的）

| 事实 | 怎么查的 |
|---|---|
| 官方 registry 有 `phaser@4.2.1`，MIT，发布于 2026-07-09 | `npm view --registry=https://registry.npmjs.org` |
| 🔴 **`registry.npmmirror.com` 上没有 4.2.1（404）**，其 phaser 副本停在 2026-04-10、最高 4.0.0 | 同命令指向镜像；`time.modified` = `2026-04-10` |
| 主因是包体：4.2.1 解包 **112 MB / 3593 文件**，压缩后 **19.5 MB** | `dist.unpackedSize` / `dist.fileCount` / 实测下载 |
| **腾讯源 `mirrors.tencent.com/npm` 有 4.2.1 且最快**（19.5 MB @ **7.1 MB/s**，2.75s）；华为源 4.3 MB/s；官方 3.3 MB/s | 三个源各真下了一段 tarball，不是只看元数据 |

**28 个 skill 在 4.0.0 与 4.2.1 逐条相同**（各 28 个 `SKILL.md`，文件清单 `diff` 无差异）——
所以"能拿到 skill"这个收益不依赖 4.2.x，但既然腾讯源装得到，就没有理由主动放弃四个月的修复。

## What Changes

1. `templates/game-web-phaser/package.json`：`"phaser": "^3.90.0"` → `"^4.2.1"`，更新 lockfile
2. **新增 `templates/game-web-phaser/.npmrc`，写死 `registry=https://mirrors.tencent.com/npm/`**
   （构建期 CLI 会把它改名成 `_npmrc` 随包发布，脚手架时还原——机制已存在，见 `scaffold.ts`
   的 `restoreDotfiles` 与 `packages/cli` 的 build 脚本）
3. 跑构建与 `pnpm verify`，按报错逐条修模板代码
4. `packages/cli/src/registry.json` 经 `pnpm generate-registry` 同步：`resolvedDependencies.phaser`
   与那句 `"Phaser 3 + Vite + TypeScript starter…"` 的描述
5. 模板内文档里的 Phaser 3 字样（`AGENTS.md` / `README.md` / `PROJECT_CONTEXT.md`）逐处核对

## Non-goals

- ❌ **不接 28 个 skill 进 Shelley 的 skill 目录**。那是 PRD §4.1 的落地事项 c，涉及"注入发生在
  哪一层"（模板 postinstall？平台脚手架命令？CLI？）——是独立的一刀，且它的价值验证
  （模型会不会真去激活）本身就是另一个被降级的条目。**本刀只让 skill 变得可得，不负责投喂。**
- ❌ **不动 cogito-lib 的 `PLATFORM_CONTEXT`**（backlog 条目 0.5）。理由见 design D3——
  那条翻转有一个 PRD 没考虑到的副作用，需要单独设计。
- ❌ **不动其它两个模板**（`web-nextjs` / `skills-registry`）的 `.npmrc`。它们没有被这个问题挡住，
  顺手改会把一次可回滚的模板改动变成三个模板的连带改动。
- ❌ **不在 agentdock 仓库根加 `registry=`**。见 design D2：会覆盖 CI 的发布 registry。

## 判据（🔴 先于实现定死）

1. `pnpm install` 在**腾讯源**下成功装到 `phaser@4.2.1`，lockfile 锁的就是这个版本
2. `pnpm build` / `pnpm check-types` / `pnpm test` 全绿
3. `pnpm verify` **全绿**——含本仓库刚落地的三条新判据（触发器完整性 A、实体越界 B、失败路径
   不漏进程 C）。🔴 **verify 若红，只许修模板代码，不许放宽任何判据**——放宽判据来通过一次
   升级，正是 E-15 那一族病的做法
4. `node_modules/phaser/skills/` 下真的有 28 个 `SKILL.md`（读回确认，不是推断）
5. 生成项目侧：`registry.json` 的 `resolvedDependencies.phaser` 与模板 `package.json` 一致
