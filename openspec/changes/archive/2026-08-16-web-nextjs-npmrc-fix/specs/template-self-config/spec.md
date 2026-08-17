## ADDED Requirements

### Requirement: 模板的包管理器数组型设置只能有一个真正生效的来源

模板 MUST NOT 在 `.npmrc` 里表达任何**数组语义**的 pnpm 设置（如 `only-built-dependencies`）。

理由是形态问题而非风格问题：`.npmrc` 只能存字符串，pnpm 会把
`only-built-dependencies = a,b,c` 映射成一个**字符串**；消费该设置的工具链
（如 `pnpm/action-setup` 的 self-installer）会对它执行数组操作并崩溃，
使**任何由该模板脚手架出来的仓库**在安装阶段就失败。

这类设置的唯一真源 MUST 是 `pnpm-workspace.yaml`，且 MUST 只保留一处——
同一设置在多处并存本身就是产生上述崩溃的条件之一（实测：`.npmrc` 与
`pnpm-workspace.yaml` 各写一份，包管理器解析出的是**两份拼接**的结果）。

模板 MUST NOT 依赖 `package.json` 的 `pnpm` 字段来表达此类设置：
在 workspace 根下 pnpm 10 **不读取**它，留着它会让人误以为设置仍然生效——
这是一种比崩溃更隐蔽的失效（不会红，只是不生效）。

#### Scenario: 模板不含 `.npmrc` 形式的数组型设置

- **WHEN** 检查任一模板的 `.npmrc`
- **THEN** 其中不含 `only-built-dependencies` 之类以逗号分隔表达列表的键

#### Scenario: 该设置真正生效（负例：删除不得造成静默失效）

- **WHEN** 在模板目录内向包管理器**查询**该设置的实际生效值
- **THEN** 返回一个数组，其条目与移除前**完全一致、无重复**——判据是「包管理器真的读到了」，而不是「文件里还写着」

#### Scenario: 脚手架产物可以完成安装

- **WHEN** 用该模板脚手架出一个项目并在产物目录内执行依赖安装
- **THEN** 安装成功，不因包管理器配置的形态问题而失败
