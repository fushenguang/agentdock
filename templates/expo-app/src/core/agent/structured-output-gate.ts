import {
  AGENT_RESULT_SCHEMA_VERSION,
  agentResultEnvelopeSchema,
  type AgentResultEnvelope,
} from './agent-result'
import type { ZodError } from 'zod'

export const STRUCTURED_OUTPUT_FAILURES = {
  invalidJson: 'structured_output_invalid_json',
  validationFailed: 'structured_output_validation_failed',
  retriesExhausted: 'structured_output_retries_exhausted',
  providerFailed: 'structured_output_provider_failed',
} as const

export type StructuredOutputFailureCode =
  (typeof STRUCTURED_OUTPUT_FAILURES)[keyof typeof STRUCTURED_OUTPUT_FAILURES]

export interface StructuredOutputIssue {
  readonly path: string
  readonly message: string
}

export type StructuredOutputResult =
  | { readonly ok: true; readonly value: AgentResultEnvelope; readonly attempts: number }
  | {
      readonly ok: false
      readonly code: StructuredOutputFailureCode
      readonly attempts: number
      readonly issues: readonly StructuredOutputIssue[]
      readonly message: string
    }

export interface StructuredOutputRetryInstruction {
  readonly attempt: number
  readonly schemaVersion: string
  readonly issues: readonly StructuredOutputIssue[]
  readonly instruction: string
}

export type StructuredOutputProvider = (retry: StructuredOutputRetryInstruction) => Promise<unknown>

function stripJsonFence(input: string): string {
  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  return fenced?.[1]?.trim() ?? input.trim()
}

function extractJsonCandidate(input: unknown): unknown {
  if (typeof input !== 'string') return input
  const candidate = stripJsonFence(input)
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end <= start) return candidate
  return candidate.slice(start, end + 1)
}

function unwrapEnvelope(input: unknown): unknown {
  if (input !== null && typeof input === 'object' && 'agent_result' in input) {
    return (input as { agent_result: unknown }).agent_result
  }
  return input
}

function reviveOnly(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reviveOnly)
  if (value === null || typeof value !== 'object') {
    if (value === 'null') return null
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  }

  const output: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    output[key] = reviveOnly(item)
  }
  return output
}

function parseCandidate(
  candidate: unknown,
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (candidate !== null && typeof candidate !== 'string') return { ok: true, value: candidate }
  if (typeof candidate !== 'string')
    return { ok: false, message: 'Output is not JSON or an object.' }
  try {
    return { ok: true, value: JSON.parse(candidate) as unknown }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Invalid JSON output.' }
  }
}

function issuesFromZodError(error: ZodError): readonly StructuredOutputIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.map(String).join('.') : '$',
    message: issue.message,
  }))
}

export function validateStructuredOutput(rawOutput: unknown): StructuredOutputResult {
  const parsed = parseCandidate(extractJsonCandidate(rawOutput))
  if (!parsed.ok) {
    return {
      ok: false,
      code: STRUCTURED_OUTPUT_FAILURES.invalidJson,
      attempts: 1,
      issues: [{ path: '$', message: parsed.message }],
      message: parsed.message,
    }
  }

  const candidate = reviveOnly(unwrapEnvelope(parsed.value))
  const validated = agentResultEnvelopeSchema.safeParse(candidate)
  if (validated.success) {
    return { ok: true, value: validated.data, attempts: 1 }
  }

  const issues = issuesFromZodError(validated.error)
  return {
    ok: false,
    code: STRUCTURED_OUTPUT_FAILURES.validationFailed,
    attempts: 1,
    issues,
    message: issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '),
  }
}

export async function runStructuredOutputGate(
  provider: StructuredOutputProvider,
  options: { readonly maxAttempts?: number } = {},
): Promise<StructuredOutputResult> {
  const maxAttempts = Math.min(Math.max(options.maxAttempts ?? 3, 1), 3)
  let lastIssues: readonly StructuredOutputIssue[] = []

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const retry: StructuredOutputRetryInstruction = {
      attempt,
      schemaVersion: AGENT_RESULT_SCHEMA_VERSION,
      issues: lastIssues,
      instruction:
        attempt === 1
          ? 'Return only an agent_result JSON envelope conforming to schema version 1.0.'
          : 'Return corrected JSON only. Fix the listed fields; do not answer in prose.',
    }

    let output: unknown
    try {
      output = await provider(retry)
    } catch (error) {
      return {
        ok: false,
        code: STRUCTURED_OUTPUT_FAILURES.providerFailed,
        attempts: attempt,
        issues: [],
        message: error instanceof Error ? error.message : 'Provider failed.',
      }
    }

    const result = validateStructuredOutput(output)
    if (result.ok) return { ...result, attempts: attempt }
    lastIssues = result.issues
  }

  return {
    ok: false,
    code: STRUCTURED_OUTPUT_FAILURES.retriesExhausted,
    attempts: maxAttempts,
    issues: lastIssues,
    message: 'Structured output validation failed after every allowed attempt.',
  }
}
