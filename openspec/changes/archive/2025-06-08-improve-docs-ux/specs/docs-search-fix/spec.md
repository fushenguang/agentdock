## MODIFIED Requirements

### Requirement: Search 支持中英文混合

`apps/docs/app/api/search/route.ts` MUST 配置 Orama 支持中文内容索引，使中文文档页面可被正确搜索。

当前问题：`language: 'english'` 导致中文文本按英文分词，中文关键词无法匹配。

修复方案：Fumadocs `createFromSource` 的 `language` 参数改为不指定语言（`undefined`）或改用 Orama 的通用分词器。Orama 在不指定 language 时使用简单的空格/标点分词，对中文文档（包含空格分隔的技术术语）效果可接受。

```ts
export const { GET } = createFromSource(source, {
  // 不指定 language，使用 Orama 通用分词器支持中英文混合
  // language: 'english',  // ← 移除此行
})
```

#### Scenario: 中文关键词搜索到中文文档

- **WHEN** 在 docs 搜索框输入"认证"或"仓储模式"
- **THEN** 相关中文文档页面出现在搜索结果中

#### Scenario: 英文关键词搜索仍然有效

- **WHEN** 输入 "auth" 或 "middleware"
- **THEN** 相关英文内容的文档页面出现在结果中

#### Scenario: 搜索框空状态不报错

- **WHEN** 打开搜索面板未输入任何内容
- **THEN** 显示默认提示（Fumadocs 内建行为），不报 JS 错误
