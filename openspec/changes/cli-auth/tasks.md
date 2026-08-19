# cli-auth — tasks

## 1 · core（纯逻辑，可测）

- [x] 1.1 `src/core/auth.ts`：provider 解析（flag > env > `~/.agentdock/config.json` > 内置默认），一处 `DEFAULT_PROVIDER` 常量
- [x] 1.2 凭据读写：`~/.agentdock/credentials.json`，目录 `0700` / 文件 `0600`；损坏视为未登录（不抛栈）
- [x] 1.3 `buildDeviceAuthUrl()`：`{webUrl}/device-auth?code=…&device_name=…&os=…&version=…`
- [x] 1.4 `consumeDeviceAuth()`：**唯一的后端交互点**（POST `{supabaseUrl}/rest/v1/rpc/consume_device_auth`），
      将来换成 provider HTTP 端点只动这一个函数（design §2.2）
- [x] 1.5 `pollForSession()`：2s 间隔、**5 分钟硬超时**、每次 sleep 前查 abort；
      `approved` → 返回 session；`expired` / `denied` / `consumed` → 各自明确错误码；其余继续轮询
- [x] 1.6 外部效应全部可注入（`fetchImpl` / `sleep` / `openBrowser` / `now` / `homeDir`）

## 2 · 命令与适配层

- [x] 2.1 `src/commands/auth/{index,login,logout,status}.ts`（citty；形状对齐 `claude auth`）
- [x] 2.2 `src/adapters/auth/{human,agent}.ts`：human 用 `@clack/prompts` 呈现；agent 模式（`--json` / 非 TTY）输出 NDJSON
- [x] 2.3 `status` 未登录时**退出码非 0**（脚本可判）；已登录退出码 0
- [x] 2.4 在 `src/main.ts` 注册 `auth` 子命令

## 3 · publish 署名

- [x] 3.1 `SkillManifestEntry` 增加可选 `author?: { id: string; name?: string }`（design §4）
- [x] 3.2 `publishSkill()` 读取当前登录态；已登录写入 `author`，未登录**不写该字段**
- [x] 3.3 未登录时打醒目告警并给出 `agentdock auth login`，**退出码仍 0**（design §5）
- [x] 3.4 ⚠️ **manifest 永远先写**——本刀不引入任何"写后端失败就不写 manifest"的路径

## 4 · 测试（`pnpm test`，vitest）

- [x] 4.1 provider 解析优先级四层各一例
- [x] 4.2 凭据往返：写 → 读 → 权限位是 `0600`；**损坏文件 → 报未登录而非抛栈**
- [x] 4.3 轮询：首轮 `approved` / 中途 `approved` / `expired` / `denied` / 超时 各一例（注入假 fetch + 假 sleep，**不睡真时间**）
- [x] 4.4 `publish` 署名：已登录写 `author`、未登录**字段不出现**（不是 `null`）
- [x] 4.5 **反向对照**：`status` 在无凭据文件、空文件、坏 JSON 三种情况都报未登录且不崩
- [x] 4.6 全量 `pnpm test` 绿；`pnpm check-types` 无错

## 5 · 真机验收（构建者亲跑）

- [ ] 5.1 `agentdock auth login` 走通一次真实浏览器授权 → `auth status` 显示身份
- [ ] 5.2 `auth logout` → `status` 退出码非 0
- [ ] 5.3 登录态下 `skill publish` 产出的条目**带 `author`**（看 `skills.json` 实际内容，不看命令输出）
- [ ] 5.4 ⚠️ 验完把测试条目从 registry checkout 里撤掉，别污染 `thefool-skills`

## 6 · 知识沉淀

- [ ] 6.1 把「客户端不建行、只调一次 RPC」这条实测写进 agentdock docs（省得下次又去猜设备授权流要几个后端调用）
- [ ] 6.2 归档时把 §2.2（零密钥终局）作为下一刀的触发条件写进 roadmap 条目注释

---

## 执行记录（2026-08-19）

- §1–§4 全部完成。`pnpm check-types` 无错；新增 32 个用例（auth 22 + publish 署名 3 + 既有）全绿，全量 74 tests。
- **命令行为实测**（非 TTY / `--json` 模式，注入临时 HOME）：
  - 未登录 `auth status` → 退出码 **1**，输出 `{"signedIn":false,"reason":"NO_CREDENTIALS"}`
  - 已登录 → 退出码 **0**，输出只有身份，**grep 不到 token**（design §7 的判据）
  - `auth logout` → 凭据文件消失，随后 `status` 退出码回到 **1**
  - 未配置 anonKey 时 `auth login` → `{"error":"PROVIDER_NOT_CONFIGURED"}` 退出码 1，**不是崩栈**
- **既有失败与本刀无关**：`core.test.ts > scaffolds web-nextjs` 在本机超时（33s）。已用 `git stash -u` 撤掉本刀全部改动复跑，**失败方式完全相同**（1 failed / 17 passed）⇒ 环境问题（该用例走脚手架/网络路径），非本刀引入。
- ⚠️ **仍待构建者决定**：`DEFAULT_PROVIDER.anonKey` 目前为空字符串。零配置登录需要把公开 anon key 内置进包（见 design §2.1），我没有擅自把生产 key 提交进公开仓——这属于仓库所有者的决定。在决定之前，登录需 `AGENTDOCK_AUTH_ANON_KEY` 或 `~/.agentdock/config.json`。
