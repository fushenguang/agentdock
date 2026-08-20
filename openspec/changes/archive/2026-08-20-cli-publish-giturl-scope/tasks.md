# Tasks · cli-publish-giturl-scope

> Twin-repo change. This copy (agentdock) covers §1 only — §2 (thefoolai web
> endpoint) and §3 (electron defense-in-depth) live in thefoolai's copy of
> this change and are implemented by a different agent, in parallel, in that
> repo. See thefoolai's `openspec/changes/cli-publish-giturl-scope/tasks.md`
> for the full five-section task list this was trimmed from.
>
> ⚠️ Release order: **server ships to prod first, CLI ships second** — the
> reverse would hand users a CLI that sends `path` before the server
> understands it. This change deliberately does **not** add a changeset or
> publish a release (see the parent instruction this change was scoped
> under) — that is a separate, later step once the server side is live.

## 1 · agentdock —— CLI 把 `path` 发出去

- [x] 1.1 `core/registryIndex.ts` 的请求体新增 `path`（来自 manifest entry 的同名字段）与分支
      — `RegistryIndexEntry` gained `path?: string` (omitted when the skill sits at
      the repo root, same "omit when empty" convention as `version`/`license`) and
      a required `branch: string`. `skillPublish.ts`'s `publishSkill()` forwards
      `entry.path` and the freshly-resolved `gitSource.branch` into `indexToRegistry()`.
- [x] 1.2 分支怎么取：确认 `skillPublish.ts` 现有的 registry checkout 里能不能拿到当前分支；
      **取不到时的兜底值要显式定义**（不要默默用 `main`——写死之前先确认 registry 仓库的默认分支
      是什么）
      — Added `resolveCurrentBranch()` in `skillPublish.ts`, using `git branch
      --show-current` (git ≥2.22) run from the same repo `resolveGitSource()` already
      reads the `origin` remote from (not a separate "registry checkout" — in the
      real publish flow the skill directory being published sits inside the same
      checkout that has the manifest, confirmed by this repo's own test fixtures'
      `makeSkillRepo()` shape). Returns the branch name, or the empty string in a
      detached-HEAD / no-commits-yet state, which triggers the fallback.
      **Fallback confirmed, not guessed**: verified the actual default branch of
      the registry this CLI publishes against (`fushenguang/thefool-skills`) via
      two independent checks on 2026-08-20 — `git ls-remote --symref
      https://github.com/fushenguang/thefool-skills.git HEAD` → `ref:
      refs/heads/main`, and `gh repo view fushenguang/thefool-skills --json
      defaultBranchRef` → `{"defaultBranchRef":{"name":"main"}}`. Both agree:
      `main`. Documented as a known gap in the code comment: a third-party fork
      with a different default branch, published from a detached-HEAD checkout,
      would get a wrong-but-safe guess — not a case that exists today.
- [x] 1.3 服务端返回「需要升级 CLI」这类错误时，human 与 agent 两个 adapter 都要给**可执行**的
      提示（明确说升级到哪个版本），不是回显 HTTP 状态码
      — `indexToRegistry()` now reads the response body on any non-2xx status
      (`extractErrorMessage`) and surfaces the server's own `message` field when
      present, instead of collapsing every failure to `HTTP <status>`. Added
      `describeIndexFailure()` (exported, unit-tested) as the single place both
      `adapters/skill/human.ts` and `adapters/skill/agent.ts` now route their
      "could not index" warning through: when the server already sent an
      actionable message, it's shown verbatim; when the failure degraded to a bare
      `HTTP <status>` (no usable body — old deployment, a proxy stripping it, or a
      case not yet covered), a generic-but-still-actionable CLI-side hint is
      appended (`npm install -g @cogito.ai/cli@latest`) rather than staying silent
      on what to do next.
      ⚠️ **Coordination gap, flagged rather than guessed past**: the exact wire
      shape of "server rejects because CLI is too old" (§2, thefoolai, built in
      parallel) wasn't available to read while this task was done. The chosen
      contract — non-2xx JSON body with a string `message` field — matches the
      *existing*, already-shipped convention in
      `apps/web/src/server/skills-publish-handler.ts`'s `badRequest()` helper
      (`{ error: <code>, message: <string> }`), so this is a reasoned bet on
      established precedent, not an arbitrary guess — but it has not been verified
      against the actual §2 implementation. Whoever finishes §2 should confirm the
      response shape matches (or update this side if it doesn't).
- [x] 1.4 单测：请求体确实带 `path`；服务端拒绝时 manifest **照写**、只告警（沿用既有边界：索引
      失败绝不回滚 manifest、绝不重试、绝不让 publish 挂死）
      — `registryIndex.test.ts`: body carries `path` when present / omits it when
      absent, carries `branch` always, server `message` extraction from a JSON
      error body vs. bare-status fallback, `describeIndexFailure()` unit coverage.
      `skillPublish.test.ts`: request body assertion updated to include `path`/
      `branch`; new tests for a non-default branch, a detached-HEAD fallback to
      `main`, and — the 1.4 case itself — a simulated server rejection (400 +
      JSON `message`) where the manifest is still written, `indexed: false`,
      `indexError` carries the actionable message, and the mock `fetch` is called
      exactly once (no retry).

## Known limitation carried forward (not this task's to resolve)

design.md's structural guarantee ("CLI 本来就是按单个 skill 目录发布的") assumes
`path` is always meaningful when present, but says nothing about the case
where the published skill directory **is** the repo root (`gitSource.path`
stays `undefined` — same as before this cut). In that case this CLI omits
`path` from the request entirely, same as an old (≤0.12.x) CLI would. §2's
"reject when `path` is missing" (design.md 方案 A) cannot distinguish
"old CLI" from "new CLI publishing a repo-root skill" from the request alone.
Flagging this for whoever implements §2 rather than silently assuming it's
covered — this change does not attempt to resolve it since it is a §2
(thefoolai) design decision.

---

## 归档说明（2026-08-20）

agentdock 这半（§1）已发布并验证：

- **实现**：PR #57（`feat/cli-publish-giturl-scope`，合并提交 `9cc5bca`，主提交
  `f6f07d6`）——`core/registryIndex.ts` 的 `RegistryIndexEntry` 新增 `path?`
  与必填 `branch`；`skillPublish.ts` 新增 `resolveCurrentBranch()`；非 2xx
  响应改读服务端 JSON body 的 `message`；两个 adapter 共用
  `describeIndexFailure()`；12 项新测试（合并提交里的完整清单见 §1.1–1.4）。
- **发版**：`@cogito.ai/cli@0.15.0` 已发布到 npm（changeset PR #59，合并提交
  `0607b1f`）。`npm view @cogito.ai/cli version` / `dist-tags` 均返回 `0.15.0`。

**以下四条验证是在 thefoolai 侧完成的，不是本仓验的**（本仓没有 prod registry
的读写权限，§2 服务端端点与 §4 electron 安装门都在 thefoolai）：

1. 用 0.15.0 发布 → prod registry 该行 `git_url` 带 `/tree/main/skills/<name>`
   子路径，`updated_at` 坐实是本次写入
2. 用 0.14.0（旧版）发布 → `HTTP 426` 拒绝，registry 行数不变、`updated_at`
   未被动
3. prod 无粗粒度 `git_url`（`NOT LIKE '%/tree/%'` 计数为 0）
4. 构建者真机确认：app 安装该 skill 后技能列表只多出它一个

thefoolai 那半的镜像 change（服务端端点 + electron 安装门）已在 thefoolai 侧
随 PR #220 归档。本刀（agentdock 半）随本次提交归档到
`openspec/changes/archive/2026-08-20-cli-publish-giturl-scope/`。
