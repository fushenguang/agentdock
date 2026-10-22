import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

interface AgentTurnRequest {
  readonly userText: string
  readonly context: {
    readonly sessionId: string
    readonly domainId: string
    readonly locale: string
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
  readonly createReferenceDriver: () => {
    readonly id: string
    run(request: AgentTurnRequest): Promise<unknown>
  }
  readonly extractOpenAICompatibleContent: (rawResponse: string) => string
  readonly normalizeProviderEndpoint: (rawUrl: string) => string
}

const driverModuleUrl = new URL(
  '../../../../../templates/expo-app/src/core/agent/openAICompatibleDriver.js',
  import.meta.url,
).href

const cliPackageUrl = new URL('../../../package.json', import.meta.url)

const agentResultModuleUrl = new URL(
  '../../../../../templates/expo-app/src/core/agent/agent-result.js',
  import.meta.url,
).href

const agentBottomSheetUrl = new URL(
  '../../../../../templates/expo-app/src/components/agent/AgentBottomSheet.tsx',
  import.meta.url,
)

const appDrawerUrl = new URL(
  '../../../../../templates/expo-app/src/components/shell/AppDrawer.tsx',
  import.meta.url,
)

const workspaceShellUrl = new URL(
  '../../../../../templates/expo-app/src/components/shell/WorkspaceShell.tsx',
  import.meta.url,
)

const agentVoiceOrbUrl = new URL(
  '../../../../../templates/expo-app/src/components/agent/AgentVoiceOrb.tsx',
  import.meta.url,
)

const translationsModuleUrl = new URL(
  '../../../../../templates/expo-app/src/core/i18n/translations.js',
  import.meta.url,
).href

const sessionLifecycleModuleUrl = new URL(
  '../../../../../templates/expo-app/src/core/agent/sessionLifecycle.js',
  import.meta.url,
).href

const routeMapUrl = new URL(
  '../../../../../templates/expo-app/agent/route-map.json',
  import.meta.url,
)

const actionMapUrl = new URL(
  '../../../../../templates/expo-app/agent/action-map.json',
  import.meta.url,
)

interface AgentResultModule {
  readonly agentResultEnvelopeSchema: {
    safeParse(input: unknown): { readonly success: boolean }
  }
}

interface SessionLifecycleModule {
  readonly ACTIVE_SESSION_IDLE_TTL_MS: number
  readonly resolveActiveSession: (
    snapshot: { sessionId: string | undefined; closedAt: number | undefined },
    now?: number,
  ) => { sessionId: string | undefined; reason: string | undefined }
}

async function loadDriverModule(): Promise<ProviderDriverModule> {
  return (await import(driverModuleUrl)) as unknown as ProviderDriverModule
}

const REQUEST: AgentTurnRequest = {
  userText: 'Summarize today',
  context: {
    sessionId: 'session-1',
    domainId: 'thefoolai',
    locale: 'zh-CN',
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

describe('active session lifecycle', () => {
  it('reuses an active session until it has been collapsed for over five minutes', async () => {
    const lifecycle = (await import(sessionLifecycleModuleUrl)) as unknown as SessionLifecycleModule

    expect(lifecycle.ACTIVE_SESSION_IDLE_TTL_MS).toBe(5 * 60 * 1000)
    expect(
      lifecycle.resolveActiveSession({ sessionId: 'session-1', closedAt: 1_000 }, 301_000),
    ).toEqual({ sessionId: 'session-1', reason: undefined })
    expect(
      lifecycle.resolveActiveSession({ sessionId: 'session-1', closedAt: 1_000 }, 301_001),
    ).toEqual({ sessionId: undefined, reason: 'idle-timeout' })
  })

  it('automatically starts a session only when no active session remains', async () => {
    const lifecycle = (await import(sessionLifecycleModuleUrl)) as unknown as SessionLifecycleModule

    expect(lifecycle.resolveActiveSession({ sessionId: undefined, closedAt: undefined })).toEqual({
      sessionId: undefined,
      reason: 'no-active-session',
    })
    expect(lifecycle.resolveActiveSession({ sessionId: 'session-1', closedAt: undefined })).toEqual(
      { sessionId: 'session-1', reason: undefined },
    )
  })
})

describe('agent_result text presentation contract', () => {
  it('accepts a non-empty conversational text payload', async () => {
    const { agentResultEnvelopeSchema } = (await import(
      agentResultModuleUrl
    )) as unknown as AgentResultModule

    const result = agentResultEnvelopeSchema.safeParse({
      schema_version: '1.0',
      status: 'ok',
      title: 'Reply',
      generated_at: '2026-10-21T12:00:00.000Z',
      result: { kind: 'text', text: 'Hi! How can I help you today?' },
      follow_ups: [],
    })

    expect(result.success).toBe(true)
  })

  it('rejects an empty text payload before rendering', async () => {
    const { agentResultEnvelopeSchema } = (await import(
      agentResultModuleUrl
    )) as unknown as AgentResultModule

    const result = agentResultEnvelopeSchema.safeParse({
      schema_version: '1.0',
      status: 'ok',
      title: 'Reply',
      generated_at: '2026-10-21T12:00:00.000Z',
      result: { kind: 'text', text: '' },
      follow_ups: [],
    })

    expect(result.success).toBe(false)
  })
})

describe('expo-app machine-readable action map', () => {
  it('resolves every action to a registered route', () => {
    const routeMap = JSON.parse(readFileSync(routeMapUrl, 'utf8')) as {
      routes: Record<string, string>
    }
    const actionMap = JSON.parse(readFileSync(actionMapUrl, 'utf8')) as {
      actions: Record<string, { route: string }>
    }
    const routeIds = new Set(Object.keys(routeMap.routes))
    const unresolved = Object.entries(actionMap.actions).filter(
      ([actionId, action]) => !routeIds.has(action.route),
    )

    expect(unresolved).toEqual([])
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
    expect(body.messages[0]?.content).toContain('Preferred user-facing language: zh-CN.')
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

  it('carries prior turns in the active session as compact conversation context', async () => {
    const { createOpenAICompatibleDriver } = await loadDriverModule()
    let messages: { role: string; content: string }[] = []
    const driver = createOpenAICompatibleDriver({
      baseURL: 'https://provider.example/v1',
      model: 'test-model',
      fetchImpl: async (_url: string, init?: RequestInit) => {
        const body = JSON.parse(init?.body as string) as {
          messages: { role: string; content: string }[]
        }
        messages = body.messages
        return completionResponse('{}')
      },
    })

    await driver.run({
      ...REQUEST,
      context: {
        ...REQUEST.context,
        compactEntries: [
          { id: 'user-turn-1', summary: 'User asked: hello', tokenEstimate: 5 },
          { id: 'assistant-turn-1', summary: 'Agent answered: hi', tokenEstimate: 4 },
        ],
      },
    })

    expect(messages[1]).toMatchObject({
      role: 'system',
      content:
        'Conversation so far in the active session:\n- User asked: hello\n- Agent answered: hi',
    })
    expect(messages.at(-1)).toMatchObject({ role: 'user', content: 'Summarize today' })
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

  it('returns localized reference text for the default Chinese locale', async () => {
    const { createReferenceDriver } = await loadDriverModule()
    const output = await createReferenceDriver().run({
      ...REQUEST,
      userText: '你好',
    })

    expect(output).toMatchObject({
      result: { kind: 'text', text: '你好！今天需要我帮你做什么？' },
    })
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

describe('expo-app mobile acceptance layout', () => {
  it('uses a fixed 80% session sheet with a docked two-row prompt composer', () => {
    const source = readFileSync(agentBottomSheetUrl, 'utf8')

    expect(source).toContain('AGENT_SHEET_HEIGHT_PERCENT')
    expect(source).toContain('snapPoints={[`${AGENT_SHEET_HEIGHT_PERCENT}%`]}')
    expect(source).toContain('min-h-[78px]')
    expect(source).toContain('multiline')
    expect(source).toContain('testID="agent-send"')
    expect(source).toContain('name="send"')
    expect(source).toContain('name="pause"')
    expect(source).toContain('name="mic"')
    expect(source).toContain('paddingBottom: Math.max(insets.bottom, 16)')
    expect(source).toContain('flex-row w-full items-end')
    expect(source.indexOf('testID="agent-input"')).toBeLessThan(
      source.indexOf('testID="agent-send"'),
    )
    expect(source).not.toContain('absolute left-2')
    expect(source).not.toContain('absolute bottom-')
    expect(source).not.toContain('AgentStatusStrip')
    expect(source).not.toContain('agent-provider')
    expect(source).not.toContain('testID="agent-cancel"')
  })

  it('combines primary shortcuts and desktop indicators in one centered dock', () => {
    const source = readFileSync(workspaceShellUrl, 'utf8')
    const dockIndex = source.indexOf('testID="workspace-dock"')
    const drawerIndex = source.indexOf('testID="topbar-drawer"')
    const indicatorIndex = source.indexOf('testID="workspace-page-indicator"')
    const newSessionIndex = source.indexOf('testID="topbar-new-session"')

    expect(dockIndex).toBeGreaterThan(-1)
    expect(drawerIndex).toBeGreaterThan(dockIndex)
    expect(indicatorIndex).toBeGreaterThan(drawerIndex)
    expect(newSessionIndex).toBeGreaterThan(indicatorIndex)
    expect(source).toContain('absolute left-0 right-0 top-0')
    expect(source).toContain('className="flex-1 flex-row items-center justify-center gap-2 px-1"')
    expect(source).not.toContain('<BlurView')
    expect(source).toContain('<BrandBackdrop />')
  })

  it('keeps the floating agent orb icon-only', () => {
    const source = readFileSync(agentVoiceOrbUrl, 'utf8')

    expect(source).not.toContain('<Text')
    expect(source).not.toContain('>agent<')
  })

  it('keeps the animated drawer panel before its right-hand scrim', () => {
    const source = readFileSync(appDrawerUrl, 'utf8')
    const panelIndex = source.indexOf('testID="navigation-drawer"')
    const scrimIndex = source.indexOf("accessibilityLabel={t('drawer.close')}")

    expect(panelIndex).toBeGreaterThan(-1)
    expect(scrimIndex).toBeGreaterThan(panelIndex)
  })

  it('keeps drawer controls compact and unlabeled', () => {
    const source = readFileSync(appDrawerUrl, 'utf8')

    expect(source).not.toContain("t('drawer.domain')")
    expect(source).not.toContain("t('drawer.sessions')")
    expect(source).toContain('h-14 flex-row items-center')
    expect(source).toContain('h-11 w-11 items-center justify-center rounded-full bg-accentSoft')
  })

  it('defaults the bilingual interface to Simplified Chinese', async () => {
    const translations = (await import(translationsModuleUrl)) as unknown as {
      DEFAULT_INTERFACE_LANGUAGE: string
      TRANSLATIONS: Record<string, Record<string, string>>
    }

    expect(translations.DEFAULT_INTERFACE_LANGUAGE).toBe('zh-CN')
    expect(translations.TRANSLATIONS['zh-CN']?.['agent.title']).toBe('语音 Agent')
    expect(translations.TRANSLATIONS['en-US']?.['agent.title']).toBe('Voice agent')
  })
})
