import { describe, expect, it, vi } from 'vitest'

import type { MinimaxClient } from './client.js'
import { generateImage, sniffImageContentType } from './image.js'

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0])
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0])

function fakeClient(imageBase64: string[]): { client: MinimaxClient; generate: ReturnType<typeof vi.fn> } {
  const generate = vi.fn().mockResolvedValue({ data: { image_base64: imageBase64 } })
  const client = {
    image: { generate },
    video: {
      generate: vi.fn(),
      getTask: vi.fn(),
    },
    file: { retrieve: vi.fn() },
    quota: { info: vi.fn() },
  } as unknown as MinimaxClient
  return { client, generate }
}

describe('sniffImageContentType', () => {
  it('detects PNG from magic bytes', () => {
    expect(sniffImageContentType(PNG_BYTES)).toBe('image/png')
  })

  it('detects JPEG from magic bytes', () => {
    expect(sniffImageContentType(JPEG_BYTES)).toBe('image/jpeg')
  })

  it('detects WEBP from magic bytes', () => {
    const webp = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WEBP', 'ascii'),
    ])
    expect(sniffImageContentType(webp)).toBe('image/webp')
  })

  it('falls back to image/jpeg for unrecognised signatures', () => {
    expect(sniffImageContentType(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]))).toBe('image/jpeg')
  })
})

describe('generateImage', () => {
  it('always forces response_format: base64', async () => {
    const { client, generate } = fakeClient([PNG_BYTES.toString('base64')])
    await generateImage(client, { prompt: 'a cat' })
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'a cat', response_format: 'base64' }),
    )
  })

  it('parses "<width>x<height>" size into width/height', async () => {
    const { client, generate } = fakeClient([PNG_BYTES.toString('base64')])
    await generateImage(client, { prompt: 'a cat', size: '1024x768' })
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ width: 1024, height: 768 }),
    )
  })

  it('rejects a malformed size', async () => {
    const { client } = fakeClient([])
    await expect(generateImage(client, { prompt: 'x', size: 'huge' })).rejects.toThrow(
      /Invalid size/,
    )
  })

  it('forwards n and returns one GeneratedAsset per candidate, each with a Buffer and sniffed content-type', async () => {
    const b64s = [PNG_BYTES.toString('base64'), JPEG_BYTES.toString('base64')]
    const { client, generate } = fakeClient(b64s)
    const assets = await generateImage(client, { prompt: 'two cats', n: 2 })
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ n: 2 }))
    expect(assets).toHaveLength(2)
    expect(assets[0]?.buffer).toEqual(PNG_BYTES)
    expect(assets[0]?.contentType).toBe('image/png')
    expect(assets[1]?.buffer).toEqual(JPEG_BYTES)
    expect(assets[1]?.contentType).toBe('image/jpeg')
  })

  it('throws when MiniMax returns no image_base64 data', async () => {
    const { client } = fakeClient([])
    await expect(generateImage(client, { prompt: 'x' })).rejects.toThrow(/no image_base64/)
  })

  it('calls image.generate exactly once (no automatic retry)', async () => {
    const { client, generate } = fakeClient([PNG_BYTES.toString('base64')])
    await generateImage(client, { prompt: 'a cat' })
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('does not retry when image.generate rejects', async () => {
    const generate = vi.fn().mockRejectedValue(new Error('boom'))
    const client = {
      image: { generate },
      video: { generate: vi.fn(), getTask: vi.fn() },
      file: { retrieve: vi.fn() },
      quota: { info: vi.fn() },
    } as unknown as MinimaxClient
    await expect(generateImage(client, { prompt: 'x' })).rejects.toThrow('boom')
    expect(generate).toHaveBeenCalledTimes(1)
  })
})
