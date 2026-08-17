# tasks · web-nextjs-npmrc-fix

- [x] 1.1 `templates/web-nextjs/.npmrc`：删掉 `only-built-dependencies` 行，
      换成说明为什么不能写在这里的注释（与 `skills-registry` 那份保持一致的措辞）。
- [x] 1.2 ~~确认 `package.json` 的 `pnpm.onlyBuiltDependencies` 是真源~~ →
      **实测推翻**：pnpm 10 在 workspace 根**不读** `package.json` 的 `pnpm` 字段。
      真源是 `pnpm-workspace.yaml`。两个模板的 `pnpm` 字段已删（留着是误导）。
- [x] 1.4 **范围扩大**：`templates/skills-registry` 一并修——PR #35 把它的设置留在
      `package.json`，等于静默关掉。已移入 `pnpm-workspace.yaml`。
- [x] 1.3 关掉 `openspec/changes/skills-registry-template/tasks.md` 的 task 6.4，
      指向本 change。
- [x] 2.1 **反向对照（不可省）**：直接问包管理器它到底读到了什么
      （`pnpm config get only-built-dependencies --json`），实测三态：
      | 状态 | 结果 |
      | --- | --- |
      | 修复前（`.npmrc` + `workspace.yaml` 并存） | **12 条**（应 6），两份被拼接 |
      | 只留 `package.json` 的 `pnpm` 字段 | **空** —— 静默失效 |
      | 修复后（只留 `workspace.yaml`） | web-nextjs **6 条** / skills-registry **5 条** ✓ |
      另：`pnpm config get`（不带 `--json`）返回的是**字符串**，正是崩溃现场的形态。
- [x] 3.1 `pnpm install` / `check-types` / `build` / `openspec validate web-nextjs-npmrc-fix`
      / `align:check` / `secrets:check` / `arch:check` 全绿
- [x] 3.2 `prettier --check` 对本刀触碰的文件全绿（⚠️ 全仓另有既有不合格文件，不得顺手格式化）
