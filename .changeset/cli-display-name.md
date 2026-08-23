---
'@cogito.ai/cli': patch
---

`init` 新增可选 `--display-name`，修一个今天真机看到的缺陷：`--name` 一个值
被同时当成两件事用——**npm 包名**（`rewritePackageJson` 写进 `package.json`
的 `name`，必须是 ASCII/slug）与 `{{PROJECT_NAME}}` 的**替换值**（写进生成
的 `<title>`、`StartScene.ts` 等游戏展示文本，理应能是中文）。

cogito-lib 那边脚手架中文项目名（如「星星收集」）时，先用
`slugifyProjectName` 把名字变成合法 npm 包名——非 ASCII 全部被剥掉，空串再
回落成 `project`——然后把这个已经面目全非的 slug 当 `--name` 传给
`init --name project`。`replaceProjectNamePlaceholder` 今天刚学会把
`{{PROJECT_NAME}}` 替换掉，于是游戏标题变成字面意义上的 `<title>project</title>`。
修复前占位符根本没被替换，这个问题一直被那个更早的缺陷掩盖着。

**这一刀只解耦 `name` 的两个用途，不改任何既有行为**：

- `scaffoldProject()`（`packages/cli/src/core/scaffold.ts`）的
  `ScaffoldOptions` 新增可选 `displayName?: string`。提供时，
  `replaceProjectNamePlaceholder(targetDir, displayName ?? name)` 改用它
  做 `{{PROJECT_NAME}}` 替换；不提供时 `?? name` 精确落回今天的行为，
  逐字节 golden。
- `package.json` 的 `name` **永远只用 `name`**——`rewritePackageJson()` 的
  调用点完全没动，`displayName` 从不流向那条路径，npm 包名规则不受影响。
- `displayName` 落地的上下文（HTML `<title>`、TS 字符串字面量）与 `name`
  完全相同，所以复用同一套 `validateProjectName()` 字符集校验（拒绝
  尖括号/`&`/引号/反引号/反斜杠与控制字符），中文/非 ASCII 正常通过——这套校验
  本来就已经在 `validateProjectName` 的测试里验过对中文放行
  （`validateProjectName('金鹅小镇')`）。
- `init` 命令新增 `--display-name` 参数（agent 模式，`runAgentAdapter` 透传
  给 `scaffoldProject`）；交互式 `human` 适配器不受影响（它的
  `projectName` 提示本身就已限定 ASCII slug 字符集，没有这个二义性）。

**判据**：`scaffoldPlaceholder.test.ts` 新增 4 条——省略 `displayName` 的
golden（回落到 `name`，逐字节比对）、提供中文 `displayName` 的端到端（同时
断言 `package.json.name` 仍是 ASCII slug、`<title>` 是中文、零
`{{PROJECT_NAME}}` 残留）、非法字符 `displayName` 被 `INVALID_NAME` 拒绝、
以及原有 `game-web-phaser` 端到端不变。变异验证：手动把
`replaceProjectNamePlaceholder(targetDir, displayName ?? name)` 改回
`replaceProjectNamePlaceholder(targetDir, name)`，新增的中文 `displayName`
用例立即变红，随后已还原并重新确认全绿。

真机复现：`node dist/index.js init --json --name star --display-name "星星收集"
--template game-web-phaser --dir <tmp>` 后，`grep -rn '{{PROJECT_NAME}}'` 零
命中，`index.html` 的 `<title>` 是「星星收集」，`package.json` 的 `name` 仍是
`star`。

`pnpm --filter @cogito.ai/cli check-types`：0 错误。`pnpm --filter @cogito.ai/cli
test`：148→152 passed，除一个与本改动完全无关的既有超时用例（`scaffolds
web-nextjs: rewrites root package.json`，`git stash` 核实在改动前的 `main`
上同样超时）外全绿。`eslint` 对四个改动文件单独跑：0 错误。
