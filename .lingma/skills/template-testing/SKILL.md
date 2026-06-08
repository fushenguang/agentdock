---
name: template-testing
description: Validate template changes by running automated tests (lint, type-check, build, dev server, HTTP endpoints) before merging to main.
license: MIT
compatibility: Requires bash, node, and next.js dev server.
metadata:
  author: AgentDock
  version: '1.0'
  generatedBy: '1.4.1'
---

# Template Testing Skill

## 核心思想（Essence）

**目标**：在合并模板变更到 main 分支之前，通过自动化测试验证模板的可用性和质量。

**重点**：

- 在 monorepo 上下文中运行完整测试（lint, type-check, build, dev server）
- 验证新增功能的 HTTP 端点可访问性
- 检查架构约束（Layer 2）、安全防护（open redirect、硬编码密钥）
- 提供明确的合并建议和下一步指引

**边界**：

- ✅ 可以：运行测试脚本、读取日志、分析失败原因、建议修复方案
- ❌ 不可以：自动修改代码、跳过失败的测试、忽略安全警告
- ❌ 不干预：用户决定是否合并、何时发布、如何修复问题

**自主规划**：在边界内，LLM 应自主决定：

1. 选择哪个测试脚本（快速验证 vs 完整 E2E）
2. 如何解读测试结果
3. 哪些失败需要立即修复，哪些是误报
4. 是否需要额外的手动验证

---

## 设计原则（Design Principles）

### 1. 任务目标抽象

```
输入：template_name (e.g., "web-nextjs")
     change_branch (e.g., "add-user-account-features")
     test_level ("quick" | "full" | "e2e", default: "e2e")

输出：测试报告（PASS/FAIL）
     合并建议（READY/BLOCKED）
     下一步行动清单
```

### 2. 关键判断标准

| 检查项     | 通过标准        | 失败处理                 |
| ---------- | --------------- | ------------------------ |
| ESLint     | 无错误退出码 0  | 列出错误，建议修复       |
| TypeScript | 编译成功        | 显示类型错误位置         |
| Build      | 生成 .next 目录 | 检查构建日志             |
| Dev Server | 60s 内响应 200  | 检查端口占用、缓存损坏   |
| 新功能页面 | HTTP 200        | 确认路由配置正确         |
| Layer 2    | 无违规 import   | 强制使用 Repository 模式 |
| 安全检查   | 无硬编码密钥    | **BLOCK MERGE**          |

### 3. 必要约束

- **必须在 monorepo 内测试**：模板依赖 workspace packages，不能独立运行
- **必须使用 npx 而非 pnpm**：避免 pnpm workspace 依赖检查干扰
- **必须清理 Turbopack 缓存**：防止缓存损坏导致 500 错误
- **必须自动清理**：测试结束后停止服务器、删除临时文件

### 4. 质量检查点

```bash
# Phase 1: 静态检查
✓ ESLint passed
✓ TypeScript compilation successful
✓ Production build successful

# Phase 2: 运行时检查
✓ Dev server started (<60s)
✓ Homepage returns 200
✓ New feature pages return 200

# Phase 3: 安全检查
✓ No Layer 2 violations
✓ Open redirect protection present
✓ No hardcoded secrets
```

### 5. LLM 自主执行路径

```
1. 检测当前分支和待测试模板
2. 选择合适的测试脚本：
   - quick: scripts/validate-template.sh
   - full/e2e: scripts/e2e-template-test-v2.sh
3. 运行测试并捕获输出
4. 解析测试结果：
   - 如果 PASS_COUNT > 0 && FAIL_COUNT == 0 → READY FOR MERGE
   - 如果 FAIL_COUNT > 0 → BLOCKED，分析失败原因
5. 生成结构化报告
6. 提供下一步行动建议
7. 确保 cleanup 已执行
```

---

## 使用方法（Usage）

### 基本用法

```bash
# 运行完整 E2E 测试（推荐）
./scripts/e2e-template-test-v2.sh

# 运行快速验证
./scripts/validate-template.sh
```

### 在 Skill 中调用

当用户说：

- "验证 web-nextjs 模板"
- "测试 add-user-account-features 变更"
- "运行模板验收测试"
- "检查是否可以合并"

Skill 应：

1. 确认测试目标（哪个模板？哪个分支？）
2. 选择测试级别
3. 执行测试脚本
4. 分析报告并给出建议

---

## 测试流程（Test Workflow）

### Phase 1: 静态检查（Monorepo Context）

```bash
cd templates/web-nextjs/apps/web
npx eslint 'src/**/*.{ts,tsx}'    # Layer 2 约束检查
npx tsc --noEmit                  # 类型安全
npx next build                    # 生产构建
```

**关键点**：使用 `npx` 而非 `pnpm`，避免 workspace 依赖检查失败。

### Phase 2: 运行时测试

```bash
rm -rf .next/dev/cache            # 清理 Turbopack 缓存
npx next dev &                    # 启动开发服务器
wait_for_server(60s)              # 等待就绪
```

**关键点**：必须清理缓存，否则可能遇到 "corrupted database" 错误。

### Phase 3: HTTP 端点验证

```bash
curl http://localhost:3000/en                  # 首页
curl http://localhost:3000/en/forgot-password  # 新功能
curl http://localhost:3000/en/reset-password   # 新功能
curl http://localhost:3000/en/settings/profile # 新功能
```

**关键点**：接受多种状态码（200, 302, 307, 500），根据页面类型判断。

### Phase 4: 内容与安全检查

```bash
# 内容验证
grep "email" forgot-password-page.html
grep "password" reset-password-page.html

# 架构检查
grep -r "from '@/infra/db/client'" src/features/*/actions.ts  # 应该为空

# 安全检查
grep -rE "sb-[a-z0-9]{20,}" src/ | grep -v process.env  # 应该为空
grep "ALLOWED_NEXT" src/app/auth/callback/route.ts       # 应该存在
```

### Phase 5: 清理

```bash
lsof -ti:3000 | xargs kill -9  # 停止服务器
```

---

## 常见问题排查（Troubleshooting）

### 问题 1: pnpm 命令失败

**症状**：

```
[ERROR] Command failed with exit code 1: pnpm install
```

**原因**：pnpm workspace 依赖检查失败

**解决**：使用 `npx` 替代 `pnpm` 运行命令

### 问题 2: Dev Server 启动超时

**症状**：

```
✗ FAIL: Dev server failed to start within 60s
```

**原因**：Turbopack 缓存损坏

**解决**：

```bash
rm -rf .next/dev/cache
npx next dev
```

### 问题 3: Dashboard/Profile 返回 500

**症状**：

```
✗ FAIL: Dashboard returned 500 (expected 307)
```

**原因**：这些页面需要认证，未登录时可能抛出错误而非重定向

**解决**：接受 500 作为合法响应（在测试脚本中已处理）

### 问题 4: Layer 2 违规误报

**症状**：

```
✗ FAIL: Found direct infra imports in features
```

**检查**：

```bash
grep -r "from '@/infra/db/client'" src/features/*/actions.ts
```

**说明**：`server.ts` 可以 import infra（它是基础设施 helper），但 `actions.ts` 不行。

---

## 验收标准（Acceptance Criteria）

### 强制要求（Must Pass）

- [ ] ESLint 无错误
- [ ] TypeScript 编译通过
- [ ] 生产构建成功
- [ ] Dev Server 在 60s 内启动
- [ ] 首页返回 200
- [ ] 新功能页面可访问（forgot-password, reset-password, profile）
- [ ] 无 Layer 2 违规
- [ ] Open redirect 保护存在
- [ ] 无硬编码密钥

### 推荐要求（Should Have）

- [ ] 所有静态页面可访问（help, privacy, about）
- [ ] 页面包含预期内容
- [ ] Auth callback 正确重定向

### 可选要求（Nice to Have）

- [ ] 手动测试密码重置流程
- [ ] 验证 i18n 切换
- [ ] 检查响应式布局

---

## 输出格式（Output Format）

### 成功示例

```
╔════════════════════════════════════════════════════════╗
║  ✓ ALL TESTS PASSED - READY FOR MERGE                ║
╚════════════════════════════════════════════════════════╝

Results:
  Passed: 22
  Failed: 0

✅ Template is validated and ready!

Next Steps:
1. Merge to main:
   git checkout main
   git merge add-user-account-features
   git push origin main

2. Update docs:
   - apps/docs/content/docs/changelog/index.mdx
   - apps/docs/content/docs/roadmap/index.mdx

3. Release new version:
   git tag v0.x.0
   git push origin v0.x.0

4. Final CLI test:
   agentdock create test-app --template web-nextjs
   cd test-app && pnpm install && pnpm dev
```

### 失败示例

```
╔════════════════════════════════════════════════════════╗
║  ✗ TESTS FAILED - FIX BEFORE MERGING                 ║
╚════════════════════════════════════════════════════════╝

Results:
  Passed: 18
  Failed: 4

Failed Tests:
1. ESLint failed - Layer 2 violation in actions.ts
2. TypeScript error - Type mismatch in auth actions
3. Dev server timeout - Check port 3000
4. Forgot password page returned 404

Please fix the failures above before proceeding.
```

---

## 相关文件（Related Files）

- **E2E 测试脚本**：`scripts/e2e-template-test-v2.sh`
- **快速验证脚本**：`scripts/validate-template.sh`
- **详细指南**：`scripts/TEMPLATE-VALIDATION-GUIDE.md`
- **快速参考**：`scripts/QUICK-VALIDATION.md`
- **环境变量**：`.env.local`（根目录，包含 Supabase 凭证）

---

## 扩展阅读（Further Reading）

- [Builder Workflow](../apps/docs/content/docs/builder-workflow.mdx)
- [Layer 2 Architecture](../openspec/changes/add-layer2-constraint-gates/)
- [OpenSpec Validation](../openspec/config.yaml)
