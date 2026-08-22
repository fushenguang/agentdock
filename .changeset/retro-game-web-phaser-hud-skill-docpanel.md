---
'@cogito.ai/cli': minor
---

`game-web-phaser` 模板补发三项此前已合入 `main` 但从未发布的能力（PR #70/#71/#72，
`.changeset/` 当时全部漏加，`npm pack @cogito.ai/cli@0.17.0` 实测解包后 `game-doc` /
`doc-panel` / `UiScene` / `game-flow-and-hud` 零命中——脚手架出来的项目此前一直拿不到
这三刀）：

- **HUD 带 + 独立 UI Scene**：`dimensions.ts` 新增 `HUD_BAND_HEIGHT` /
  `PLAYFIELD_HEIGHT` 常量，把「世界几何必须落在可玩区、HUD 必须落在 HUD 带」这条约束
  前移到骨架层；新增并行的 `UiScene`（`registry.events` 事件驱动更新 + `SHUTDOWN`
  时解绑监听器，不再每帧轮询），修复此前 HUD 元素与游戏世界元素几何重叠的问题
- **平台自带 `game-flow-and-hud` skill**：随 Phaser 官方 28 个 skill 一起，由
  `postinstall`（`scripts/install-phaser-skills.mjs`，现支持两个 skill 来源）注入
  Shelley 的 skill 目录，供执行者按需激活
- **游戏内文档面板**：HUD 带内新增「?」悬浮入口，点开展示 `public/game-doc.json`
  描述的游戏背景/玩法/当前关卡/未做事项，供人工试玩时对照设计意图判断——`game-doc.json`
  不存在时入口不显示，不会露出空面板

不在本次范围：不动 `web-nextjs` / `skills-registry` 两个模板；`PLATFORM_CONTEXT` 常量
未翻转（各模板独立演进）。
