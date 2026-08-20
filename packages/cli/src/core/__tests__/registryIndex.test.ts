import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { indexToRegistry } from '../registryIndex.js'
import { CONFIG_DIR_NAME, CREDENTIALS_FILENAME } from '../auth.js'
import type { AuthProvider } from '../auth.js'

const PROVIDER: AuthProvider = { name: 'thefoolai', webUrl: 'https://web.example' }

const CREDENTIALS = {
  provider: 'thefoolai',
  userId: 'user-1',
  accessToken: 'secret-token-abc',
  savedAt: '2026-08-19T00:00:00.000Z',
}

const ENTRY = {
  skillId: 'my-skill',
  gitUrl: 'https://example.com/acme/my-skill',
  name: 'my-skill',
  description: 'A skill.',
  version: '1.0.0',
  license: 'MIT',
}

const created: string[] = []

/** A fake `~/.agentdock` home dir — with real credentials.json when `credentials` is passed, absent otherwise. */
function makeHome(label: string, credentials?: object): string {
  const dir = join(
    tmpdir(),
    `agentdock-registry-index-test-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  mkdirSync(join(dir, CONFIG_DIR_NAME), { recursive: true })
  if (credentials) {
    writeFileSync(join(dir, CONFIG_DIR_NAME, CREDENTIALS_FILENAME), JSON.stringify(credentials), 'utf-8')
  }
  created.push(dir)
  return dir
}

afterEach(() => {
  while (created.length) {
    const dir = created.pop()
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  }
})

describe('indexToRegistry', () => {
  it('does not attempt a request when nobody is signed in', async () => {
    const home = makeHome('anon')
    let called = false
    const fetchImpl = async (): Promise<Response> => {
      called = true
      return new Response('{}', { status: 200 })
    }

    const result = await indexToRegistry(ENTRY, {
      provider: PROVIDER,
      authEnv: { homeDir: home },
      fetchImpl,
    })

    expect(result).toEqual({ indexed: false, reason: 'ANONYMOUS' })
    expect(called).toBe(false)
  })

  it('POSTs { skill_id, git_url, name, description, version, license } with a Bearer token when signed in', async () => {
    const home = makeHome('signed', CREDENTIALS)
    let capturedUrl: string | undefined
    let capturedInit: RequestInit | undefined
    const fetchImpl = async (url: string, init?: RequestInit): Promise<Response> => {
      capturedUrl = url
      capturedInit = init
      return new Response('{}', { status: 200 })
    }

    const result = await indexToRegistry(ENTRY, {
      provider: PROVIDER,
      authEnv: { homeDir: home },
      fetchImpl,
    })

    expect(result).toEqual({ indexed: true })
    expect(capturedUrl).toBe('https://web.example/api/skills/publish')
    expect(capturedInit?.method).toBe('POST')
    const headers = capturedInit?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer secret-token-abc')
    expect(headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(capturedInit?.body as string)).toEqual({
      skill_id: 'my-skill',
      git_url: 'https://example.com/acme/my-skill',
      name: 'my-skill',
      description: 'A skill.',
      version: '1.0.0',
      license: 'MIT',
    })
  })

  it('does not emit a double slash when webUrl has a trailing slash', async () => {
    const home = makeHome('signed-slash', CREDENTIALS)
    let capturedUrl: string | undefined
    const fetchImpl = async (url: string): Promise<Response> => {
      capturedUrl = url
      return new Response('{}', { status: 200 })
    }

    await indexToRegistry(ENTRY, {
      provider: { ...PROVIDER, webUrl: 'https://web.example/' },
      authEnv: { homeDir: home },
      fetchImpl,
    })

    expect(capturedUrl).not.toContain('example//')
  })

  it('omits version and license from the body when the entry does not have them', async () => {
    const home = makeHome('signed-optional', CREDENTIALS)
    let capturedBody: Record<string, unknown> = {}
    const fetchImpl = async (_url: string, init?: RequestInit): Promise<Response> => {
      capturedBody = JSON.parse(init?.body as string)
      return new Response('{}', { status: 200 })
    }

    const { version, license, ...bare } = ENTRY
    void version
    void license
    await indexToRegistry(bare, { provider: PROVIDER, authEnv: { homeDir: home }, fetchImpl })

    expect(capturedBody).not.toHaveProperty('version')
    expect(capturedBody).not.toHaveProperty('license')
    expect(capturedBody).toEqual({
      skill_id: 'my-skill',
      git_url: 'https://example.com/acme/my-skill',
      name: 'my-skill',
      description: 'A skill.',
    })
  })

  // Reverse control (this cut's brief, constraint 5): the server assigns
  // access_tier / is_official / scan status — the client has no business
  // declaring them, and a body that included them would be exactly the
  // client-self-reported-scan bypass proposal.md's "核心安全问题" warns about.
  it('never sends access_tier / is_official / security_status', async () => {
    const home = makeHome('signed-noleak', CREDENTIALS)
    let capturedBody: Record<string, unknown> = {}
    const fetchImpl = async (_url: string, init?: RequestInit): Promise<Response> => {
      capturedBody = JSON.parse(init?.body as string)
      return new Response('{}', { status: 200 })
    }

    await indexToRegistry(ENTRY, { provider: PROVIDER, authEnv: { homeDir: home }, fetchImpl })

    expect(capturedBody).not.toHaveProperty('access_tier')
    expect(capturedBody).not.toHaveProperty('is_official')
    expect(capturedBody).not.toHaveProperty('security_status')
    expect(Object.keys(capturedBody).sort()).toEqual(
      ['description', 'git_url', 'license', 'name', 'skill_id', 'version'].sort(),
    )
  })

  it('turns a non-2xx status into a REQUEST_FAILED result instead of throwing', async () => {
    const home = makeHome('signed-404', CREDENTIALS)
    const fetchImpl = async (): Promise<Response> => new Response('not found', { status: 404 })

    const result = await indexToRegistry(ENTRY, { provider: PROVIDER, authEnv: { homeDir: home }, fetchImpl })

    expect(result).toEqual({ indexed: false, reason: 'REQUEST_FAILED', message: 'HTTP 404' })
  })

  it('turns a 500 into a REQUEST_FAILED result instead of throwing', async () => {
    const home = makeHome('signed-500', CREDENTIALS)
    const fetchImpl = async (): Promise<Response> => new Response('boom', { status: 500 })

    const result = await indexToRegistry(ENTRY, { provider: PROVIDER, authEnv: { homeDir: home }, fetchImpl })

    expect(result).toEqual({ indexed: false, reason: 'REQUEST_FAILED', message: 'HTTP 500' })
  })

  it('turns a network throw into a REQUEST_FAILED result instead of propagating', async () => {
    const home = makeHome('signed-throw', CREDENTIALS)
    const fetchImpl = async (): Promise<Response> => {
      throw new Error('ECONNRESET')
    }

    const result = await indexToRegistry(ENTRY, { provider: PROVIDER, authEnv: { homeDir: home }, fetchImpl })

    expect(result.indexed).toBe(false)
    if (result.indexed || result.reason !== 'REQUEST_FAILED') throw new Error('expected REQUEST_FAILED')
    expect(result.message).toContain('ECONNRESET')
  })

  // constraint 3: this is a one-shot call, not `pollForSession` — it must
  // time out on its own ceiling and must NEVER retry.
  it('times out instead of hanging forever, and calls fetch exactly once (no retry)', async () => {
    const home = makeHome('signed-timeout', CREDENTIALS)
    let callCount = 0
    const fetchImpl = (_url: string, init?: RequestInit): Promise<Response> => {
      callCount += 1
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('The operation was aborted.', 'AbortError')),
        )
      })
    }

    const result = await indexToRegistry(ENTRY, {
      provider: PROVIDER,
      authEnv: { homeDir: home },
      fetchImpl,
      timeoutMs: 20,
    })

    expect(result.indexed).toBe(false)
    if (result.indexed || result.reason !== 'REQUEST_FAILED') throw new Error('expected REQUEST_FAILED')
    expect(typeof result.message).toBe('string')
    expect(callCount).toBe(1)
  }, 2000)
})
