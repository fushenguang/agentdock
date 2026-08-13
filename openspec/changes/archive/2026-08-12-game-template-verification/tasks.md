# Tasks · game-template-verification

> 四波。**Gate ② 已批准范围与非目标**（proposal），实现严格在那个范围内。
>
> 🔴 三条纪律：
>
> 1. **不许自行扩大范围**。Non-goals 表里那三条（`onlyBuiltDependencies` / lint / CI paths）
>    是构建者明确切出去的，**顺手做了也是越界**。
> 2. **闸门不许能被静默跳过**：找不到浏览器、Node 太老、判定跑不了 —— 一律**报错退出**，
>    不许打印一句"跳过"然后退 0。
> 3. **每个判定函数都要有负例**。只测正例的话，`return true` 也全绿。

## 1. `verify.mjs` 的骨架与浏览器解析 —— 第 1 波

- [x] 1.1 `templates/game-web-phaser/scripts/verify.mjs`：浏览器解析链（design D1 五级），
      找不到时打印**找过的每一条路径**并退出非 0
- [x] 1.2 Node 版本自检：`typeof WebSocket !== 'function'` → 报错退出，说明需要 Node ≥22。
      **不静默跳过 BH-1**
- [x] 1.3 `package.json`：`engines.node` `>=18` → `>=22`（proposal 里已显式请示并获批），
      新增 `verify` 脚本
- [x] 1.4 两个 flag 必须带上，且**注释写明 `--disable-dev-shm-usage` 是绕 guest 镜像缺陷
      （`fushenguang/tarit#34`），镜像修好后可以去掉**——否则将来没人敢删它

## 2. 三级判据 —— 第 2 波（依赖 1）

- [x] 2.1 BH-0：spawn 构建命令，断言退出码 0
- [x] 2.2 起本地静态服务（Node 内置 `http`，零依赖），服务 `dist-play/`
- [x] 2.3 BH-1：CDP over 内置 `WebSocket`。🔴 **`Runtime.enable`/`Log.enable`/`Network.enable`
      必须在导航之前开**，否则页面早期抛的异常收不到；收
      `Runtime.exceptionThrown` + `Network.loadingFailed`，两者皆空才算过
- [x] 2.4 BH-2：`Page.captureScreenshot` + `Runtime.evaluate` 取 canvas
      `clientWidth`/`clientHeight` > 0
- [x] 2.5 🔴 截图非空判定：解 PNG（`zlib.inflateSync`，零依赖）→ 算唯一颜色数 + 像素方差，
      两者过下限才算非空
- [x] 2.6 🔴 **负例测试**：造一张纯色 PNG 喂进判定函数，断言被判为**空**。
      再造一张有内容的，断言被判为非空
- [x] 2.7 失败信息必须可读：哪一级、期望什么、实测什么

## 3. 状态跳转契约 + 双端口 —— 第 3 波（与 2 并行，文件不重叠）

- [x] 3.1 `src/debug/state-jump.ts`：`StateId` / `listStates` / `jump` / `isValidStart`
      （design D5 的形状），外加 Boot/Preload/Game 三态的**最小参考实现**
- [x] 3.2 `tests/state-jump.test.mjs` 遍历断言：对每个 id，`jump` 后 `isValidStart` 为真，
      且同种子两次 `jump` 深相等。🔴 **合法与可复现是两条独立断言，不许合成一条**
- [x] 3.3 🔴 **负例**：故意造一个返回半吊子状态的 `jump`，断言 `isValidStart` 判它为假
      ——否则 `isValidStart` 写成 `return true` 也全绿
- [x] 3.4 `vite.config.ts` + `package.json`：`build:play`（→ `dist-play/`，服务 8080）与
      `build:learn`（→ `dist-learn/`，另一端口）。
      ⚠️ **8080 与 `strictPort` 是上游冻结契约，`build:play` 不许改**
- [x] 3.5 面板是否编入产物由**构建目标**决定（design D6），
      🔴 **不许用运行时开关**——客户端开关谁都能改
- [x] 3.6 `AGENTS.md`：验收清单里能机器判定的那部分换成 `pnpm verify` 退出 0；
      **真正需要人眼的那两项留着**，不假装机器能判「好不好玩」

## 4. 收尾 —— 第 4 波

- [x] 4.1 `pnpm build`（仓库级，本仓库允许）——确认 `registry.json` 重新生成后
      **仍然含 `game-web-phaser` 条目**，且 `resolvedDependencies` 没有残留 `workspace:*`
- [x] 4.2 新增 changeset（本仓库用 Changesets；patch 还是 minor 自己判断并说明理由）
- [x] 4.3 delta spec + `openspec validate game-template-verification` 退 0
- [x] 4.4 本仓库的验收标准（`AGENTS.md`）：`pnpm install` · `pnpm check-types` ·
      `pnpm build` · `pnpm format`（跑完无 diff）· `openspec validate` · 无 secrets
- [x] 4.5 🔴 **在 guest 上真跑一次**：`npm pack` 出 tarball → 经 `/v1/execute` 传进 VM →
      `npx ./xxx.tgz init` 生成项目 → `pnpm i && pnpm verify` 看三级判据真的跑过。
      **这一步是本刀唯一的真机证据**，不做等于只验了本地
- [x] 4.6 ❌ **不许 `npm publish`、不许 `git push`**——两者都要构建者显式授权。核对：
      本刀合并走的是正常 PR 流程（PR #20，`git log`/`gh pr list` 可查），过程中未见
      直接 `npm publish` 或未授权 `git push` 记录；本次收尾（2026-08-12）同样未执行
      这两者。视为满足（本条是纪律约束而非产出物，收尾时确认从未违反即可打勾）。
