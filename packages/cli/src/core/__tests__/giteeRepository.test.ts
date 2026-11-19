import { afterEach, describe, expect, it, vi } from 'vitest'
import { deliverGiteeRepository, giteeTarget } from '../giteeRepository.js'

const target = giteeTarget({ provider: 'gitee', namespace: 'enterprise:example' }, 'dp-design')!
const repo = {
  id: 123,
  full_name: 'example/dp-design',
  description: 'Created by AgentDock (operation)',
  private: true,
  default_branch: 'main',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Gitee delivery', () => {
  it('recovers when create and push succeeded but both responses were lost', async () => {
    vi.stubEnv('GITEE_TOKEN', 'test-token')
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(Response.json(repo))
      .mockResolvedValueOnce(Response.json(repo))
    vi.stubGlobal('fetch', fetch)
    const git = vi
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockImplementationOnce(() => {
        throw new Error('timeout')
      })
      .mockReturnValue('abc\trefs/heads/main')
    const record = vi.fn()
    await expect(
      deliverGiteeRepository(target, 'operation', 'abc', undefined, git, record),
    ).resolves.toMatchObject({ id: 123, cloneUrl: target.url })
    expect(record).toHaveBeenCalledWith(123)
    expect(fetch.mock.calls[1]?.[1].body.get('private')).toBe('0')
    expect(git).toHaveBeenCalledWith('git', ['push', target.url, 'abc:refs/heads/main'])
  })

  it('leaves an unrelated repository untouched even if the path and visibility match', async () => {
    vi.stubEnv('GITEE_TOKEN', 'test-token')
    const fetch = vi.fn().mockResolvedValue(Response.json({ ...repo, description: 'Someone else' }))
    vi.stubGlobal('fetch', fetch)
    const git = vi.fn()
    await expect(
      deliverGiteeRepository(target, 'operation', 'abc', undefined, git, vi.fn()),
    ).rejects.toThrow('ownership')
    expect(git).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sets the default branch after verifying the only remote ref', async () => {
    vi.stubEnv('GITEE_TOKEN', 'test-token')
    const lookup = vi
      .fn()
      .mockResolvedValueOnce(Response.json(repo))
      .mockResolvedValueOnce(Response.json({ ...repo, default_branch: null }))
      .mockResolvedValueOnce(Response.json(repo))
      .mockResolvedValueOnce(Response.json(repo))
    vi.stubGlobal('fetch', lookup)
    const git = vi.fn().mockReturnValueOnce(target.url).mockReturnValue('abc\trefs/heads/main')
    await deliverGiteeRepository(target, 'operation', 'abc', repo.id, git, vi.fn())
    expect(lookup.mock.calls[2]?.[1].method).toBe('PATCH')
    expect(lookup.mock.calls[2]?.[1].body.get('default_branch')).toBe('main')
  })
})
