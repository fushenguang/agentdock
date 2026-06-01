## 1. Monorepo 拓扑

- [x] 1.1 在仓库根建立 `pnpm-workspace.yaml`，纳入 `templates/*`、`packages/*`、`apps/*`
- [x] 1.2 编写/校正根 `turbo.json`，定义 `build`/`dev`/`lint`/`check-types`/`format` 任务管线
- [x] 1.3 提供根 `tsconfig`（strict 基线指向）与 `prettier` 配置
- [x] 1.4 校正根 `package.json` 脚本（`build`/`dev`/`lint`/`format`/`check-types` 经由 turbo），更新 `name` 去除 `-shadow` 占位
- [x] 1.5 校验 `.gitignore` 覆盖 `.env*`、本地凭据、构建产物

## 2. apps/docs 平台文档站归属

- [x] 2.1 将既有 docs 骨架确认/规整到 `apps/docs` 定位（平台文档站，非模板内 docs）
- [x] 2.2 对 `apps/docs` 跑一次 build，确认规整后仍可构建

## 3. 开源就绪物料

- [x] 3.1 添加 `LICENSE`（选型待人确认，未定则放占位并标注）
- [x] 3.2 编写 `README`：AgentDock 是什么 / 不是什么（Non-goals 思维）/ 如何用
- [x] 3.3 编写 `CONTRIBUTING`，含 conventional commits 规范与基本流程
- [x] 3.4 运行 secret 扫描确认全仓零真实密钥；示例仅用占位值

## 4. 平台自治理基线

- [x] 4.1 编写 `.github/copilot-instructions.md`（清单化：目录契约、硬规则要点、Copilot-only）
- [x] 4.2 编写 `AGENTS.md`（Copilot CLI 执行边界：允许自主 / 必须确认 / 禁止）
- [x] 4.3 填写 `openspec/config.yaml` 的 `context`（技术栈 / SSOT=OpenSpec / 文档=apps/docs / 元仓库自我豁免）
- [x] 4.4 在治理说明中显式声明元仓库自我豁免边界

## 5. 验收

- [x] 5.1 `pnpm install` 成功，workspace 成员被正确识别
- [x] 5.2 `pnpm build`、`pnpm check-types`、`pnpm format` 全部通过
- [x] 5.3 `openspec validate bootstrap-platform-skeleton` 通过
- [x] 5.4 自检：本 change 的产出未触及 Non-goals 列出的范围（模板/Layer2/roadmap/CLI 等）
