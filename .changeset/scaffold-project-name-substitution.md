---
'@cogito.ai/cli': patch
---

`init` 脚手架出来的项目里，`{{PROJECT_NAME}}` 直接原样出现在玩家能看到的地方——
`game-web-phaser` 开始页标题、浏览器标签页、以及三个模板的 `README.md`——因为
`init` 一直只是把模板拷贝过去，从没拿 `--name` 替换过这个占位符。

- `scaffoldProject`（`packages/cli/src/core/scaffold.ts`）在拷贝模板、改写
  `package.json` 之后，新增一步 `replaceProjectNamePlaceholder`：把目标目录里
  所有文本文件中的 `{{PROJECT_NAME}}`（单一来源常量 `PROJECT_NAME_PLACEHOLDER`）
  替换成 `--name` 的值
- **白名单而非黑名单**：只处理 `.ts/.tsx/.js/.jsx/.mjs/.cjs/.json/.html/.md/
  .mdx/.css/.yml/.yaml/.txt`，其余一律跳过——模板里未来可能带 `.mp3`/`.png`
  等二进制资产，按字节做字符串替换会直接损坏它们
- 跳过 `node_modules`、`.git`、`dist` 三个目录，不管出现在树的哪一层
- `--name` 的值会原样落进 HTML `<title>` 文本节点与 TS/JS 字符串字面量。两条
  路线里选了**校验而非转义**：新增 `validateProjectName`，在动文件系统之前
  拒绝含 `< > & " ' \`` \\` 或控制字符的名字（`scaffoldProject` 新增
  `INVALID_NAME` 错误分支）。选校验不选转义的原因写在代码注释里——转义要按
  每个文件的语法上下文分别处理（HTML 用实体编码、TS 字符串用 JS 转义……），
  漏一个新文件/新上下文就静默出错；校验只有一处，两个适配器（agent/human）
  都会经过同一个 `scaffoldProject` 入口
- Unicode/中文名字（如「金鹅小镇」）不受影响，只挡语法层面会破字符串/标签的字符

新增 `packages/cli/src/core/__tests__/scaffoldPlaceholder.test.ts`：文本文件被
替换、伪造的二进制 `.png`（含占位符字节）逐字节不变、`node_modules`/`.git`/
`dist` 不被进入、不安全字符名被 `scaffoldProject` 在建目录前就拒绝。
