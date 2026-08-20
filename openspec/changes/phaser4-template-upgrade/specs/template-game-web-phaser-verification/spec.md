## ADDED Requirements

### Requirement: 模板锁定 Phaser 4.x，并自带可用的 registry

`templates/game-web-phaser/` 的 `package.json` MUST 依赖 `phaser@^4.2.1`，
lockfile MUST 锁到该版本。

该模板 MUST 自带 `.npmrc` 指定一个**实测能提供 `phaser@4.2.1` tarball** 的 registry，
以免生成项目的安装结果取决于宿主环境的默认源。
MUST NOT 在 agentdock 仓库根写 `registry=`（会覆盖 CI 发布用的 registry）。

升级 MUST NOT 通过放宽既有验收判据来通过——`pnpm verify` 的 BH/IA 判据、触发器完整性检查与
实体越界判据 MUST 保持原样，判定失败时修的是被判定的代码。

#### Scenario: 生成项目能装上 Phaser 4

- **WHEN** 在生成项目里执行 `pnpm install`
- **THEN** 装到 `phaser@4.2.1`，且不依赖宿主环境的 registry 默认值

#### Scenario: 升级后全部判据仍然通过

- **WHEN** 升级完成后运行 `pnpm verify`
- **THEN** BH-0/1/2 与 IA 全部通过，且判据本身未被修改

#### Scenario: 官方 skill 随依赖到位

- **WHEN** 安装完成后检查 `node_modules/phaser/skills/`
- **THEN** 存在 28 个 `SKILL.md`
