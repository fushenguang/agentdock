import { buildAuthorizationHeader, generateNonce, signRequest } from './crypto'
import type { WechatPayConfig } from './types'

interface WxpayRequestParams<T = unknown> {
  config: WechatPayConfig
  method: string
  url: string
  body?: object
}

export async function wxpayRequest<T>(params: WxpayRequestParams): Promise<T> {
  const { config, method, url, body } = params
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = generateNonce()
  const bodyStr = body ? JSON.stringify(body) : ''

  const signature = signRequest({
    method,
    url,
    timestamp,
    nonce,
    body: bodyStr,
    privateKey: config.privateKey,
  })

  const authorization = buildAuthorizationHeader({
    mchId: config.mchId,
    serialNo: config.serialNo,
    timestamp,
    nonce,
    signature,
  })

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: authorization,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (compatible; WebNextjs/1.0)',
  }

  const res = await fetch(`${config.baseUrl}${url}`, {
    method: method.toUpperCase(),
    headers,
    body: bodyStr || null,
  })

  const data = (await res.json()) as T

  // Check for WeChat Pay API errors
  if (!res.ok) {
    const errorData = data as Record<string, unknown>
    const errorMessage =
      typeof errorData.message === 'string'
        ? errorData.message
        : `WeChat Pay API error: ${res.status}`
    const error = new Error(errorMessage)
    ;(error as Error & { code?: string; status?: number; raw?: unknown }).code = String(
      errorData.code || '',
    )
    ;(error as Error & { code?: string; status?: number; raw?: unknown }).status = res.status
    ;(error as Error & { code?: string; status?: number; raw?: unknown }).raw = errorData
    throw error
  }

  return data
}
