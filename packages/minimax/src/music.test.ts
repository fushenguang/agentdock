import { describe, expect, it, vi } from 'vitest'

import { createMinimaxMusicClient, generateMusic } from './music.js'
import { classifyError } from './errors.js'

const AUDIO_HEX = '4f676753' // arbitrary bytes, hex-encoded ("OggS" magic, unrelated to real content)

function fakeFetch(status: number, body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })
}

describe('createMinimaxMusicClient / generateMusic (raw HTTP, no mmx-cli)', () => {
  it('POSTs to /v1/music_generation with Bearer auth and the forced request shape', async () => {
    const fetchImpl = fakeFetch(200, { base_resp: { status_code: 0 }, data: { audio: AUDIO_HEX } })
    const client = createMinimaxMusicClient({ apiKey: 'sk-test', fetchImpl: fetchImpl as unknown as typeof fetch })

    await generateMusic(client, { prompt: 'lofi beats', style: 'jazz' })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.minimax.io/v1/music_generation')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test')

    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect(body).toMatchObject({
      prompt: 'lofi beats',
      genre: 'jazz',
      is_instrumental: true,
      output_format: 'hex',
    })
  })

  it('respects a custom baseUrl', async () => {
    const fetchImpl = fakeFetch(200, { base_resp: { status_code: 0 }, data: { audio: AUDIO_HEX } })
    const client = createMinimaxMusicClient({
      apiKey: 'sk-test',
      baseUrl: 'https://api.minimaxi.com',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    await generateMusic(client, { prompt: 'x' })
    const [url] = fetchImpl.mock.calls[0] as [string]
    expect(url).toBe('https://api.minimaxi.com/v1/music_generation')
  })

  it('omits genre entirely when no style is given', async () => {
    const fetchImpl = fakeFetch(200, { base_resp: { status_code: 0 }, data: { audio: AUDIO_HEX } })
    const client = createMinimaxMusicClient({ apiKey: 'sk-test', fetchImpl: fetchImpl as unknown as typeof fetch })
    await generateMusic(client, { prompt: 'x' })
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect('genre' in body).toBe(false)
  })

  it('decodes the hex audio response into a Buffer with audio/mpeg content-type', async () => {
    const fetchImpl = fakeFetch(200, { base_resp: { status_code: 0 }, data: { audio: AUDIO_HEX } })
    const client = createMinimaxMusicClient({ apiKey: 'sk-test', fetchImpl: fetchImpl as unknown as typeof fetch })
    const asset = await generateMusic(client, { prompt: 'x' })
    expect(asset.buffer).toEqual(Buffer.from(AUDIO_HEX, 'hex'))
    expect(asset.contentType).toBe('audio/mpeg')
  })

  it('throws when the response has no audio data', async () => {
    const fetchImpl = fakeFetch(200, { base_resp: { status_code: 0 }, data: {} })
    const client = createMinimaxMusicClient({ apiKey: 'sk-test', fetchImpl: fetchImpl as unknown as typeof fetch })
    await expect(generateMusic(client, { prompt: 'x' })).rejects.toThrow(/no audio data/)
  })

  it('calls fetch exactly once (no automatic retry) even when the HTTP call rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))
    const client = createMinimaxMusicClient({ apiKey: 'sk-test', fetchImpl: fetchImpl as unknown as typeof fetch })
    await expect(generateMusic(client, { prompt: 'x' })).rejects.toThrow('network down')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('maps a 401 response to a minimax_auth error via classifyError', async () => {
    const fetchImpl = fakeFetch(401, { base_resp: { status_code: 1004, status_msg: 'auth failed' } })
    const client = createMinimaxMusicClient({ apiKey: 'sk-test', fetchImpl: fetchImpl as unknown as typeof fetch })
    let caught: unknown
    try {
      await generateMusic(client, { prompt: 'x' })
    } catch (err) {
      caught = err
    }
    expect(classifyError(caught)).toBe('minimax_auth')
  })

  it('maps a 429 response to a minimax_quota error via classifyError', async () => {
    const fetchImpl = fakeFetch(429, { base_resp: { status_code: 1013, status_msg: 'rate limited' } })
    const client = createMinimaxMusicClient({ apiKey: 'sk-test', fetchImpl: fetchImpl as unknown as typeof fetch })
    let caught: unknown
    try {
      await generateMusic(client, { prompt: 'x' })
    } catch (err) {
      caught = err
    }
    expect(classifyError(caught)).toBe('minimax_quota')
  })
})
