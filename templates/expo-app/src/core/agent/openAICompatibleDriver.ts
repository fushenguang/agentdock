import { AGENT_RESULT_SCHEMA_VERSION } from './agent-result'
import { createReferenceDriver } from './referenceDriver'
import {
  AgentTurnCancelledError,
  type AgentTurnDriver,
  type AgentTurnRequest,
  type AgentTurnStep,
} from './types'

const REQUEST_TIMEOUT_MS = 60_000

const AGENT_RESULT_SYSTEM_PROMPT = `You are a mobile agent. Return only one JSON object, with no Markdown fence and no prose.
The object must satisfy this TypeScript shape:
{
  schema_version: "${AGENT_RESULT_SCHEMA_VERSION}";
  status: "ok" | "needs-confirmation" | "error";
  title: string;
  generated_at: string; // RFC 3339 date-time
  result:
    | { kind: "summary"; metrics: Array<{ label: string; value: string | number; delta?: string; state?: "neutral" | "positive" | "warning" | "negative" }> }
    | { kind: "table"; table: { columns: Array<{ key: string; label: string }>; rows: Array<Record<string, string | number | boolean | null>> } }
    | { kind: "openui"; source: string }
    | { kind: "action-request"; message: string; confirmLabel: string; cancelLabel: string };
  follow_ups: string[];
}
Prefer concise, high-density metrics over prose. Respond in the user's language.`

function step(
  id: string,
  label: string,
  kind: AgentTurnStep['kind'],
  status: AgentTurnStep['status'] = 'succeeded',
): AgentTurnStep {
  const now = new Date().toISOString()
  return {
    id,
    label,
    kind,
    status,
    startedAt: now,
    ...(status === 'running' ? {} : { finishedAt: now }),
  }
}

function providerEndpoint(rawUrl: string): string {
  const url = new URL(rawUrl)
  const isLocalHttp =
    url.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase())

  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('Provider base URL must use HTTPS unless it is a localhost development proxy.')
  }
  if (url.search || url.hash) {
    throw new Error('Provider base URL must not include a query string or fragment.')
  }

  const basePath = url.pathname.replace(/\/+$/, '')
  url.pathname = basePath.endsWith('/chat/completions') ? basePath : `${basePath}/chat/completions`
  return url.toString()
}

function ensureActive(request: AgentTurnRequest): void {
  if (request.isCancelled?.()) throw new AgentTurnCancelledError()
}

interface OpenAIChatChoiceMessage {
  readonly content?: unknown
}

interface OpenAIChatResponse {
  readonly choices?: readonly {
    readonly message?: OpenAIChatChoiceMessage
  }[]
}

function contentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (part === null || typeof part !== 'object' || !('text' in part)) return ''
      const text = (part as { text?: unknown }).text
      return typeof text === 'string' ? text : ''
    })
    .join('')
}

function extractContent(rawResponse: string): string {
  let parsed: OpenAIChatResponse
  try {
    parsed = JSON.parse(rawResponse) as OpenAIChatResponse
  } catch {
    throw new Error('Provider returned a non-JSON response.')
  }
  if (parsed === null || typeof parsed !== 'object') {
    throw new Error('Provider returned an unexpected JSON payload.')
  }

  const content = parsed.choices?.[0]?.message?.content
  const text = contentText(content)

  if (text.length === 0) {
    throw new Error('Provider returned an empty completion.')
  }
  return text
}

async function readErrorMessage(response: Response): Promise<string> {
  const raw = await response.text()
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: unknown }; message?: unknown }
    const message = parsed.error?.message ?? parsed.message
    if (typeof message === 'string' && message.length > 0) return message
  } catch {
    // Return the raw response body below.
  }
  if (raw.length === 0) return `Provider failed with HTTP ${response.status}.`
  return raw.length > 500 ? `${raw.slice(0, 500)}…` : raw
}

export function createOpenAICompatibleDriver(options: {
  readonly baseURL: string
  readonly apiKey?: string | undefined
  readonly model: string
  readonly timeoutMs?: number
  readonly temperature?: number
  readonly maxTokens?: number
  readonly useJSONResponseFormat?: boolean
  readonly id?: string
}): AgentTurnDriver {
  const endpoint = providerEndpoint(options.baseURL)
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS

  return {
    id: options.id ?? `openai-compatible:${options.model}`,
    async run(request, observe = () => undefined) {
      ensureActive(request)
      observe(step(`${options.model}:call`, `Call ${options.model}`, 'tool', 'running'))

      let retryInstruction = ''
      const retry = request.retry
      if (retry !== undefined && retry.attempt > 1) {
        const issues = retry.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')
        retryInstruction = `\n\nA previous attempt failed schema validation. ${retry.instruction} Errors: ${issues}`
      }

      const controller = new AbortController()
      const cancellation = () => {
        if (request.isCancelled?.()) controller.abort()
      }
      const timer = request.isCancelled ? setInterval(cancellation, 200) : undefined
      let timedOut = false
      const timeout = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, timeoutMs)

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (options.apiKey) headers.Authorization = `Bearer ${options.apiKey}`

        const requestBody: Record<string, unknown> = {
          model: options.model,
          messages: [
            { role: 'system', content: AGENT_RESULT_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `${request.userText}${retryInstruction}`,
            },
          ],
          temperature: options.temperature ?? 0.1,
          max_tokens: options.maxTokens ?? 1600,
        }
        if (options.useJSONResponseFormat !== false) {
          requestBody.response_format = { type: 'json_object' }
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
        ensureActive(request)

        if (!response.ok) throw new Error(await readErrorMessage(response))
        const content = extractContent(await response.text())
        observe(step(`${options.model}:call`, `Call ${options.model}`, 'tool'))
        return content
      } catch (error) {
        if (request.isCancelled?.() || error instanceof AgentTurnCancelledError) {
          observe(step(`${options.model}:call`, `Call ${options.model}`, 'tool', 'skipped'))
          throw new AgentTurnCancelledError()
        }
        observe(step(`${options.model}:call`, `Call ${options.model}`, 'tool', 'failed'))
        if (timedOut) throw new Error(`Provider request timed out after ${timeoutMs}ms.`)
        throw error
      } finally {
        if (timer) clearInterval(timer)
        clearTimeout(timeout)
      }
    },
  }
}

export function createConfiguredDriver(): AgentTurnDriver {
  const baseURL = process.env.EXPO_PUBLIC_AGENT_BASE_URL
  const apiKey = __DEV__ ? process.env.EXPO_PUBLIC_AGENT_API_KEY : undefined
  const model = process.env.EXPO_PUBLIC_AGENT_MODEL

  if (!baseURL || !model) {
    console.warn(
      `Agent provider config incomplete (${
        !baseURL ? 'EXPO_PUBLIC_AGENT_BASE_URL' : 'EXPO_PUBLIC_AGENT_MODEL'
      }); using the local reference driver.`,
    )
    return createReferenceDriver()
  }

  if (__DEV__ && !apiKey) {
    console.warn(
      'No provider API key configured; treating EXPO_PUBLIC_AGENT_BASE_URL as an authenticated or open proxy.',
    )
  }

  try {
    return createOpenAICompatibleDriver({ baseURL, apiKey, model })
  } catch (error) {
    console.warn('Invalid agent provider URL; using the local reference driver.', error)
    return createReferenceDriver()
  }
}
