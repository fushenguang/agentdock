## ADDED Requirements

### Requirement: 微信支付完整文档

`apps/docs/content/docs/zh/templates/web-nextjs/wechat-pay.mdx` MUST 提供微信 Native 扫码支付和 H5 手机网站支付的完整集成文档。

文档 MUST 包含：

- Mermaid 技术架构图（flowchart）和支付时序图（sequenceDiagram，含前端轮询）
- 准备工作（6 个步骤：注册商户、开通 Native 支付、配置 API v3 密钥、下载证书、获取平台证书、准备环境变量）
- 环境变量配置（含 `WECHAT_PAY_PRIVATE_KEY` PKCS8 格式说明）
- 开发环境调试（内网穿透、Native 支付调试流程、H5 限制说明）
- 生产环境配置
- 安全注意事项（私钥保护、回调验签、AEAD_AES_256_GCM 解密、幂等性、时间戳有效期）
- 常见问题（5 个 FAQ）

#### Scenario: wechat-pay.mdx 中 Mermaid 图表正常渲染

- **WHEN** 访问 `/zh/docs/templates/web-nextjs/wechat-pay`
- **THEN** 页面加载后出现技术架构图（flowchart）和支付时序图（sequenceDiagram）的 SVG 图形

#### Scenario: 微信支付文档步骤完整可操作

- **WHEN** 新手按文档步骤操作
- **THEN** 可完成从注册微信商户到 Native 支付调试全流程
