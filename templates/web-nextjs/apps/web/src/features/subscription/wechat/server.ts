import { wxpayRequest } from '@/lib/wechat-pay/client'
import type { WechatPayConfig } from '@/lib/wechat-pay/types'
import { decryptResource, verifySignature } from '@/lib/wechat-pay/crypto'

export function getWechatPayConfig(): WechatPayConfig {
  const appId = process.env.WECHAT_PAY_APP_ID
  const mchId = process.env.WECHAT_PAY_MCH_ID
  const privateKey = process.env.WECHAT_PAY_PRIVATE_KEY
  const serialNo = process.env.WECHAT_PAY_SERIAL_NO
  const apiV3Key = process.env.WECHAT_PAY_API_V3_KEY
  const platformPublicKey = process.env.WECHAT_PAY_PLATFORM_PUBLIC_KEY
  const baseUrl = process.env.WECHAT_PAY_BASE_URL || 'https://api.mch.weixin.qq.com'
  const notifyUrl = process.env.WECHAT_PAY_NOTIFY_URL

  if (
    !appId ||
    !mchId ||
    !privateKey ||
    !serialNo ||
    !apiV3Key ||
    !platformPublicKey ||
    !notifyUrl
  ) {
    throw new Error(
      'Missing WeChat Pay credentials. Ensure all WECHAT_PAY_* environment variables are set.',
    )
  }

  return {
    appId,
    mchId,
    privateKey,
    serialNo,
    apiV3Key,
    platformPublicKey,
    baseUrl,
    notifyUrl,
  }
}

interface CreateWechatPayParams {
  description: string
  outTradeNo: string
  notifyUrl: string
  amount: { total: number; currency?: string }
  sceneInfo?: object
}

export async function createWechatNativePay(params: CreateWechatPayParams) {
  const config = getWechatPayConfig()
  const body = {
    appid: config.appId,
    mchid: config.mchId,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: params.amount,
  }

  return wxpayRequest<{ code_url: string }>({
    config,
    method: 'post',
    url: '/v3/pay/transactions/native',
    body,
  })
}

export async function createWechatH5Pay(params: CreateWechatPayParams) {
  const config = getWechatPayConfig()
  const body = {
    appid: config.appId,
    mchid: config.mchId,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: params.amount,
    scene_info: params.sceneInfo,
  }

  return wxpayRequest<{ h5_url: string }>({
    config,
    method: 'post',
    url: '/v3/pay/transactions/h5',
    body,
  })
}

export async function queryWechatOrder(outTradeNo: string) {
  const config = getWechatPayConfig()
  return wxpayRequest<{ trade_state: string }>({
    config,
    method: 'get',
    url: `/v3/pay/transactions/out-trade-no/${outTradeNo}`,
  })
}

export interface VerifyAndDecryptNotifyResult {
  outTradeNo: string
  tradeState: string
  transactionId: string
  amount: number
  currency: string
  appId: string
  mchId: string
}

export async function verifyAndDecryptNotify(
  headers: Record<string, string | undefined>,
  rawBody: string,
): Promise<VerifyAndDecryptNotifyResult> {
  const config = getWechatPayConfig()
  const timestamp = headers['wechatpay-timestamp'] || headers['Wechatpay-Timestamp'] || ''
  const nonce = headers['wechatpay-nonce'] || headers['Wechatpay-Nonce'] || ''
  const signature = headers['wechatpay-signature'] || headers['Wechatpay-Signature'] || ''

  const isValid = verifySignature({
    timestamp,
    nonce,
    body: rawBody,
    signature,
    platformPublicKey: config.platformPublicKey,
  })

  if (!isValid) {
    throw new Error('Invalid WeChat Pay signature')
  }

  const bodyData = JSON.parse(rawBody)
  const resource = bodyData.resource
  const decrypted = decryptResource({
    ciphertext: resource.ciphertext,
    associatedData: resource.associated_data,
    nonce: resource.nonce,
    apiV3Key: config.apiV3Key,
  })

  const transaction = JSON.parse(decrypted)
  return {
    outTradeNo: transaction.out_trade_no,
    tradeState: transaction.trade_state,
    transactionId: transaction.transaction_id,
    amount: transaction.amount?.total,
    currency: transaction.amount?.currency,
    appId: transaction.appid,
    mchId: transaction.mchid,
  }
}
