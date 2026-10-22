import { createResultEnvelope } from './agent-result'
import {
  AgentTurnCancelledError,
  type AgentTurnDriver,
  type AgentTurnRequest,
  type AgentTurnStep,
} from './types'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

function ensureActive(request: AgentTurnRequest): void {
  if (request.isCancelled?.()) throw new AgentTurnCancelledError()
}

export function createReferenceDriver(): AgentTurnDriver {
  return {
    id: 'reference-local-v1',
    async run(request, observe = () => undefined) {
      ensureActive(request)
      observe(step('understand', 'Understand request', 'reasoning', 'running'))
      await wait(150)
      ensureActive(request)
      observe(step('understand', 'Understand request', 'reasoning'))
      observe(step('domain', 'Read domain summary', 'tool', 'running'))
      await wait(220)
      ensureActive(request)
      observe(step('domain', 'Read domain summary', 'tool'))
      observe(step('schema', 'Validate result envelope', 'validation', 'running'))

      const isGreeting = /^(?:hi|hello|hey|你好|您好|嗨)[!.。]?$/.test(
        request.userText.trim().toLowerCase(),
      )
      const greeting =
        request.context.locale === 'en-US'
          ? 'Hi! How can I help you today?'
          : '你好！今天需要我帮你做什么？'
      const isEnglish = request.context.locale === 'en-US'
      const envelope = createResultEnvelope({
        status: 'ok',
        title: isGreeting
          ? 'Reply'
          : request.userText.length > 24
            ? `${request.userText.slice(0, 24)}…`
            : request.userText,
        generated_at: new Date().toISOString(),
        result: isGreeting
          ? { kind: 'text', text: greeting }
          : {
              kind: 'summary',
              metrics: [
                {
                  label: isEnglish ? 'Domain' : '领域',
                  value: request.context.domainId,
                },
                {
                  label: isEnglish ? 'Context' : '上下文',
                  value: isEnglish
                    ? `${request.context.compactEntries.length} entries`
                    : `${request.context.compactEntries.length} 条记录`,
                },
                {
                  label: isEnglish ? 'Turn' : 'Turn',
                  value: isEnglish ? 'ready to connect' : '可接入 provider',
                },
              ],
            },
        follow_ups: isEnglish
          ? ['Connect a provider driver', 'Add a domain-specific tool']
          : ['连接 provider driver', '添加领域工具'],
      })
      observe(step('schema', 'Validate result envelope', 'validation'))
      return envelope
    },
  }
}
