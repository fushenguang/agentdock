---
'@cogito.ai/cli': minor
---

新增 `agentdock skill validate` / `agentdock skill publish` 命令

`skill validate <dir> [--json]` 全权委托官方参考实现 `skills-ref` 的 `validate()`
校验 Agent Skill frontmatter；非 spec 顶层键（如宿主私有的 `pipeline`）降级为
`warnings` 而非拒绝（`UNKNOWN_FIELDS_PREFIX` 前缀匹配），不强制上游未定义的私有
约定。`skill publish <dir> --registry <path>` 先跑 validate、不通过不产出，产出
的 manifest 条目写入 `--registry` 指定的**本地 registry checkout**（不 commit、
不 push、不建 PR，交由人工 review），`source` 字段从 skill 目录所在 git 仓库的
`origin` remote 自动解出；按 skill `name` 幂等更新，重复 publish 更新而非追加
重复条目。

新增外部依赖 `skills-ref`（纯 JS，`js-yaml`/`argparse`）；已验证仍可打进单文件
bundle 在零 `node_modules` 环境下运行（design.md §3.2、§6-2）。

选 **minor** 而非 patch：这是新增的 CLI 公开命令面（`skill` 子命令族），是向后
兼容的新能力，不是缺陷修复。
