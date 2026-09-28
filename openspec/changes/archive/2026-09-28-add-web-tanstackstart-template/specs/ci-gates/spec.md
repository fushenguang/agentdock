## ADDED Requirements

### Requirement: web-tanstackstart template gate

CI MUST 为 `templates/web-tanstackstart` 提供独立门禁。门禁 MUST 使用 Node 24、pnpm 12，并执行 frozen-lockfile 安装、格式检查、Oxlint、TypeScript 7 类型检查、Vitest 和生产构建。路径过滤 MUST 覆盖模板、CLI scaffold/registry 变更以及该 workflow 自身。

#### Scenario: 模板变更触发完整门禁

- **WHEN** PR 修改 `templates/web-tanstackstart/**`
- **THEN** workflow 运行 `pnpm install --frozen-lockfile`、`pnpm format:check`、`pnpm lint`、`pnpm check-types`、`pnpm test` 和 `pnpm build`

#### Scenario: CLI 模板感知变更触发门禁

- **WHEN** PR 修改 CLI registry 或 scaffold 逻辑
- **THEN** web-tanstackstart 门禁同样运行，防止模板注册和生成行为漂移
