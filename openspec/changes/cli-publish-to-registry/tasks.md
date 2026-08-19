# Tasks · cli-publish-to-registry

## 1 · `indexToRegistry()`

- [x] 1.1 新增 `core/registryIndex.ts`：`indexToRegistry(entry, options)`，输入
      `{ skillId, gitUrl, name, description, version?, license? }`
- [x] 1.2 未登录 → 直接返回 `{ indexed: false, reason: 'ANONYMOUS' }`，**不发起任何请求**
- [x] 1.3 已登录 → `POST {webUrl}/api/skills/publish`，头带 `Authorization: Bearer <access_token>`，
      body 只含允许的字段（不含 `access_tier` / `is_official` / 扫描状态）
- [x] 1.4 明确超时（15s，可注入覆盖用于测试），超时按 `REQUEST_FAILED` 处理，**不重试**
- [x] 1.5 非 2xx / 网络抛错 → 统一收敛为 `{ indexed: false, reason: 'REQUEST_FAILED', message }`，
      永不抛出

## 2 · 接入 `publishSkill()`

- [x] 2.1 manifest 写入成功之后调用 `indexToRegistry()`，结果并入返回值
      (`indexed: boolean` + `indexError?: string`)
- [x] 2.2 索引失败/未登录不影响 `ok`，也不回滚 manifest
- [x] 2.3 `publishSkill()` 增加 `provider?` / `fetchImpl?` 测试注入点（与 `authEnv?` 一致的模式）

## 3 · 适配层输出

- [x] 3.1 `adapters/skill/human.ts`：`indexed` 为 false 时打告警，区分"未登录"与"请求失败"
- [x] 3.2 `adapters/skill/agent.ts`：同上（`console.warn`），JSON 模式下字段随整个 result 一起序列化，
      不需要额外处理

## 4 · 测试

- [x] 4.1 已登录 + 端点 200 → `indexed: true`
- [x] 4.2 未登录 → 断言 mock fetch **未被调用**、`indexed: false`、manifest 照常写入
- [x] 4.3 端点 500 / 404 / 网络抛错 / 超时 → `indexed: false` + 错误摘要，manifest 仍写入，且只调用
      一次 fetch（不重试）
- [x] 4.4 反向对照：请求体里没有 `access_tier` / `is_official` / `security_status`
- [x] 4.5 补充/修正既有 `skillPublish.test.ts` 用例：为不显式传 `authEnv` 的既有用例加上
      `homedir()` mock，避免在真的登录过本机 `agentdock auth login` 的机器上跑测试时，
      索引调用打到真实生产端点
- [x] 4.6 `pnpm test` 全绿、`pnpm check-types` 无错

## 5 · 已知遗留（本刀不做）

- [ ] 5.1 服务端 `POST /api/skills/publish` 尚未上线（thefoolai 侧 `cli-publish-to-registry`
      proposal 只有文档合入 main）——不阻塞本刀合并，端点上线后自然接上，构建者负责真机联调验收
- [ ] 5.2 真机验收（构建者亲跑，待端点上线）：干净机器 `auth login` → `skill publish` →
      不碰任何 SQL → 该 skill 出现在 `skills_registry`、web 可查看、app 可安装
