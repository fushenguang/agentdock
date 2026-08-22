export type {
  CreateMinimaxClientOptions,
  MinimaxClient,
  MinimaxQuotaModelRemain,
  MinimaxQuotaResponse,
} from './client.js'
export { createMinimaxClient } from './client.js'

export { classifyError, MMX_EXIT_CODE } from './errors.js'
export type { MinimaxErrorCategory } from './errors.js'

export { generateImage, sniffImageContentType } from './image.js'
export type { GenerateImageParams } from './image.js'

export { createMinimaxMusicClient, generateMusic } from './music.js'
export type {
  CreateMinimaxMusicClientOptions,
  GenerateMusicParams,
  MinimaxMusicClient,
} from './music.js'

export { generateVideoScarce } from './video.js'
export type { GenerateVideoOptions, GenerateVideoParams } from './video.js'

export { getQuota, isQuotaExhausted, msUntilReset } from './quota.js'

export type { GeneratedAsset } from './types.js'
