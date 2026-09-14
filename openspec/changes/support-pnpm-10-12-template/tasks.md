## 1. Template compatibility

- [x] 1.1 移除 `packageManager` pin，声明 engines.pnpm >=10.34.5 <13
- [x] 1.2 将 engine/install 策略移入 pnpm-workspace.yaml 并移除模板 .npmrc
- [x] 1.3 使用 pnpm 10.34.5 重新生成单 document lockfile
- [x] 1.4 更新模板配置测试与 Agent 文档

## 2. CLI registry

- [x] 2.1 增加显式 packageManagerEnforced 元数据并保持 web-tanstackstart 为 pnpm-only
- [x] 2.2 更新 registry 生成器和 init 测试以覆盖无 packageManager pin
- [x] 2.3 更新 CLI human/agent 文档中的版本兼容说明

## 3. CI and docs

- [x] 3.1 将 web-tanstackstart workflow 改为 pnpm 10/11/12 矩阵
- [x] 3.2 更新中英文模板文档，明确最低、推荐、强制版本边界
- [x] 3.3 添加 CLI changeset

## 4. Verification

- [x] 4.1 用 pnpm 10.34.5、11.27.0、12.4.1 分别执行 frozen install 和完整模板 check
- [x] 4.2 重新验证 workspace-member mode 在 pnpm 10/12 根 workspace 下兼容
- [x] 4.3 运行 CLI tests、平台 check-types/build/lint/format、secret scan 和 openspec validate
