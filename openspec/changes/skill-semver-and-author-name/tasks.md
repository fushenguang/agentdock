# Tasks · skill-semver-and-author-name

> 执行前提：proposal 获批，且「待裁决」两条已有答案。

## 1 · 版本读取与校验

- [ ] 1.1 `core/skillPublish.ts`：从 `readProperties()` 的 `metadata` 里取版本（键名依裁决），兼容 `thefool.version`
- [ ] 1.2 semver 形状校验：**不引入新依赖**，用一条严格正则（`major.minor.patch` + 可选 prerelease/build），拒绝 `v` 前缀
- [ ] 1.3 不合格 → 返回 `SKILL_VERSION_INVALID`，错误信息里给出**收到的值**与**期望形状**
- [ ] 1.4 无版本时的行为按裁决实现（默认预期：可选 + 告警）

## 2 · manifest schema

- [ ] 2.1 `SkillManifestEntry` 增加 `version?: string`
- [ ] 2.2 写入时保持「空则不写」惯例（与 `path` / `license` / `author` 一致）
- [ ] 2.3 幂等：同一 skill 重复 publish，版本变化要覆盖旧值

## 3 · author.name

- [ ] 3.1 `core/auth.ts`：从 consume 响应里读服务端解析的 `display_name` 存进凭据
      ⚠️ **依赖 thefoolai PR #199 之后的那个 delta**——它没落地前这条做不了，别用 CLI 自查 profile 顶替（会把刚拆掉的 key 依赖装回去）
- [ ] 3.2 `currentAuthor()` 把它填进 `author.name`
- [ ] 3.3 老凭据文件（只有 id、没有 name）→ 视为有效，`name` 缺省即可，**不强制重新登录**

## 4 · 测试

- [ ] 4.1 合法 semver（含 `1.2.3-beta.1`、`1.2.3+build`）全部通过
- [ ] 4.2 **反向对照**：`v1.2.0` / `2026-08-19` / `1.x` / `latest` / `1.2` 全部被拒
- [ ] 4.3 无版本 skill 的行为符合裁决
- [ ] 4.4 幂等：改版本后重发，manifest 里是新值且只有一条
- [ ] 4.5 `author.name`：有 display_name → 写入；无 → 只有 id；未登录 → 字段不出现
- [ ] 4.6 `pnpm test` 全绿 + `pnpm check-types` 无错

## 5 · 真机验收（构建者亲跑）

- [ ] 5.1 给一个真实 skill 补 `metadata.version` 后 publish，**看 `skills.json` 文件内容**确认版本落进去了
- [ ] 5.2 故意写成 `v1.0.0` 再发一次 → **被拒**，错误信息可读
- [ ] 5.3 登录态下 publish → `author` 有 `id` 和 `name` 两者

## 6 · 知识沉淀

- [ ] 6.1 把「Agent Skills 规范没有 version、client 字段必须走 metadata」这条写进 agentdock docs——
      这是每次给 skill 加字段都会重新踩的坑
- [ ] 6.2 把 `compareVersions` 对 `v` 前缀静默归零那条实证一并记下（它是本刀的 Why，也是别处的前车之鉴）
