---
roadmap-id: web-nextjs-npmrc-fix
---

# web-nextjs-npmrc-fix

## Why

`templates/web-nextjs/.npmrc` 有一行：

```
only-built-dependencies = @fission-ai/openspec,@parcel/watcher,...
```

`.npmrc` 只能存字符串，pnpm 把它映射成 `onlyBuiltDependencies` 的**字符串**，
而 `pnpm/action-setup` 的 self-installer 对它调 `.sort()`：

```
ERROR  onlyBuiltDependencies?.sort is not a function
```

**这不是推测。** 2026-08-17 用 `skills-registry` 模板（它从 `web-nextjs` 继承了同一行）
真建了第一个仓，它的 CI 第一跑就挂在这里，三道门全部 `skipped`。
`skills-registry` 那份已在 PR #35 修掉，`web-nextjs` 当时属那一刀的 Non-goal，只登记未修。

### 为什么至今没人撞到

**没有任何工作流会 scaffold `web-nextjs` 并在产物里跑 `pnpm install`。**
`template-validation.yml` 跑的是 `scripts/validate-template.sh`，它检查的是模板**源目录**，
不是脚手架产物。

所以这是一条**从未被真实 CI 跑过的路径**——「没人跑过」和「跑过且通过」，
在仪表盘上是同一个绿色。

## What

1. 删掉 `templates/web-nextjs/.npmrc` 里的 `only-built-dependencies` 行，
   留一段注释说明为什么不能写在这里。
2. 把该设置收敛到**唯一真正生效的一处**（见下）。
3. 关掉 `skills-registry-template` change 的 task 6.4（它登记的就是本条）。

### ⚠️ 范围扩大：我上一刀把 `skills-registry` 修成了静默失效

动手时实测才发现，这件事比 roadmap 条目写的更深一层：

```
pnpm config get only-built-dependencies --json   # 在 templates/web-nextjs 内
→ 12 条（应为 6）
```

**重复来自 `.npmrc`(6) + `pnpm-workspace.yaml`(6)。**
而 `package.json` 的 `pnpm.onlyBuiltDependencies` 贡献 **0**——
**pnpm 10 在 workspace 根不读它**（实测：只留它时 `config get` 返回空）。

这直接意味着：PR #35 我把 `skills-registry` 的"真源"留在 `package.json`，
**等于把这个设置静默关掉了**。它当时没暴露，是因为门不依赖那些原生依赖的构建脚本。

**故本刀扩大到两个模板**，统一收敛为：

| 位置                          | 处置            | 理由                                                     |
| ----------------------------- | --------------- | -------------------------------------------------------- |
| `pnpm-workspace.yaml`         | ✅ **唯一真源** | pnpm 10 实际读的就是它（实测 6 条 / 5 条）               |
| `.npmrc`                      | ❌ 删（留注释） | 只能存字符串，会被 `.sort()` 崩，且与上面拼接            |
| `package.json` 的 `pnpm` 字段 | ❌ 删           | workspace 根下**不生效**，留着是误导——上一刀正是被它误导 |

这是**范围扩大，不是顺手重构**：不修 `skills-registry` 就等于留下一个我亲手造成的、
比原缺陷更隐蔽的问题（原缺陷会让 CI 红，这个不会红、只是不生效）。

## Non-goals

- ❌ **不给 `web-nextjs` 补脚手架级 CI**——那是「让模板产物被真实跑一遍」这件更大的事，
  需要单独立项（`skills-registry` 已经有了这样一条工作流，可作为它的参照）。
  本刀只修这一行确定的缺陷，不顺手扩建。
- ❌ 不动 `web-nextjs` 的任何其它文件，不动 `game-web-phaser`。
- ❌ 不改 `scripts/validate-template.sh`。
- ❌ 不重新生成 `templates/web-nextjs/pnpm-lock.yaml`——该行不进 lockfile 的
  `settings` 块（已在 `skills-registry` 上实测：去掉它后 lockfile 无变化）。

## Trigger

`skills-registry` 的同款缺陷已被真实仓证实会导致 CI 完全跑不起来。
同一行还留在另一个正在被人使用的模板里。
