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
  return { id, label, kind, status, startedAt: now, finishedAt: now }
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

      return createResultEnvelope({
        status: 'ok',
        title:
          request.userText.length > 24 ? `${request.userText.slice(0, 24)}…` : request.userText,
        generated_at: new Date().toISOString(),
        result: {
          kind: 'summary',
          metrics: [
            { label: 'Domain', value: request.domainId },
            { label: 'Context', value: `${request.context.compactEntries.length} entries` },
            { label: 'Turn', value: 'ready to connect' },
          ],
        },
        follow_ups: ['Connect a provider driver', 'Add a domain-specific tool'],
      })
    },
  }
}
