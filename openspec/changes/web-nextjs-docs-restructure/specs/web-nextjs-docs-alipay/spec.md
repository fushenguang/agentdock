## ADDED Requirements

### Requirement: 支付宝支付完整文档

`apps/docs/content/docs/zh/templates/web-nextjs/alipay.mdx` MUST 提供支付宝 PC 网页支付和 H5 手机网站支付的完整集成文档。

文档 MUST 包含：

- Mermaid 技术架构图（flowchart）和支付时序图（sequenceDiagram），展示从用户点击到异步通知的完整流程
- 准备工作（6 个步骤：注册、创建应用、申请产品、配置密钥、获取信息、配置回调 URL）
- 环境变量配置（含注释和来源说明）
- 沙箱环境调试（含内网穿透配置 natApp、完整测试流程）
- 生产环境配置
- 安全注意事项（私钥保护、回调验签、幂等性、金额精度、HTTPS 强制）
- 常见问题（6 个 FAQ）

#### Scenario: alipay.mdx 中 Mermaid 图表正常渲染

- **WHEN** 访问 `/zh/docs/templates/web-nextjs/alipay`
- **THEN** 页面加载后出现技术架构图（flowchart）和支付时序图（sequenceDiagram）的 SVG 图形

#### Scenario: 支付宝文档步骤完整可操作

- **WHEN** 新手按文档步骤操作
- **THEN** 可完成从注册支付宝商家到沙箱支付全流程
