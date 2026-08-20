## ADDED Requirements

### Requirement: Phaser 官方 skill 随安装注入 Shelley 的 skill 目录

模板 MUST 在 `pnpm install` 之后自动把 `node_modules/phaser/skills/` 下的**每个 skill 目录**
（含其 `references/`）复制到 `${HOME}/.config/shelley/<name>/`。

路径 MUST 由 `${HOME}` 推导，MUST NOT 硬编码 `/root/.config` 或 `/.config`
（guest 里 `HOME=/`，硬编码会静默失效）。

`${HOME}/.config/shelley` 不存在时 MUST no-op 并以 0 退出——非 Shelley 环境 MUST NOT 被写入。

该注入 MUST 只有一处实现，MUST NOT 依赖投递文本里的自然语言指令。

#### Scenario: Shelley VM 上安装后 skill 可被列出

- **WHEN** 在一台已运行 Shelley 的机器上对生成项目执行 `pnpm install`
- **THEN** `shelley skill ls` 能列出 28 个 Phaser skill（加上内置的）

#### Scenario: 开发者本机不被写入（负例）

- **WHEN** 在没有 `${HOME}/.config/shelley` 的机器上执行 `pnpm install`
- **THEN** 脚本 no-op、退出 0，且不创建任何目录
