---
'@cogito.ai/cli': minor
---

`skills-registry` 模板新增第四道 CI 门：`scripts/gates/license-provenance.mjs`（`pnpm
gate:license-provenance`，已接入 `pnpm gates` 与 `.github/workflows/gates.yml`）。

既有三道门都不回答"我有没有权利发布这个 skill"：门①查结构合法、门②查 manifest 新鲜、门③查
有没有泄漏宿主自己的身份——第三方版权与宿主身份是正交的两件事，一份 `© <year> <holder>` 声明
里没有一个字符属于宿主，门③永远不会看它一眼。这道缺口是真实发生过的：三道门全绿、8 个 skill
被门③判为"干净"，逐个打开许可才发现其中 5 个不是自有内容（2 个供应商专有、3 个
Apache-2.0）——差一步把别人的专有内容推成公开 MIT 仓。

门④对每个 `skills/<name>/` 收集三类证据（目录内 `LICENSE*`/`NOTICE*` 文件、`SKILL.md`
frontmatter 的 `license` 字段、正文中的版权声明形状）并与新增的 `license-policy.json`
（仓库自身许可 + 允许转发的第三方许可白名单 + 已登记的转发 skill 列表，数据不是代码）比对。
默认保守：发现任何证据且未显式登记为"第三方转发"即失败；已登记的转发 skill 仍需声明许可在
白名单内、原始许可文件确实在场。不做法律判断，不自动改写许可，只指出证据与声明不一致，由人
处理。

选 **minor**：新增能力，向后兼容——已存在的 `skills-registry` 仓库升级 CLI 后需要补一份
`license-policy.json`（模板会随下一次 `agentdock init` 自带），门本身不回填历史仓库的配置。
