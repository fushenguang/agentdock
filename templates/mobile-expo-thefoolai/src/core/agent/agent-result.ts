import { z } from 'zod'

export const AGENT_RESULT_SCHEMA_VERSION = '1.0'

export const agentTableSchema = z.object({
  columns: z.array(z.object({ key: z.string(), label: z.string() })).min(1),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))),
})

export const agentMetricSchema = z.object({
  label: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  delta: z.string().optional(),
  state: z.enum(['neutral', 'positive', 'warning', 'negative']).optional(),
})

export const agentResultDataSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('summary'), metrics: z.array(agentMetricSchema).min(1) }),
  z.object({ kind: z.literal('table'), table: agentTableSchema }),
  z.object({ kind: z.literal('openui'), source: z.string().min(1) }),
  z.object({
    kind: z.literal('action-request'),
    message: z.string().min(1),
    confirmLabel: z.string().min(1),
    cancelLabel: z.string().min(1),
  }),
])

export const agentResultEnvelopeSchema = z.object({
  schema_version: z.literal(AGENT_RESULT_SCHEMA_VERSION),
  status: z.enum(['ok', 'needs-confirmation', 'error']),
  title: z.string().min(1),
  generated_at: z.string().datetime(),
  result: agentResultDataSchema,
  follow_ups: z.array(z.string()).default([]),
})

export type AgentResultEnvelope = z.infer<typeof agentResultEnvelopeSchema>
export type AgentResultData = z.infer<typeof agentResultDataSchema>
export type AgentMetric = z.infer<typeof agentMetricSchema>
export type AgentTable = z.infer<typeof agentTableSchema>

export function createResultEnvelope(
  value: Omit<AgentResultEnvelope, 'schema_version' | 'follow_ups'> &
    Partial<Pick<AgentResultEnvelope, 'follow_ups'>>,
): AgentResultEnvelope {
  return {
    schema_version: AGENT_RESULT_SCHEMA_VERSION,
    follow_ups: value.follow_ups ?? [],
    ...value,
  }
}
