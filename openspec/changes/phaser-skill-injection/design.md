# design · phaser-skill-injection

## D1 · 注入层：模板的 `postinstall`（三个候选逐个核过）

| 候选 | 判定 | 理由 |
|---|---|---|
| **平台脚手架命令**（cogito-lib 的投递文本里加一句"复制 skills"） | ❌ | 那是**散文指令**，靠执行者自觉。本仓库反复记录：**靠自觉的约定迟早不发生**（`assertions.json` 被删过、`PROJECT_CONTEXT.md` 填充率 0%）。今天这一刀的全部意义就是让它**机械发生** |
| **CLI `init`** | ❌ | `init` 时 `node_modules` **还不存在**——skills 随 `phaser` 包在 `pnpm install` 之后才落地 |
| ✅ **模板 `postinstall`** | **采用** | 它在 `pnpm install` 之后**自动**执行，正是 skills 存在的那一刻；随模板分发，每个生成项目都有；**只有一处实现** |

## D2 · 路径与守卫：`${HOME}/.config/shelley`，且只在已存在时才写

🔴 **不许硬编码 `/root/.config/…`**——2026-08-16 实测：guest 里 `HOME=/`，写成 `/root/.config`
**静默失效**（文件在、skill 不出现、零报错）。也不硬编码 `/.config`：那在开发者本机是错的。
用 `${HOME}/.config/shelley`，两种环境都正确解析。

🔴 **守卫：只有当 `${HOME}/.config/shelley` 目录已存在时才复制。** 它等价于"这是一台跑着
Shelley 的机器"。开发者本机没有这个目录 → **no-op**，不污染任何人的个人配置（判据 3）。

## D3 · 复制整个 skill 目录，不只 `SKILL.md`

28 个 skill 里有 **8 个带 `references/REFERENCE.md`**，`SKILL.md` 正文里用相对路径引用它们
（`../game-setup-and-config/SKILL.md` 这类）。只复制 `SKILL.md` 会让那些引用指向不存在的文件。
总量 **656K**，复制全量的成本可以忽略。

⚠️ **提示词成本**：只有 frontmatter 的 `description` 进系统提示词。28 条按实测每条约 300 字符
估算，约 **8–10KB**。这不是零成本，但相对上下文预算可接受——**如实记下来，不装作免费**。

## D4 · 幂等，且"只有读回可信"

脚本可重复运行（已存在就覆盖同名目录）。🔴 **脚本自己不宣布成功**——判据 1 明确要求用
`shelley skill ls` **读回**核实，不看脚本退出码。这条是本仓库的老教训：调用结果不可信，只有读回可信。
