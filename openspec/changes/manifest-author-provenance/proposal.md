---
roadmap-id: skills-hub-cli
---

# manifest-author-provenance

> 2026-08-19 给内容仓加第一个自有 skill 时撞出。**排在 `skill-spec-validator` 之前**——它比校验器更贴近「履历局」的核心。

## Why

manifest 条目里的 `author` **记录的是「谁跑了 publish」，不是「谁写了这个 skill」**。

对一个自称「**质检所 + 履历局**」的产品，这正好是反的：履历要挂在**创作者**身上，不是挂在**最后一个跑脚本的人**身上。

### 这不是理论问题，它马上就要造成实际损坏

内容仓 `thefool-skills` 的门② 用 `scripts/gates/manifest-fresh.mjs` 保持 manifest 新鲜，而它的 `republishAll()` 是**把每个 `skills/*` 目录全量重发一遍**。

⇒ 一旦内容仓把 `@cogito.ai/cli` 从当前钉住的 `^0.8.1` 升到会写 `author` 的版本，**任何一次 `pnpm skills:sync` 都会把执行者盖成全部 skill 的作者**——包括 `lesson-prep`，那是一位真实老师的方法论。

**静默改写他人作品的归属**，而且是通过一条例行的"保持 manifest 新鲜"的命令。

### 规范早就给了正确答案

[规范](https://agentskills.io/specification)自己的示例：

```yaml
metadata:
  author: example-org      ← 作者是 skill 自身的属性
  version: "1.0"
```

作者写在 skill 里，跟着 skill 走；**登录身份是"谁把它发上来的"，是另一件事**。现在这两件事被合成了一个字段，值取的还是后者。

## What Changes

把一个字段拆成两个，各自语义清晰：

| 字段 | 含义 | 来源 |
|---|---|---|
| `author` | **谁写的** | skill 自己的 `metadata.author`（规范认可的位置）；缺失就**不写该字段** |
| `publishedBy` | **谁发的** | CLI 的登录身份（`{ id, name }`，即今天 `author` 的现有取值）|

1. `SkillManifestEntry`：`author` 改为从 `metadata.author` 读取的字符串；新增 `publishedBy?: { id, name }`
2. `publish` 时若 skill 没有 `metadata.author` → **告警并指出规范位置**（与缺 `version` 的处理一致：可选但告警，不阻断）
3. 迁移面极小：内容仓当前钉在 CLI 0.8.1，**manifest 里还没有任何 `author` 字段**——现在改，成本几乎为零；等升级完再改就要改写既有数据
4. 文档写清两者区别，并说明**为什么 `author` 不取登录身份**（这是最容易被"顺手实现"错的地方）

## Non-goals

- **不做作者身份验证**——`metadata.author` 是作者自己声明的字符串，我们不校验它是不是真的那个人。可信度由履历与 channel 分级承担，不由这个字段承担
- **不改内容仓的 CLI 版本钉**——那是内容仓的事，且应在本刀落地**之后**再做（顺序反了就会污染既有条目）
- **不做 `metadata.author` 的格式约束**：规范只说是字符串，我们不额外发明格式（同 [只实现规范](../../../apps/wiki/content/docs/engineering/spec-only-report-dont-adapt) 的规则）
- 不动 `skill-usage-attribution` 那套运行期归因——那是"谁在用"，本刀是"谁写的"

## 验收判据

- skill 带 `metadata.author` → manifest 里 `author` 是那个字符串；`publishedBy` 是当前登录者
- **反向对照 ①**：skill **不带** `metadata.author` → manifest **没有 `author` 字段**（不是 `null`、不是登录者名字），且终端有告警
- **反向对照 ②**：未登录时 publish → 既没有 `author` 也没有 `publishedBy`，且两条字段都不出现
- **反向对照 ③（本刀的核心）**：在内容仓对**全部** skill 跑一次全量重发 → **既有条目的 `author` 一个都没被改写**
