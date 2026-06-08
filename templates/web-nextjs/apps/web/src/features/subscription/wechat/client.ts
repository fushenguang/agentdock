'use client'

interface WechatPayResult {
  type: 'qrcode' | 'redirect'
  codeUrl?: string
  h5Url?: string
}

export async function initiateWechatPayment(
  paymentId: number,
  userId: string,
): Promise<WechatPayResult> {
  const res = await fetch('/api/payments/wechat/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, userId }),
  })

  if (!res.ok) {
    throw new Error('Failed to initiate WeChat payment')
  }

  const data = (await res.json()) as WechatPayResult

  if (data.type === 'qrcode' && data.codeUrl) {
    return { type: 'qrcode', codeUrl: data.codeUrl }
  } else if (data.type === 'redirect' && data.h5Url) {
    window.location.href = data.h5Url
    return { type: 'redirect', h5Url: data.h5Url }
  }

  throw new Error('Unexpected WeChat payment response')
}
