## 1. Registry and template metadata

- [x] 1.1 扩展 registry schema，支持 workspaceMember、engines 和 packageManagerVersion
- [x] 1.2 为 `web-tanstackstart` 声明 workspace-member opt-in 与 root allowBuilds 需求
- [x] 1.3 更新 generate-registry 并增加元数据一致性测试

## 2. Placement and compatibility

- [x] 2.1 实现最近 workspace 探测、packages glob 匹配与负 glob 排除
- [x] 2.2 实现 pnpm/Node 简单范围校验和写入前 fail-closed 错误
- [x] 2.3 实现 allowBuilds 差异与冲突计算，默认不写根配置

## 3. Workspace rendering and agent context

- [x] 3.1 为 scaffoldProject 增加 mode，并跳过 workspace-owned 文件
- [x] 3.2 在 workspace mode 清理 packageManager 与 engines.pnpm，保留 standalone 行为
- [x] 3.3 生成 `.agentdock/workspace.json` 并注入 AGENTS workspace 提示
- [x] 3.4 扩展 CLI adapters、JSON 结果与 human next steps

## 4. Tests and docs

- [x] 4.1 覆盖 standalone、workspace、negative glob、显式模式冲突和版本不兼容
- [x] 4.2 覆盖无嵌套文件、根 lockfile owner、Agent 上下文和 allowBuilds 冲突
- [x] 4.3 更新中英文 CLI 与 `web-tanstackstart` 文档
- [x] 4.4 添加 CLI changeset

## 5. Verification

- [x] 5.1 运行 packages/cli 测试、check-types 和 build
- [x] 5.2 运行平台验收命令与 openspec validate
- [x] 5.3 在 `domain-packages` 以 workspace mode 生成临时项目并验证文件边界与识别
