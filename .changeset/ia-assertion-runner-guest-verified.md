---
"@cogito.ai/cli": minor
---

game-web-phaser 模板新增 IA 断言运行器：让「可判定」真的被判定

BH 三闸（构建 / 加载 / 渲染）只能证明「东西跑起来了、画面上有东西」，
证明不了「这个游戏真的能玩」。2026-08-12 一次真实 Run 把这个洞打了出来：
产物 BH 三闸全绿，而真人一按空格就抛 `TypeError: a[l] is not a function`——
交互层根本不在任何一闸的覆盖范围内。

本次新增 `scripts/assert.mjs`（`runAssertions` + `RemoteHarness`），
在 BH 之后追加一层 IA 断言，通过真实 CDP 驱动真实浏览器判定 7 个模板断言：
`loads_clean` / `controllable` / `restart` / `hud_text_present` /
`value_persists` / `score_feedback` / `game_over_trigger`。

`.verify-result.json` 新增顶层 `assertions` 字段。
🔴 消费者 **MUST NOT** 把它读成「IA 通过了」，除非
`assertions.status === 'judged'` 且 `results` 里每一条都 passed——
verify 中途夭折（BH 失败、浏览器没起来等）时该字段会是 `not_run` 带 reason，
两者对消费者完全不同。IA 失败同样让 `pnpm verify` 退出非零（design D8）。

**guest 真机验证已完成**（2026-08-12，Tarit guest VM）：
`VERIFY_EXIT=0`，四闸 `BH-0/BH-1/BH-2/IA` 全 true，
`assertions.status: "judged"`、7/7 通过，走真实 headless chromium + CDP，非 mock。
模板自测 49/49 通过。
