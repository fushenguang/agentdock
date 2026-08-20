# tasks · phaser-skill-injection

## 1 · 注入脚本

- [x] 1.1 模板新增 `scripts/install-phaser-skills.mjs`（或同等位置），并接进 `postinstall`
- [x] 1.2 路径用 `${HOME}/.config/shelley`；🔴 **不许硬编码 `/root/.config` 或 `/.config`**
- [x] 1.3 🔴 **守卫**：`${HOME}/.config/shelley` 不存在就 **no-op 退出 0**（非 Shelley 环境）
- [x] 1.4 复制**整个** skill 目录（含 `references/`），幂等
- [x] 1.5 零新依赖（模板的既定纪律）

## 2 · 测试

- [x] 2.1 纯逻辑单测：路径推导、守卫判定、要复制的目录清单
- [x] 2.2 🔴 变异验证：把守卫去掉 → 测试必须红（否则守卫等于没有）

## 3 · 门禁与发布

- [x] 3.1 `pnpm test` / `pnpm check-types` / `pnpm build` 全绿
- [x] 3.2 本机 `pnpm install` 实测 **no-op**：`~/.config/shelley` 没有被创建/写入（判据 3）
- [x] 3.3 changeset（`@cogito.ai/cli`）

## 4 · 真机验证（规划方做）

- [ ] 4.1 发版 → 新脚手架项目 → VM 上 `shelley skill ls` 读回 **= 7 + 28**
- [ ] 4.2 对照实验（有 skill / 无 skill 各一次 Run），判据见 cogito-lib 侧记录
