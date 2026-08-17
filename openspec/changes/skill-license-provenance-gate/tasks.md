# tasks · skill-license-provenance-gate

## 1 · 门本体

- [ ] 1.1 `scripts/gates/license-provenance.mjs`——纯 Node ESM，零构建步骤，
      与既有三道门同形（同样的输出风格：`gate ④ (license-provenance): ...`）。
- [ ] 1.2 证据收集三类：目录内 `LICENSE*`/`NOTICE*`、frontmatter `license`、
      正文版权声明形状（正则，放配置里）。
- [ ] 1.3 `license-policy.json`：仓库自身许可 + 允许转发的第三方许可白名单 +
      已登记的转发 skill 列表 + 版权声明的正则。**数据不是代码**，默认白名单
      **不含**专有许可。
- [ ] 1.4 接进 `package.json` 的 `gates` script 与模板的 `.github/workflows/gates.yml`。
- [ ] 1.5 docs：`gates.mdx` 增加门④ 一节，写清它回答的是哪个问题、
      以及**为什么门③ 不覆盖它**（第三方版权与宿主身份正交）。

## 2 · 反向对照（不可省，每条都要贴实际输出）

- [ ] 2.1 造一个含「保留所有权利」许可文件的 skill → 门④ **必须失败**并指出文件；移除后通过。
- [ ] 2.2 登记一个「第三方转发」skill 但**不放**原许可文件 → **必须失败**；放上后通过。
- [ ] 2.3 纯自有 skill → **必须通过**，且输出里列出它被判为自有。
- [ ] 2.4 **用真实数据复现本刀的起因**：把当初那 8 个"门③ 干净"的 skill 喂进门④，
      必须准确挑出 5 个有第三方许可的（2 专有 + 3 宽松），放行 3 个自有的。
      这是本门存在的理由，必须真跑一次。

## 3 · 门必须被真跑过

- [ ] 3.1 `.github/workflows/skills-registry-gates.yml` 把门④ 纳入
      「走使用者真实路径」的那一段（`pnpm run gates` 已包含即可，确认它真的跑了）。
- [ ] 3.2 `agentdock init` 端到端：脚手架产物里四道门全绿。

## 4 · 四道门（AGENTS.md 验收条件）

- [ ] 4.1 `pnpm install` / `check-types` / `build` exit 0
- [ ] 4.2 `openspec validate skill-license-provenance-gate` exit 0
- [ ] 4.3 `align:check` / `secrets:check` / `arch:check` 全绿
- [ ] 4.4 `prettier --check` 对本刀触碰的文件全绿（⚠️ 不得顺手格式化既有不合格文件）
- [ ] 4.5 ★ `secrets:check` 特别注意：本刀会写版权声明的**正则**与示例，
      与门③ 那次同款风险——**用正则，不写长得像真货的字面量**。

## 5 · 收口

- [ ] 5.1 补 changeset（模板集变更需发版才能被 `init` 用到）。
- [ ] 5.2 回写 thefoolai PRD `skill-commerce-loop.mdx`：门④ 已交付，
      并把「三道门缺许可维度」这条从"缺口"改为"已补"。
