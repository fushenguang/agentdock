## ADDED Requirements

### Requirement: Architecture guard
平台 MUST 提供 `dependency-cruiser` 配置，机器可执行地校验分层边界，不依赖人眼 review。

MUST 覆盖以下规则：
- `no-core-mutation`：`src/core/**` 为只读层，其他层可引用但不得被 `src/features/**` 或 `src/infra/**` 修改（目录层面：不得有循环依赖回指 core）。
- `no-cross-feature-import`：`src/features/<A>/**` 禁止直接 import `src/features/<B>/**`（跨 feature 依赖）。
- `infra-approval-label`：`src/infra/**` 的新依赖关系应在 PR 中标注人工审批标签（arch-guard 以 warn 输出，不硬失败）。

#### Scenario: 跨 feature 依赖被拦截
- **WHEN** `src/features/auth/` 直接 import `src/features/billing/`
- **THEN** `dependency-cruiser` 报告 `no-cross-feature-import` 规则违反，arch 检查失败

#### Scenario: core 层不被反向依赖
- **WHEN** `src/core/repositories/user.ts` import 了 `src/features/auth/`
- **THEN** `dependency-cruiser` 报告循环/反向依赖违反

#### Scenario: infra 新依赖发出告警
- **WHEN** `src/infra/` 新增了一个对外部库的依赖
- **THEN** arch-guard 以 warn 输出，不阻断 CI

### Requirement: Secret lint
平台 MUST 提供 `secretlint` 配置，CI 中扫描全仓，发现真实密钥时硬失败。

#### Scenario: 真实密钥被拦截
- **WHEN** 任意文件含与 AWS/GCP/Supabase/GitHub token 格式匹配的字符串
- **THEN** secretlint 以非零退出码报告，CI 失败

#### Scenario: 占位值不触发
- **WHEN** 文件含 `YOUR_KEY_HERE`、`<your-token>` 等明确占位值
- **THEN** secretlint 不报告误报

### Requirement: Dependency health check
平台 SHALL 在 CI 中对新增依赖做基础健康度检查，低周下载量或已废弃包以告警输出（不硬失败，供人工确认）。

#### Scenario: 低下载量包触发告警
- **WHEN** 新增包的周均下载量低于可配阈值（默认 10,000/周）
- **THEN** 健康检查输出告警，但 CI 退出码为 0
