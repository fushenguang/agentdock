# Template Testing Skill - Usage Examples

## 场景 1: 验证新功能分支

**用户请求**：

> "我刚完成了 add-user-account-features 分支的开发，需要验证是否可以合并到 main"

**Skill 执行流程**：

1. **确认测试目标**

   ```
   模板: web-nextjs
   分支: add-user-account-features
   测试级别: e2e (完整测试)
   ```

2. **运行 E2E 测试**

   ```bash
   ./scripts/e2e-template-test-v2.sh
   ```

3. **分析结果**
   - 如果所有测试通过 → 输出 "READY FOR MERGE"
   - 如果有失败 → 列出失败项和修复建议

4. **提供下一步指引**

   ```markdown
   ✅ 测试通过！可以合并。

   下一步：

   1. git checkout main
   2. git merge add-user-account-features
   3. git push origin main
   4. 更新 changelog 和 roadmap 文档
   ```

---

## 场景 2: 快速验证小改动

**用户请求**：

> "我只改了一个 typo，快速检查一下有没有问题"

**Skill 执行流程**：

1. **选择快速验证**

   ```bash
   ./scripts/validate-template.sh
   ```

2. **仅运行静态检查**
   - ESLint
   - TypeScript
   - Build

3. **跳过运行时测试**（节省时间）

---

## 场景 3: 调试测试失败

**用户请求**：

> "测试失败了，帮我看看是什么原因"

**Skill 执行流程**：

1. **读取测试日志**

   ```bash
   cat /tmp/lint.log | tail -20
   cat /tmp/types.log | tail -20
   cat /tmp/build.log | tail -30
   cat /tmp/dev-server.log | tail -50
   ```

2. **分析失败原因**

   **常见问题模式**：
   - Layer 2 违规 → `actions.ts` 直接 import `@/infra/db/client`
   - TypeScript 错误 → 类型不匹配，需要使用 `undefined as void`
   - Dev Server 超时 → Turbopack 缓存损坏，需要清理
   - 500 错误 → 页面需要认证但未登录

3. **提供修复建议**

   **示例输出**：

   ```markdown
   🔍 失败原因分析：

   1. Layer 2 违规
      文件: src/features/auth/actions.ts:5
      问题: 直接 import getServerClient
      修复: 改用 getAuthRepository()

   2. Dev Server 启动失败
      原因: Turbopack 缓存损坏
      修复: rm -rf .next/dev/cache && npx next dev

   请修复后重新运行测试。
   ```

---

## 场景 4: 发布前最终验收

**用户请求**：

> "准备发布 v0.5.0，做最后的验收测试"

**Skill 执行流程**：

1. **运行完整 E2E 测试**

   ```bash
   ./scripts/e2e-template-test-v2.sh
   ```

2. **额外手动验证**（Skill 提醒用户）

   ```markdown
   ⚠️ 自动化测试已通过，但发布前还需手动验证：

   1. 密码重置完整流程：
      - 访问 /en/forgot-password
      - 输入邮箱并提交
      - 检查邮箱收到重置链接
      - 点击链接并设置新密码
      - 使用新密码登录

   2. Profile 管理：
      - 登录后访问 /en/settings/profile
      - 修改显示名并保存
      - 刷新页面验证更改持久化

   3. Open Redirect 保护：
      - 尝试恶意 URL: /auth/callback?next=https://evil.com
      - 验证被重定向到默认页面
   ```

3. **生成测试报告**

   ```markdown
   # Release v0.5.0 Test Report

   Date: 2026-06-06
   Template: web-nextjs
   Branch: main

   Results:

   - Passed: 22/22
   - Failed: 0

   Status: ✅ READY FOR RELEASE

   Checklist:

   - [x] All automated tests passed
   - [ ] Manual password reset flow verified
   - [ ] Profile management tested
   - [ ] Security checks completed
   ```

---

## 场景 5: 批量测试多个模板

**用户请求**：

> "我有 3 个模板都做了更新，一起验证一下"

**Skill 执行流程**：

1. **依次测试每个模板**

   ```bash
   for template in web-nextjs cli-tool admin-dashboard; do
     echo "Testing $template..."
     cd templates/$template/apps/web
     ./scripts/e2e-template-test-v2.sh
     cd ../../../..
   done
   ```

2. **汇总测试结果**

   ```markdown
   # Batch Test Results

   | Template        | Status  | Passed | Failed |
   | --------------- | ------- | ------ | ------ |
   | web-nextjs      | ✅ PASS | 22     | 0      |
   | cli-tool        | ❌ FAIL | 18     | 4      |
   | admin-dashboard | ✅ PASS | 22     | 0      |

   Action Required:

   - cli-tool has 4 failures, review before merging
   ```

---

## 场景 6: CI/CD 集成

**用户请求**：

> "如何在 GitHub Actions 中自动运行这个测试？"

**Skill 提供配置示例**：

```yaml
# .github/workflows/template-test.yml
name: Template Validation

on:
  pull_request:
    paths:
      - 'templates/**'

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: '9'

      - name: Install dependencies
        run: pnpm install

      - name: Run E2E tests
        run: ./scripts/e2e-template-test-v2.sh
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload test logs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-logs
          path: |
            /tmp/lint.log
            /tmp/types.log
            /tmp/build.log
            /tmp/dev-server.log
```

---

## 最佳实践（Best Practices）

### 1. 测试频率

- **每次提交前**：运行快速验证 (`validate-template.sh`)
- **合并到 main 前**：运行完整 E2E 测试
- **发布前**：E2E + 手动功能测试

### 2. 环境隔离

- 使用根目录 `.env.local` 作为单一真相源
- 不要在生产环境中使用测试凭证
- 定期轮换 Supabase 密钥

### 3. 失败处理

- **立即修复**：Layer 2 违规、TypeScript 错误、安全检查失败
- **可以忽略**：Dashboard/Profile 的 500 错误（需要认证）
- **需要调查**：Dev Server 超时、构建失败

### 4. 性能优化

- 清理 Turbopack 缓存后再启动 dev server
- 使用 `npx` 而非 `pnpm` 避免 workspace 检查
- 并行运行独立测试（如果可能）

### 5. 文档同步

- 每次测试脚本更新后，同步更新 SKILL.md
- 记录新的失败模式和解决方案
- 保持 checklist.json 与实际测试一致
