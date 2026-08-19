# Tasks · cli-auth-via-endpoint

## 0 · 硬前置（不做完不许往下走）

- [ ] 0.1 thefoolai 侧完成一次 **web 生产发版**（`release-web` 对齐 main）
- [ ] 0.2 判据：`curl -X POST https://www.fujia.site/api/device-auth/consume -d '{"device_code":"<随机 uuid>"}'`
      返回 **非 404**（预期 200 + `not_found`）。**不看工作流颜色，看这个响应**

## 1 · 切换传输

- [ ] 1.1 `consumeDeviceAuth()` 改打 `POST {webUrl}/api/device-auth/consume`
- [ ] 1.2 `AuthProvider` 收敛为 `{ name, webUrl }`；删除 `supabaseUrl` / `anonKey`
- [ ] 1.3 `DEFAULT_PROVIDER` 只剩 `webUrl`；`login` 不再有 `PROVIDER_NOT_CONFIGURED` 这条路径
- [ ] 1.4 检测到废弃的 `AGENTDOCK_AUTH_ANON_KEY` / `AGENTDOCK_AUTH_SUPABASE_URL` → 提示"已不再需要"，**不报错**

## 2 · 测试

- [ ] 2.1 `consumeDeviceAuth` 打的是端点路径（断言 URL 与 body 形状）
- [ ] 2.2 端点 4xx/5xx / 网络抖动 → 继续轮询到上限，不崩
- [ ] 2.3 provider 解析简化后，四层优先级仍成立
- [ ] 2.4 **反向对照**：产物里 grep 不到 JWT 形状字符串
- [ ] 2.5 `pnpm test` 全绿 + `pnpm check-types` 无错 + CI 九门全绿

## 3 · 发版

- [ ] 3.1 补 changeset（覆盖 `auth` 命令组 + 署名 + 零配置登录，面向用户的话术）
- [ ] 3.2 合并后确认 Version Packages PR 出现 → 合它 → npm 真的发布
- [ ] 3.3 **判据**：`npm view @cogito.ai/cli version` 是新版本（不看工作流颜色）

## 4 · 真机验收（构建者亲跑）

- [ ] 4.1 **干净环境**（`unset AGENTDOCK_AUTH_*`，最好换一台机器或新用户）`npx @cogito.ai/cli auth login` 走通
- [ ] 4.2 `auth status` 显示身份；`skill publish` 产出的条目带 `author`
- [ ] 4.3 反向：`AGENTDOCK_AUTH_WEB_URL` 指向不存在的域 → 明确报错且不无限挂

## 5 · 知识沉淀

- [ ] 5.1 把「客户端零密钥的做法：把唯一的后端调用收在一个函数里，再换成自家端点」写进 agentdock docs，
      连同本刀的前置教训——**端点合进 main ≠ 生产上有**，切换前必须 curl 生产实测
