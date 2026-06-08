import crypto from 'crypto'

/**
 * Generates a random nonce string (16 hex chars, uppercase)
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex').toUpperCase()
}

interface SignRequestParams {
  method: string
  url: string
  timestamp: string
  nonce: string
  body: string
  privateKey: string
}

/**
 * Constructs the -line signature string and signs it with SHA256withRSA using the merchant private key.
 * Returns Base64 encoded signature.
 */
export function signRequest(params: SignRequestParams): string {
  const { method, url, timestamp, nonce, body, privateKey } = params
  const signStr = `${method.toUpperCase()}\n${url}\n${timestamp}\n${nonce}\n${body}\n`

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signStr)
  return signer.sign(privateKey, 'base64')
}

interface BuildAuthorizationHeaderParams {
  mchId: string
  serialNo: string
  timestamp: string
  nonce: string
  signature: string
}

/**
 * Builds the Authorization header for WeChat Pay V3 API requests.
 */
export function buildAuthorizationHeader(params: BuildAuthorizationHeaderParams): string {
  const { mchId, serialNo, timestamp, nonce, signature } = params
  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`
}

interface VerifySignatureParams {
  timestamp: string
  nonce: string
  body: string
  signature: string
  platformPublicKey: string
}

/**
 * Verifies WeChat Pay notification signature using the platform public key.
 */
export function verifySignature(params: VerifySignatureParams): boolean {
  const { timestamp, nonce, body, signature, platformPublicKey } = params
  const verifyStr = `${timestamp}\n${nonce}\n${body}\n`

  const verifier = crypto.createVerify('RSA-SHA256')
  verifier.update(verifyStr)
  return verifier.verify(platformPublicKey, signature, 'base64')
}

interface DecryptResourceParams {
  ciphertext: string
  associatedData: string
  nonce: string
  apiV3Key: string
}

/**
 * Decrypts AEAD_AES_256_GCM encrypted resource.
 * The ciphertext includes the auth tag as the last 16 bytes.
 */
export function decryptResource(params: DecryptResourceParams): string {
  const { ciphertext, associatedData, nonce, apiV3Key } = params
  const buf = Buffer.from(ciphertext, 'base64')

  // AES-256-GCM: last 16 bytes are the auth tag
  const authTagLength = 16
  const encrypted = buf.slice(0, -authTagLength)
  const authTag = buf.slice(-authTagLength)

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(apiV3Key),
    Buffer.from(nonce, 'utf8'),
  )
  decipher.setAuthTag(authTag)
  decipher.setAAD(Buffer.from(associatedData))

  let decrypted = decipher.update(encrypted, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
