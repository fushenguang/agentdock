import { describe, expect, it, vi } from 'vitest'

import type { MinimaxClient } from './client.js'
import { generateVideoScarce } from './video.js'

function noopSleep(): Promise<void> {
  return Promise.resolve()
}

function fakeClient(overrides: {
  generate?: ReturnType<typeof vi.fn>
  getTask?: ReturnType<typeof vi.fn>
  retrieve?: ReturnType<typeof vi.fn>
}): MinimaxClient {
  return {
    image: { generate: vi.fn() },
    video: {
      generate: overrides.generate ?? vi.fn().mockResolvedValue({ taskId: 'task-1' }),
      getTask: overrides.getTask ?? vi.fn(),
    },
    file: { retrieve: overrides.retrieve ?? vi.fn() },
    quota: { info: vi.fn() },
  } as unknown as MinimaxClient
}

const VIDEO_BYTES = new Uint8Array([1, 2, 3, 4]).buffer

describe('generateVideoScarce', () => {
  it('generates async, polls through Queueing/Processing, and downloads bytes on Success', async () => {
    const generate = vi.fn().mockResolvedValue({ taskId: 'task-1' })
    const getTask = vi
      .fn()
      .mockResolvedValueOnce({ status: 'Queueing' })
      .mockResolvedValueOnce({ status: 'Processing' })
      .mockResolvedValueOnce({ status: 'Success', file_id: 'file-1' })
    const retrieve = vi.fn().mockResolvedValue({ file: { download_url: 'https://cdn.example/video.mp4' } })
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => VIDEO_BYTES })
    const client = fakeClient({ generate, getTask, retrieve })

    const asset = await generateVideoScarce(
      client,
      { prompt: 'a dragon flying' },
      { sleep: noopSleep, fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'a dragon flying', async: true }),
    )
    expect(generate).toHaveBeenCalledTimes(1)
    expect(getTask).toHaveBeenCalledTimes(3)
    expect(retrieve).toHaveBeenCalledWith('file-1')
    expect(fetchImpl).toHaveBeenCalledWith('https://cdn.example/video.mp4')
    expect(asset.buffer).toEqual(Buffer.from(VIDEO_BYTES))
    expect(asset.contentType).toBe('video/mp4')
  })

  it('defaults to model MiniMax-Hailuo-2.3', async () => {
    const generate = vi.fn().mockResolvedValue({ taskId: 'task-1' })
    const getTask = vi.fn().mockResolvedValue({ status: 'Success', file_id: 'file-1' })
    const retrieve = vi.fn().mockResolvedValue({ file: { download_url: 'https://cdn.example/v.mp4' } })
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => VIDEO_BYTES })
    const client = fakeClient({ generate, getTask, retrieve })

    await generateVideoScarce(
      client,
      { prompt: 'x' },
      { sleep: noopSleep, fetchImpl: fetchImpl as unknown as typeof fetch },
    )
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ model: 'MiniMax-Hailuo-2.3' }))
  })

  it('rejects when the task status is Failed, without retrying generate()', async () => {
    const generate = vi.fn().mockResolvedValue({ taskId: 'task-1' })
    const getTask = vi.fn().mockResolvedValue({ status: 'Failed' })
    const client = fakeClient({ generate, getTask })

    await expect(
      generateVideoScarce(client, { prompt: 'x' }, { sleep: noopSleep }),
    ).rejects.toThrow(/failed/i)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('rejects when Success has no file_id', async () => {
    const client = fakeClient({
      getTask: vi.fn().mockResolvedValue({ status: 'Success' }),
    })
    await expect(
      generateVideoScarce(client, { prompt: 'x' }, { sleep: noopSleep }),
    ).rejects.toThrow(/no file_id/)
  })

  it('rejects when the retrieved file has no download_url', async () => {
    const client = fakeClient({
      getTask: vi.fn().mockResolvedValue({ status: 'Success', file_id: 'file-1' }),
      retrieve: vi.fn().mockResolvedValue({ file: {} }),
    })
    await expect(
      generateVideoScarce(client, { prompt: 'x' }, { sleep: noopSleep }),
    ).rejects.toThrow(/no download_url/)
  })

  it('rejects once the deadline has passed instead of polling forever (timeoutMs: 0 forces the deadline check on the very first loop iteration)', async () => {
    const getTask = vi.fn().mockResolvedValue({ status: 'Processing' })
    const client = fakeClient({ getTask })
    await expect(
      generateVideoScarce(client, { prompt: 'x' }, { timeoutMs: 0, sleep: noopSleep }),
    ).rejects.toThrow(/did not finish within/)
    // Exactly one getTask call: the deadline check fires before any sleep
    // + re-poll, so this also proves the loop doesn't spin.
    expect(getTask).toHaveBeenCalledTimes(1)
  })

  /**
   * 🔴 Mutation-tested contrast with image/music (see `image.test.ts`'s and
   * `music.test.ts`'s matching "no automatic retry" cases): if
   * `generateVideoScarce` ever grows a retry loop around the initial
   * `generate()` call, this goes red. Video is capped at 3 requests/day —
   * retrying it automatically would silently burn that budget.
   */
  it('does not retry when video.generate() itself rejects', async () => {
    const generate = vi.fn().mockRejectedValue(new Error('platform error'))
    const client = fakeClient({ generate })
    await expect(
      generateVideoScarce(client, { prompt: 'x' }, { sleep: noopSleep }),
    ).rejects.toThrow('platform error')
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('does not retry when the final byte download fails', async () => {
    const getTask = vi.fn().mockResolvedValue({ status: 'Success', file_id: 'file-1' })
    const retrieve = vi.fn().mockResolvedValue({ file: { download_url: 'https://cdn.example/v.mp4' } })
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const client = fakeClient({ getTask, retrieve })

    await expect(
      generateVideoScarce(
        client,
        { prompt: 'x' },
        { sleep: noopSleep, fetchImpl: fetchImpl as unknown as typeof fetch },
      ),
    ).rejects.toThrow(/Failed to download/)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
