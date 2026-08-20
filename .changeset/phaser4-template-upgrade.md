---
'@cogito.ai/cli': minor
---

`game-web-phaser` 模板：`phaser` 依赖从 `^3.90.0` 升到 `^4.2.1`。

🔴 **破坏性提示：从本版本起，新脚手架出来的 `game-web-phaser` 项目默认是 Phaser 4，
不再是 Phaser 3。** 已经生成的存量项目不受影响——它们的 `package.json` 已经锁定了自己的
版本，不会因为模板升级而改变依赖。

起因：这个决定四个月前已经拍板（"如果 4.x 协议仍是开放的，那就把模板升级到 4.x"），但代码
一直没跟上——本次落地，不重开讨论。

改了什么：

- `templates/game-web-phaser/package.json`：`phaser` 依赖版本升级，lockfile 同步锁定 `4.2.1`
- 新增 `templates/game-web-phaser/.npmrc`，固定指向 `mirrors.tencent.com/npm`——本机默认源
  `registry.npmmirror.com` 上的 `phaser@4.2.1` 直接 404（该源的 phaser 副本停在 2026-04-10、
  最高只到 4.0.0），腾讯源实测有货且最快。只有这一个模板写这一行，其余两个模板未受这个问题
  阻塞，未改动
- 复核了官方 Migration Guide 里最容易踩的三处（纹理坐标原点翻转、`Math.TAU` 语义改变、
  Pipeline→RenderNode / `setTintFill()` 移除）——模板实际用到的 API 面很窄，`grep` 确认
  零命中，`pnpm verify`（BH-0/1/2 + 7/7 IA 断言）全绿，未改动任何判据
- `node_modules/phaser/skills/` 下的 28 个官方 `SKILL.md` 随依赖到位（本刀只让它们变得
  可得，不负责接入 Shelley 的 skill 目录——那是另一刀的范围）
- 模板文档（`AGENTS.md` / `README.md`）里的 "Phaser 3" 字样同步更新为 "Phaser 4"

不在本次范围内（各有独立理由，见
`openspec/changes/phaser4-template-upgrade/design.md`）：

- cogito-lib 的 `PLATFORM_CONTEXT`（它是喂给每一次 Run 的全局常量，翻转会让存量 Phaser 3
  项目被错误地告知按 Phaser 4 写——需要单独设计，已记入 backlog）
- 把 28 个 skill 接进 Shelley 的 skill 目录
- 其它两个模板（`web-nextjs` / `skills-registry`）
