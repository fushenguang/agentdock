import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

interface AgentTurnRequest {
  readonly userText: string
  readonly context: {
    readonly sessionId: string
    readonly domainId: string
    readonly intentSummary: string
    readonly compactEntries: readonly unknown[]
    readonly totalTokenEstimate: number
  }
  readonly isCancelled?: () => boolean
}

interface ProviderDriverModule {
  readonly createConfiguredDriver: (options?: {
    readonly env?: Record<string, string | undefined>
    readonly isDevelopment?: boolean
    readonly fetchImpl?: (url: string, init: RequestInit) => Promise<Response>
  }) => { readonly id: string; run(request: AgentTurnRequest): Promise<unknown> }
  readonly createOpenAICompatibleDriver: (options: {
    readonly baseURL: string
    readonly apiKey?: string
    readonly model: string
    readonly timeoutMs?: number
    readonly useJSONResponseFormat?: boolean
    readonly fetchImpl?: (url: string, init: RequestInit) => Promise<Response>
  }) => { readonly id: string; run(request: AgentTurnRequest): Promise<unknown> }
  readonly extractOpenAICompatibleContent: (rawResponse: string) => string
  readonly normalizeProviderEndpoint: (rawUrl: string) => string
}

const driverModuleUrl = new URL(
  '../../../../../templates/expo-app/src/core/agent/openAICompatibleDriver.js',
  import.meta.url,
).href

const cliPackageUrl = new URL('../../../package.json', import.meta.url)

async function loadDriverModule(): Promise<ProviderDriverModule> {
  return (await import(driverModuleUrl)) as unknown as ProviderDriverModule
}

const REQUEST: AgentTurnRequest = {
  userText: 'Summarize today',
  context: {
    sessionId: 'session-1',
    domainId: 'thefoolai',
    intentSummary: 'Summarize today',
    compactEntries: [],
    totalTokenEstimate: 0,
  },
}

function completionResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

describe('normalizeProviderEndpoint', () => {
  it('appends the chat-completions path exactly once', async () => {
    const { normalizeProviderEndpoint } = await loadDriverModule()
    expect(normalizeProviderEndpoint('https://provider.example/v1/')).toBe(
      'https://provider.example/v1/chat/completions',
    )
    expect(normalizeProviderEndpoint('https://provider.example/v1/chat/completions')).toBe(
      'https://provider.example/v1/chat/completions',
    )
  })

  it('allows only HTTPS or an HTTP localhost proxy without URL extras', async () => {
    const { normalizeProviderEndpoint } = await loadDriverModule()
    expect(normalizeProviderEndpoint('http://127.0.0.1:8787/proxy')).toBe(
      'http://127.0.0.1:8787/proxy/chat/completions',
    )
    expect(() => normalizeProviderEndpoint('http://provider.example/v1')).toThrow(
      'Provider base URL must use HTTPS unless it is a localhost development proxy.',
    )
    expect(() => normalizeProviderEndpoint('https://user:secret@provider.example/v1')).toThrow(
      'Provider base URL must not include credentials.',
    )
    expect(() => normalizeProviderEndpoint('https://provider.example/v1?key=secret')).toThrow(
      'Provider base URL must not include a query string or fragment.',
    )
  })
})

describe('extractOpenAICompatibleContent', () => {
  it('reads string and multipart text content', async () => {
    const { extractOpenAICompatibleContent } = await loadDriverModule()
    expect(
      extractOpenAICompatibleContent(
        JSON.stringify({
          choices: [{ message: { content: [{ text: 'hello ' }, { text: 'world' }] } }],
        }),
      ),
    ).toBe('hello world')
  })

  it('rejects malformed provider JSON and empty completions explicitly', async () => {
    const { extractOpenAICompatibleContent } = await loadDriverModule()
    expect(() => extractOpenAICompatibleContent('not-json')).toThrow(
      'Provider returned a non-JSON response.',
    )
    expect(() => extractOpenAICompatibleContent(JSON.stringify({ choices: [] }))).toThrow(
      'Provider returned an empty completion.',
    )
  })
})

describe('createOpenAICompatibleDriver', () => {
  it('sends a JSON-mode chat completion without leaking the key into the body', async () => {
    const { createOpenAICompatibleDriver } = await loadDriverModule()
    let capturedUrl: string | undefined
    let capturedInit: RequestInit | undefined
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      capturedUrl = url
      capturedInit = init
      return completionResponse('{"ok":true}')
    })

    const driver = createOpenAICompatibleDriver({
      baseURL: 'https://provider.example/v1/',
      apiKey: 'test-provider-key',
      model: 'test-model',
      fetchImpl,
    })
    const output = await driver.run(REQUEST)

    expect(output).toBe('{"ok":true}')
    expect(capturedUrl).toBe('https://provider.example/v1/chat/completions')
    expect(capturedInit?.method).toBe('POST')
    const headers = capturedInit?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer test-provider-key')
    const body = JSON.parse(capturedInit?.body as string) as {
      model: string
      messages: { role: string; content: string }[]
      response_format?: { type: string }
    }
    expect(body.model).toBe('test-model')
    expect(body.messages[0]?.role).toBe('system')
    expect(body.messages[1]?.content).toBe('Summarize today')
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(JSON.stringify(body)).not.toContain('test-provider-key')
  })

  it('can disable native JSON mode for providers that reject it', async () => {
    const { createOpenAICompatibleDriver } = await loadDriverModule()
    let capturedBody: Record<string, unknown> = {}
    const driver = createOpenAICompatibleDriver({
      baseURL: 'https://provider.example/v1',
      model: 'test-model',
      useJSONResponseFormat: false,
      fetchImpl: async (_url: string, init?: RequestInit) => {
        capturedBody = JSON.parse(init?.body as string) as Record<string, unknown>
        return completionResponse('{}')
      },
    })

    await driver.run(REQUEST)
    expect(capturedBody.response_format).toBeUndefined()
  })

  it('fails closed when the provider response exceeds the transport safety limit', async () => {
    const { createOpenAICompatibleDriver } = await loadDriverModule()
    const driver = createOpenAICompatibleDriver({
      baseURL: 'https://provider.example/v1',
      model: 'test-model',
      fetchImpl: async () =>
        new Response('', {
          status: 200,
          headers: { 'content-length': '1000001' },
        }),
    })

    await expect(driver.run(REQUEST)).rejects.toThrow(
      'Provider response exceeded the 1,000,000-character safety limit.',
    )
  })

  it('aborts transport and reports a bounded timeout', async () => {
    const { createOpenAICompatibleDriver } = await loadDriverModule()
    const driver = createOpenAICompatibleDriver({
      baseURL: 'https://provider.example/v1',
      model: 'test-model',
      timeoutMs: 1,
      fetchImpl: (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('Aborted')))
        }),
    })

    await expect(driver.run(REQUEST)).rejects.toThrow('Provider request timed out after 1ms.')
  })

  it('checks cancellation before contacting the provider', async () => {
    const { createOpenAICompatibleDriver } = await loadDriverModule()
    let contacted = false
    const driver = createOpenAICompatibleDriver({
      baseURL: 'https://provider.example/v1',
      model: 'test-model',
      fetchImpl: async () => {
        contacted = true
        return completionResponse('{}')
      },
    })

    await expect(
      driver.run({
        ...REQUEST,
        isCancelled: () => true,
      }),
    ).rejects.toThrow('Agent turn was cancelled.')
    expect(contacted).toBe(false)
  })
})

describe('createConfiguredDriver', () => {
  it('uses the configured provider in development and trims credentials', async () => {
    const { createConfiguredDriver } = await loadDriverModule()
    const driver = createConfiguredDriver({
      env: {
        EXPO_PUBLIC_AGENT_BASE_URL: ' https://provider.example/v1 ',
        EXPO_PUBLIC_AGENT_API_KEY: ' test-provider-key ',
        EXPO_PUBLIC_AGENT_MODEL: ' test-model ',
      },
      isDevelopment: true,
      fetchImpl: async () => completionResponse('{}'),
    })

    expect(driver.id).toBe('openai-compatible:test-model')
  })

  it('keeps the public API key out of production requests', async () => {
    const { createConfiguredDriver } = await loadDriverModule()
    let authorization: unknown
    const driver = createConfiguredDriver({
      env: {
        EXPO_PUBLIC_AGENT_BASE_URL: 'https://provider.example/v1',
        EXPO_PUBLIC_AGENT_API_KEY: 'test-provider-key',
        EXPO_PUBLIC_AGENT_MODEL: 'test-model',
      },
      isDevelopment: false,
      fetchImpl: async (_url: string, init?: RequestInit) => {
        authorization = (init?.headers as Record<string, string>).Authorization
        return completionResponse('{}')
      },
    })

    await driver.run(REQUEST)
    expect(authorization).toBeUndefined()
  })

  it('falls back to the reference driver when provider configuration is incomplete', async () => {
    const { createConfiguredDriver } = await loadDriverModule()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      const driver = createConfiguredDriver({
        env: { EXPO_PUBLIC_AGENT_BASE_URL: 'https://provider.example/v1' },
        isDevelopment: true,
      })
      expect(driver.id).toBe('reference-local-v1')
      expect(warning).toHaveBeenCalledWith(expect.stringContaining('EXPO_PUBLIC_AGENT_MODEL'))
    } finally {
      warning.mockRestore()
    }
  })
})

describe('CLI template packaging', () => {
  it('excludes local Expo acceptance artifacts from the published template bundle', () => {
    const pkg = JSON.parse(readFileSync(cliPackageUrl, 'utf8')) as {
      scripts?: { build?: string }
    }

    expect(pkg.scripts?.build).toContain("--exclude='.expo/'")
    expect(pkg.scripts?.build).toContain("--exclude='ios/'")
    expect(pkg.scripts?.build).toContain("--exclude='android/'")
  })
})
