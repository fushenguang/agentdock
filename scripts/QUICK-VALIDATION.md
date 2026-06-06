# 模板验证快速参考

> 在合并到 main 之前，使用此流程验证 web-nextjs 模板。

## 🚀 一键验证（推荐）

```bash
# 在项目根目录运行
./scripts/validate-template.sh
```

**预期输出：**
```
✓ All critical checks passed!

Passed:   29
Failed:   0
Warnings: 2
```

---

## 📋 验证流程总览

### 阶段 1：自动化检查（5-10 分钟）✅

运行验证脚本，检查：
- ✓ 环境（Node.js, pnpm）
- ✓ 依赖安装
- ✓ ESLint（包括 Layer 2 架构约束）
- ✓ TypeScript 类型检查
- ✓ 生产构建
- ✓ 功能完整性（密码重置、Profile 页等）
- ✓ 安全检查（无硬编码密钥）
- ✓ 文件结构

### 阶段 2：手动功能测试（15-20 分钟）🧪

```bash
cd templates/web-nextjs/apps/web
cp .env.example .env.local  # 配置 Supabase
pnpm dev
```

访问 http://localhost:3000，测试：
1. 登录/注册流程
2. **密码重置流程**（核心功能）
3. Profile 管理
4. 侧边栏链接（无 `#` 占位符）
5. Open redirect 保护
6. 国际化切换

详细测试步骤见：[TEMPLATE-VALIDATION-GUIDE.md](./TEMPLATE-VALIDATION-GUIDE.md)

### 阶段 3：E2E 测试（可选）🎯

需要真实 Supabase 环境：
```bash
pnpm exec playwright test
```

---

## ⚠️ 常见问题

### 1. pnpm install 失败

```bash
pnpm store prune
rm -rf node_modules .pnpm-store
pnpm install
```

### 2. Layer 2 违规

**错误：** `'@/infra/db/client' import is restricted`

**修复：** 在 `actions.ts` 中使用 Repository：
```typescript
// ❌ 错误
import { getServerClient } from '@/infra/db/client'

// ✅ 正确
import { getAuthRepository } from '@/infra/providers'
const repo = getAuthRepository()
```

### 3. 类型错误

**错误：** `Type '{ data: null; error: null; }' is not assignable`

**修复：**
```typescript
return { data: undefined as void, error: null }
```

---

## ✅ 验收标准

合并前必须满足：

### 强制要求
- [ ] 自动化脚本全部通过（0 failures）
- [ ] Layer 2 架构无违规
- [ ] 密码重置流程完整可用
- [ ] Open redirect 保护生效
- [ ] 侧边栏无 `#` 占位链接
- [ ] 生产构建成功
- [ ] 无硬编码密钥

### 推荐要求
- [ ] 手动测试清单 80% 以上通过
- [ ] i18n 翻译完整
- [ ] 响应式布局正常

---

## 📁 相关文件

- **自动化脚本：** `scripts/validate-template.sh`
- **详细指南：** `scripts/TEMPLATE-VALIDATION-GUIDE.md`
- **快速参考：** `scripts/QUICK-VALIDATION.md`（本文件）
- **任务清单：** `openspec/changes/add-user-account-features/tasks.md`

---

## 🔍 快速检查命令

```bash
# 代码质量
cd templates/web-nextjs/apps/web
pnpm lint              # ESLint
pnpm check-types       # TypeScript
pnpm build             # 生产构建

# 架构检查
grep -r "from '@/infra/db/client'" src/features/*/actions.ts  # 应该为空

# 安全检查
grep -r "SUPABASE.*=.*['\"]sb-" src/ | grep -v process.env    # 应该为空

# 功能检查
ls src/app/[locale]/*/forgot-password/page.tsx                 # 应该存在
ls src/app/[locale]/*/reset-password/page.tsx                  # 应该存在
```

---

## 💡 提示

- **不要**直接合并到 main，先在当前分支充分验证
- **不要**跳过手动测试，自动化检查无法覆盖所有场景
- **一定要**在真实 Supabase 环境中测试密码重置流程
- 如果发现问题，修复后重新运行 `./scripts/validate-template.sh`
