## 1. 前置：发布内部工具包

- [ ] 1.1 移除 `packages/eslint-config/package.json` 中的 `private: true`，添加 `publishConfig: { "access": "public" }`，版本改为 `0.1.0`
- [ ] 1.2 移除 `packages/tsconfig/package.json` 中的 `private: true`，添加 `publishConfig: { "access": "public" }`，版本改为 `0.1.0`
- [ ] 1.3 安装 `@changesets/cli` 为 workspace 根 devDependency，初始化 `.changeset/config.json`（`access: "public"`，独立版本策略）
- [ ] 1.4 在根 `package.json` 添加 `changeset`、`changeset:version`、`changeset:publish` 脚本

## 2. generate-registry 任务

- [ ] 2.1 在 `templates/web-nextjs/package.json` 添加 `"agentdock": { "minCliVersion": "0.1.0" }` 字段
- [ ] 2.2 创建 `scripts/generate-registry/index.ts`：扫描 `templates/*/package.json`，解析 `workspace:*` 为 packages 目录中的实际版本，输出 `packages/cli/src/registry.json`
- [ ] 2.3 更新 `turbo.json`：添加 `generate-registry` 任务（含 `inputs`、`outputs`），并在 `build` 任务中添加 `generate-registry` 到 `dependsOn`
- [ ] 2.4 验证：在 clean 状态下执行 `pnpm build`，确认 `packages/cli/src/registry.json` 生成，`resolvedDependencies` 中无 `workspace:*`

## 3. 搭建 packages/cli 包骨架

- [ ] 3.1 创建 `packages/cli/package.json`：包名 `@agentdock/cli`，版本 `0.1.0`，`bin: { "agentdock": "./dist/index.js" }`，`engines: { node: ">=18" }`
- [ ] 3.2 创建 `packages/cli/tsconfig.json`（继承 `@agentdock/tsconfig/base.json`，`target: ES2022`，`module: ESNext`）
- [ ] 3.3 添加依赖：`citty`、`@clack/prompts`、`@modelcontextprotocol/sdk`、`giget`（预留）；devDependency：`bun`、`@types/node`
- [ ] 3.4 创建目录结构：`src/commands/`、`src/core/`、`src/adapters/human.ts`、`src/adapters/agent.ts`、`src/adapters/mcp/`、`bin/`
- [ ] 3.5 创建 `bin/agentdock.ts` 入口（TTY 检测，调用 Citty `runMain`）

## 4. core/ 纯函数层

- [ ] 4.1 实现 `src/core/registry.ts`：读取并解析 `registry.json`，导出 `getTemplates()`、`getTemplate(id)` 函数
- [ ] 4.2 实现 `src/core/version.ts`：`checkVersion(cliVersion, minCliVersion)` 函数，不兼容时抛出 `CLI_VERSION_OUTDATED` 错误
- [ ] 4.3 实现 `src/core/scaffold.ts`：`scaffoldProject(options)` 纯函数，执行文件复制、`package.json` 改写（name、version、移除 private、替换 resolvedDependencies）
- [ ] 4.4 为 `core/` 三个模块编写 Vitest 单元测试，覆盖版本兼容检查、workspace:* 替换、TARGET_DIR_EXISTS 错误

## 5. agentdock init 命令

- [ ] 5.1 实现 `src/adapters/human.ts`：Clack 交互流程（项目名输入、模板选择、包管理器选择、确认、spinner），调用 `core/scaffold`
- [ ] 5.2 实现 `src/adapters/agent.ts`：解析 `--name`、`--template`、`--pm`、`--silent`、`--json` 参数，调用 `core/scaffold`，输出 NDJSON 结果
- [ ] 5.3 实现 `src/commands/init.ts`：Citty 命令定义，TTY 检测路由到 `human.ts` 或 `agent.ts`
- [ ] 5.4 手动端到端验证：`pnpx agentdock init --name test-app --template web-nextjs --json`，检查生成目录结构与 `package.json` 内容

## 6. agentdock mcp 命令

- [ ] 6.1 实现 `src/adapters/mcp/tools.ts`：定义 `list_templates`、`scaffold_project`、`get_template_schema` 三个工具（调用 `core/`）
- [ ] 6.2 实现 `src/adapters/mcp/server.ts`：初始化 MCP Server，注册工具，连接 Stdio transport，处理 SIGINT 优雅退出
- [ ] 6.3 实现 `src/commands/mcp.ts`：Citty 命令定义，调用 `server.ts`
- [ ] 6.4 验证：使用 MCP Inspector 或手写 JSON-RPC 消息测试三个工具的输入输出格式

## 7. 构建与发布配置

- [ ] 7.1 在 `packages/cli/package.json` 添加 `build` 脚本（`bun build bin/agentdock.ts --outfile dist/index.js --target node`）和 `generate-registry` 脚本（`tsx ../../scripts/generate-registry/index.ts`）
- [ ] 7.2 将 `packages/cli/src/registry.json` 添加到 `.gitignore`（构建产物不纳入版本控制）
- [ ] 7.3 配置 `packages/cli/package.json` 的 `files` 字段，仅包含 `dist/`（排除 `src/`、测试文件）
- [ ] 7.4 执行 `pnpm check-types` 和 `pnpm build` 全量验证，确保 0 错误
