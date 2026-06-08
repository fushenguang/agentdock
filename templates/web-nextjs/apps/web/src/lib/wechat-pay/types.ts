export interface WechatPayConfig {
  appId: string
  mchId: string
  privateKey: string // PKCS8 PEM format merchant private key
  serialNo: string // Merchant certificate serial number
  apiV3Key: string // 32-byte APIv3 key
  platformPublicKey: string // WeChat platform public key PEM (downloaded from /v3/certificates)
  baseUrl: string // Domestic: https://api.mch.weixin.qq.com; Overseas: https://apihk.mch.weixin.qq.com
  notifyUrl: string
}
