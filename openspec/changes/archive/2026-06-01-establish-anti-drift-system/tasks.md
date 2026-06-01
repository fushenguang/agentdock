## 1. roadmap.yaml

- [x] 1.1 设计并创建根 `roadmap.yaml`，四桶（Now/Next/Later/Won't）结构
- [x] 1.2 填入 5 个 Now 锚点：`platform-foundation`(status=done)、`anti-drift-system`(in-progress)、`layer2-constraints`、`growth-trace-docs`、`web-nextjs-template`
- [x] 1.3 在 Later 加入 `web-nextjs-builtin-suite`（production 功能套，刻意延后）
- [x] 1.4 每条含 `id`/`title`/`status`/`owner`，确保 id 唯一

## 2. 对齐脚本 align:check

> 最小闭环优先（codex 建议）：先落地 1.1 + 2.1–2.3 + 2.7 + 4.2 验证方向，再补齐其余项。

- [x] 2.1 创建 `scripts/align-check`（TS），读取 roadmap.yaml 并解析 schema，缺字段/重复 id 报错
- [x] 2.2 实现不变量①孤儿 change（双读单写：frontmatter `roadmap-id` 优先，兼容正文 `Roadmap 锚点：<id>`）— 硬失败
- [x] 2.3 实现不变量⑤Non-goals 在场（proposal 必须含非空 Non-goals）— 硬失败
- [x] 2.4 实现不变量②孤儿 feature（显式元仓库标记 `.agentdock-meta` / package.json `agentdock.metaRepo` 时跳过）— 硬失败
- [x] 2.5 实现不变量③WIP 上限 与 ④僵尸 change— 告警。draft 从「非 archive + tasks.md 有未勾选项」推导，超期从 `.openspec.yaml.created` 起算（默认 30 天可配），不读任何 status 字段
- [x] 2.6 退出码分级：硬失败→非零，告警→0；输出清晰对齐报告
- [x] 2.7 在 `package.json` 注册 `align:check` 脚本
- [x] 2.8 为本元仓库添加显式元仓库标记（`.agentdock-meta` 或 package.json `agentdock.metaRepo: true`）

## 3. roadmap 修改权保护

- [x] 3.1 新增/更新 `.github/CODEOWNERS`，将 `roadmap.yaml` 指派给人工 owner
- [x] 3.2 接入 CI 规则：PR 修改 roadmap.yaml 时要求 owner 审批

## 4. change 模板强制字段

- [x] 4.1 选定 roadmap-id 承载格式：单写 proposal frontmatter `roadmap-id`；alignment-check 双读（兼容正文锚点）
- [x] 4.2 在 `openspec/config.yaml` 写 `rules.proposal`：必须引用 roadmap id（新建写 frontmatter）、必须含非空 Non-goals
- [x] 4.3 （过渡，可选）将现有 4 个待办 change 的 roadmap-id 补写到 frontmatter；即使不做，双读也保证 7.1 通过

## 5. 检查点接线

- [x] 5.1 pre-commit 接入秒级子集（孤儿 change + WIP）
- [x] 5.2 main CI 接入全量对齐报告（与 ③ 协调编排，③ 未到则放最小 workflow）

## 6. 四闸门工作流文档

- [x] 6.1 编写四闸门 builder workflow 文档（人/Opus/Sonnet/机器/codex 各步职责与产出）
- [x] 6.2 将文档入口链接到平台治理说明（README 或 AGENTS.md）

## 7. 验收

- [x] 7.1 对现有 4 个待办 change 跑 `pnpm align:check`，全部通过（均有 roadmap 锚点 + Non-goals；依赖双读兼容正文锚点）
- [x] 7.2 构造一个缺 Non-goals / 缺 roadmap id 的样例验证硬失败生效
- [x] 7.3 构造一个 draft 超期样例验证僵尸告警；验证 tasks 全勾选的 change 不被判僵尸
- [x] 7.4 `openspec validate establish-anti-drift-system` 通过
- [x] 7.5 自检：产出未触及 Non-goals（不变量6/强制hook/research-preview/Skills）
