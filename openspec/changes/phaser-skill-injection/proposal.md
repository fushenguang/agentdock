---
roadmap-id: game-web-phaser-template
---

# phaser-skill-injection

## Capabilities

- `template-game-web-phaser-verification`（已存在，本刀**扩展**）—— 收纳「Phaser 官方 skill 注入
  Shelley」这条 requirement。

## Why

`vm-coding-agent-harness` 的 backlog 条目 6。三层实测状态：

| 层 | 现状（2026-08-20 实测） |
|---|---|
| **素材** | ✅ 到位——Phaser 4 升级后，**28 个官方 `SKILL.md`**（+ 8 个 `REFERENCE.md`，共 656K）随依赖装进每个生成项目的 `node_modules/phaser/skills/` |
| **通道** | ❌ **零注入**——VM 上 `/.config/shelley/` 里只有 `shelley.sock`，`shelley skill ls` 只有 **7 个内置** |
| **模型行为** | ❌ **不会自己找**——一次真实 Run 的 197 条消息里，`node_modules/phaser/skills` / `SKILL.md` / `physics-arcade` **各 0 次** |

**"harness 没搭"的准确含义**：不是缺资料，是**资料躺在磁盘上而执行者看不见、也不去找**。

通道本身 2026-08-16 哨兵实验已证通：注入后 `description` 进系统提示词，正文由模型执行
`<activate>shelley skill cat <name></activate>` 按需读。**所以这一刀是接线，不是研发。**

### 它同时回答一个悬了很久的问题

backlog 条目 0 问的是 **Q1：模型会不会真的去激活**。今天有了第一份**负面**证据——7 个内置
skill 的描述在提示词里（含与任务直接相关的 `node-and-js-frameworks`），**模型一次都没激活**。
接上 28 个 Phaser skill 之后，这个实验才有真实对象。

## What Changes

1. 模板新增 `postinstall`：把 `node_modules/phaser/skills/*` 复制进 `${HOME}/.config/shelley/`
   （层次与路径的裁决见 design D1/D2）。
2. 幂等、可重复运行；**不在非 Shelley 环境里动手**（守卫见 D2）。
3. 单测覆盖纯逻辑部分（路径推导、守卫判定），不依赖真实文件系统。

## Non-goals

- ❌ **不生产我们自己的 skill**，也不碰 hub 分发（护栏三：我们自己的 skill 走
  `fushenguang/thefool-skills`；本刀搬的是**上游 phaser 包自带**的，不入任何项目仓库）。
- ❌ **不做 E-17 方向**（机器闸判不了"是不是个游戏"）——构建者 2026-08-20 已裁定挂账。
- ❌ **不改起草侧**、不改既有驱动器的控制变量。
- ❌ **不做多片编排 / 逐任务投递**——那是另一条线。

## 判据（🔴 先于实现定死）

1. **注入真的发生**：新脚手架项目 `pnpm install` 之后，VM 上 `shelley skill ls` 读回
   **= 7 内置 + 28 Phaser**。🔴 **只认读回，不认脚本返回值**。
2. **注入层单一且可追溯**：只有一处实现，理由写进 design。
3. **非 Shelley 环境 no-op**：本机 `pnpm install` **不得**往开发者的 `~/.config/shelley` 写东西。
4. `pnpm test` / `pnpm check-types` / `pnpm build` 全绿。
