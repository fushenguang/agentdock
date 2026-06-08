import { AlipaySdk } from 'alipay-sdk'

const ALIPAY_APP_ID = process.env.ALIPAY_APP_ID
const ALIPAY_PRIVATE_KEY = process.env.ALIPAY_PRIVATE_KEY
const ALIPAY_PUBLIC_KEY = process.env.ALIPAY_PUBLIC_KEY
const ALIPAY_GATEWAY = process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do'

export interface AlipayPayParams {
  outTradeNo: string
  totalAmount: string
  subject: string
  body?: string
  returnUrl: string
  notifyUrl: string
}

export function getAlipaySDK(): AlipaySdk {
  if (!ALIPAY_APP_ID || !ALIPAY_PRIVATE_KEY || !ALIPAY_PUBLIC_KEY) {
    throw new Error(
      'Missing Alipay credentials. Ensure ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY, and ALIPAY_PUBLIC_KEY are set.',
    )
  }

  return new AlipaySdk({
    appId: ALIPAY_APP_ID,
    privateKey: ALIPAY_PRIVATE_KEY,
    signType: 'RSA2',
    alipayPublicKey: ALIPAY_PUBLIC_KEY,
    gateway: ALIPAY_GATEWAY,
    camelcase: true,
  })
}

export async function createAlipayPagePay(params: AlipayPayParams) {
  const alipay = getAlipaySDK()
  const result = await alipay.exec('alipay.trade.page.pay', {
    notify_url: params.notifyUrl,
    return_url: params.returnUrl,
    bizContent: {
      out_trade_no: params.outTradeNo,
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body,
      product_code: 'FAST_INSTANT_TRADE_PAY',
    },
  })

  return { formHtml: result }
}

export async function createAlipayWapPay(params: AlipayPayParams) {
  const alipay = getAlipaySDK()
  const result = await alipay.exec('alipay.trade.wap.pay', {
    notify_url: params.notifyUrl,
    return_url: params.returnUrl,
    bizContent: {
      out_trade_no: params.outTradeNo,
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body,
      product_code: 'QUICK_WAP_WAY',
    },
  })

  return { redirectUrl: (result as unknown as { url: string }).url }
}

export async function queryAlipayOrder(outTradeNo: string) {
  const alipay = getAlipaySDK()
  const result = await alipay.exec('alipay.trade.query', {
    bizContent: { out_trade_no: outTradeNo },
  })

  return result as unknown as {
    tradeStatus: string
    code: string
  }
}

export async function verifyAlipayNotify(formData: Record<string, unknown>) {
  const alipay = getAlipaySDK()
  return alipay.checkNotifySign(formData)
}
