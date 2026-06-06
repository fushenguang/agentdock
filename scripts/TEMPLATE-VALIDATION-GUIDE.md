# Template Validation Guide

> 在合并到 main 分支之前，使用此指南全面验证 web-nextjs 模板的可用性。

## Quick Start

```bash
# 运行自动化验证脚本
chmod +x scripts/validate-template.sh
./scripts/validate-template.sh
```

## 验证流程总览

完整的验证分为 **3 个阶段**：

1. **自动化检查**（5-10 分钟）- 由脚本自动完成
2. **手动功能测试**（15-20 分钟）- 需要在浏览器中操作
3. **E2E 端到端测试**（可选，需要 Supabase 环境）

---

## 阶段 1: 自动化检查

### 运行验证脚本

```bash
cd /path/to/agentdock
./scripts/validate-template.sh
```

脚本会检查以下内容：

#### ✓ 环境检查
- Node.js ≥ 18
- pnpm 9.x
- 模板目录存在

#### ✓ 依赖安装
- `pnpm install` 成功
- 无 peer dependency 冲突

#### ✓ 代码质量
- ESLint 无错误
- **Layer 2 架构约束**：features 层不直接 import infra
- 无 console.log 泄露（警告级别）

#### ✓ 类型安全
- TypeScript 编译通过
- 无类型错误

#### ✓ 生产构建
- `next build` 成功
- .next 输出目录生成

#### ✓ 架构完整性
- Repository 接口和实现都存在
- 无 features → infra 的直接依赖

#### ✓ 功能完整性
- 密码重置页面存在
- Profile 设置页存在
- Auth callback 有 open redirect 保护
- Server Actions 完整
- Zod schemas 完整
- i18n 翻译文件存在

#### ✓ 安全检查
- 无硬编码的 Supabase URL/Key
- 无敏感信息泄露

### 预期输出

```
========================================
  Validation Summary
========================================
Passed:   45
Failed:   0
Warnings: 2

✓ All critical checks passed!

Next steps:
1. Review warnings above (if any)
2. Manually test the dev server: pnpm dev
3. Test password reset flow in browser
...
```

如果有失败项，**不要继续**，先修复问题。

---

## 阶段 2: 手动功能测试

### 前置条件

1. **配置 Supabase**（本地或远程）
   ```bash
   cd templates/web-nextjs/apps/web
   cp .env.example .env.local
   # 编辑 .env.local，填入你的 Supabase 凭证
   ```

2. **启动开发服务器**
   ```bash
   pnpm dev
   ```
   访问 http://localhost:3000

### 测试清单

#### 1. 基础页面加载（2 分钟）

| 测试项 | 预期结果 | 状态 |
|--------|---------|------|
| 首页 `/en` | 正常渲染，无控制台错误 | ☐ |
| Dashboard `/en/dashboard` | 未登录时重定向到登录页 | ☐ |
| 登录页 `/en/login` | 表单正常显示 | ☐ |
| 注册页 `/en/signup` | 表单正常显示 | ☐ |

#### 2. 认证流程（5 分钟）

**邮箱/密码登录：**
1. 使用有效邮箱注册
2. 验证邮箱（检查 Supabase Auth 后台）
3. 登录成功，跳转到 dashboard
4. 退出登录

**GitHub OAuth：**
1. 点击 "Sign in with GitHub"
2. 授权后返回应用
3. 成功创建账户并跳转

#### 3. 密码重置流程（5 分钟）⭐ 核心功能

**步骤 A: 请求重置链接**
1. 访问 `/en/forgot-password`
2. 输入已注册的邮箱
3. 提交表单
4. 检查是否显示成功消息（即使邮箱不存在也应显示成功 - 防止枚举攻击）
5. 检查邮箱是否收到重置邮件

**步骤 B: 点击重置链接**
1. 点击邮件中的链接
2. 应跳转到 `/auth/callback?next=/en/reset-password&...`
3. 然后自动跳转到 `/en/reset-password`

**步骤 C: 设置新密码**
1. 输入新密码（≥8 位）
2. 确认密码
3. 提交
4. 成功后跳转到登录页
5. 使用新密码登录成功

**边界情况测试：**
- ☐ 输入无效邮箱格式 → 显示错误
- ☐ 两次密码不一致 → 显示错误
- ☐ 密码少于 8 位 → 显示错误
- ☐ 重置链接过期/已使用 → 显示友好错误

#### 4. Profile 管理（3 分钟）

1. 登录后访问 `/en/settings/profile`
2. 修改显示名（Display Name）
3. 保存成功
4. 刷新页面，显示名保持
5. 头像正确显示（从 Supabase user_metadata 读取）

#### 5. 侧边栏检查（2 分钟）⭐ Layer 2 验收

打开浏览器开发者工具，检查侧边栏所有链接：

```javascript
// 在控制台运行
document.querySelectorAll('nav a').forEach(a => {
  if (a.href.includes('#') || a.getAttribute('href') === '#') {
    console.warn('Found placeholder link:', a)
  }
})
```

**预期结果：** 无任何 `href="#"` 或 `url: "#"` 的链接

检查以下页面是否可访问：
- ☐ `/en/help` - Help Center（占位页）
- ☐ `/en/privacy` - Privacy Policy（占位页）
- ☐ `/en/about` - About Us（占位页）

#### 6. Open Redirect 保护（2 分钟）⭐ 安全验收

**测试 1: 合法的重定向**
```
http://localhost:3000/auth/callback?code=FAKE&next=/en/reset-password
```
→ 应该允许（在白名单中）

**测试 2: 非法的重定向**
```
http://localhost:3000/auth/callback?code=FAKE&next=https://evil.com
```
→ 应该被拦截，重定向到默认页面 `/en/dashboard`

**测试 3: 空 next 参数**
```
http://localhost:3000/auth/callback?code=FAKE
```
→ 重定向到默认页面

#### 7. 国际化切换（1 分钟）

1. 在页面底部切换语言（EN ↔ 中文）
2. 所有文本正确翻译
3. URL 路径更新（`/en/...` ↔ `/zh/...`）
4. 刷新页面后语言保持

#### 8. 响应式布局（1 分钟）

调整浏览器窗口大小：
- ☐ Desktop (>1024px): 侧边栏展开
- ☐ Tablet (768-1024px): 侧边栏可折叠
- ☐ Mobile (<768px): 汉堡菜单

---

## 阶段 3: E2E 端到端测试（可选）

如果配置了真实的 Supabase 环境，可以运行 Playwright 测试：

```bash
cd templates/web-nextjs/apps/web
pnpm exec playwright install
pnpm exec playwright test
```

### 关键测试场景

1. **完整密码重置流程**
   - 模拟邮箱接收
   - 验证链接有效性
   - 密码强度校验

2. **并发会话管理**
   - 多标签页登录
   - Token 刷新

3. **错误恢复**
   - 网络中断
   - API 超时

---

## 常见问题排查

### 问题 1: pnpm install 失败

**症状：**
```
ERR_PNPM_WORKSPACE_PKG_NOT_FOUND
```

**解决：**
```bash
# 清理缓存
pnpm store prune
rm -rf node_modules .pnpm-store
pnpm install
```

### 问题 2: Layer 2 违规

**症状：**
```
'@/infra/db/client' import is restricted from being used
```

**解决：**
检查 `src/features/**/actions.ts` 是否有直接 import infra，改为通过 Repository：

```typescript
// ❌ 错误
import { getServerClient } from '@/infra/db/client'

// ✅ 正确
import { getAuthRepository } from '@/infra/providers'
const repo = getAuthRepository()
```

### 问题 3: 构建时 TypeScript 错误

**症状：**
```
Type '{ data: null; error: null; }' is not assignable to type 'ActionResult'
```

**解决：**
对于 `void` 返回类型，使用：
```typescript
return { data: undefined as void, error: null }
```

### 问题 4: 密码重置邮件未收到

**检查清单：**
1. Supabase Auth → Email Templates → Password Reset 已启用
2. SMTP 配置正确（或使用 Supabase 默认）
3. 检查垃圾邮件文件夹
4. Supabase 后台查看 Auth Logs

### 问题 5: GitHub OAuth 失败

**检查：**
1. GitHub App 的回调 URL 配置正确：
   ```
   http://localhost:3000/auth/callback
   ```
2. `.env.local` 中配置了 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`
3. Supabase Auth → Providers → GitHub 已启用

---

## 验收标准

在合并到 main 之前，必须满足：

### 强制要求（Must Have）

- [ ] 自动化脚本全部通过（0 failures）
- [ ] Layer 2 架构无违规
- [ ] 密码重置流程完整可用
- [ ] Open redirect 保护生效
- [ ] 侧边栏无 `#` 占位链接
- [ ] 生产构建成功
- [ ] 无硬编码密钥

### 推荐要求（Should Have）

- [ ] 手动测试清单 80% 以上通过
- [ ] 无明显 UI bug
- [ ] i18n 翻译完整
- [ ] 响应式布局正常

### 可选要求（Nice to Have）

- [ ] E2E 测试通过
- [ ] Lighthouse 性能评分 > 80
- [ ] 无障碍检查通过

---

## 快速修复清单

如果发现以下问题，参考对应的修复方法：

| 问题 | 修复文件 | 说明 |
|------|---------|------|
| Layer 2 违规 | `src/features/*/actions.ts` | 改用 Repository |
| 类型错误 | `src/features/auth/actions.ts` | 使用 `undefined as void` |
| 缺少翻译 | `messages/en.json`, `messages/zh.json` | 添加缺失 key |
| Open redirect | `src/app/auth/callback/route.ts` | 添加白名单校验 |
| 侧边栏占位符 | `src/components/nav-main.tsx` | 移除 `url: "#"` |

---

## 最终检查

在提交 PR 之前，运行：

```bash
# 1. 自动化验证
./scripts/validate-template.sh

# 2. 格式化代码
cd templates/web-nextjs/apps/web
pnpm format

# 3. 最后构建
pnpm build

# 4. OpenSpec 验证（如果在变更分支）
openspec validate add-user-account-features
```

确认所有检查通过后，才能合并到 main 分支。

---

## 附录：验证脚本位置

- 自动化脚本：`scripts/validate-template.sh`
- 本指南：`scripts/TEMPLATE-VALIDATION-GUIDE.md`
- OpenSpec 任务清单：`openspec/changes/add-user-account-features/tasks.md`
