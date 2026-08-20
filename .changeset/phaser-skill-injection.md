---
'@cogito.ai/cli': minor
---

`game-web-phaser` 模板新增 `postinstall`（`scripts/install-phaser-skills.mjs`），把
`node_modules/phaser/skills/` 下的 28 个官方 Phaser 4 skill（连同 8 个带 `references/`
的 `REFERENCE.md`）复制进 `${HOME}/.config/shelley/`，让 Shelley 能看到并按需激活它们。

**背景**：这些 skill 随 Phaser 4 升级已经装进每个生成项目的 `node_modules`，但此前没有
任何通道把它们接到 Shelley 的 skill 目录——素材在磁盘上，执行者看不见、也不会自己去翻。

- 路径由 `${HOME}` 在运行时推导，不硬编码 `/root/.config` 或 `/.config`
  （VM guest 里 `HOME=/`，硬编码会静默失效）
- 守卫：`${HOME}/.config/shelley` 不存在时 no-op、退出 0——开发者本机不会被写入
- 复制整个 skill 目录（不只 `SKILL.md`），幂等可重复运行
- 零新依赖，只用 Node 内置 `fs`/`path`/`url`
