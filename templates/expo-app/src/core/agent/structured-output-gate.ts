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

function looksLikeEnvelope(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false
  return (
    'agent_result' in value || ('schema_version' in value && 'result' in value && 'title' in value)
  )
}

function parseBalancedObjects(input: string): readonly unknown[] {
  const candidates: unknown[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]
    if (character === undefined) continue

    if (escaped) {
      escaped = false
      continue
    }
    if (character === '\\') {
      escaped = true
      continue
    }
    if (character === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (character === '{') {
      if (depth === 0) start = index
      depth += 1
      continue
    }
    if (character !== '}' || depth === 0) continue

    depth -= 1
    if (depth !== 0 || start < 0) continue
    try {
      candidates.push(JSON.parse(input.slice(start, index + 1)) as unknown)
    } catch {
      // A malformed balanced span is not JSON; try later spans.
    }
    start = -1
  }

  return candidates
}

function extractJsonCandidate(input: unknown): unknown {
  if (typeof input !== 'string') return input
  const candidate = stripJsonFence(input)
  try {
    return JSON.parse(candidate) as unknown
  } catch {
    const objects = parseBalancedObjects(candidate)
    const envelope = objects.find(looksLikeEnvelope) ?? objects[0]
    if (envelope !== undefined) return envelope

    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    return start !== -1 && end > start ? candidate.slice(start, end + 1) : candidate
  }
}

function unwrapEnvelope(input: unknown): unknown {
  if (input !== null && typeof input === 'object' && 'agent_result' in input) {
    return (input as { agent_result: unknown }).agent_result
  }
  return input
}

/** Preserve parsed values while neutralizing a provider-controlled `__proto__` key. */
function safeClone(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(safeClone)
  if (value instanceof Date) return value.toISOString()
  if (value === null || typeof value !== 'object') return value

  const output: Record<string, unknown> = Object.create(null)
  for (const [key, item] of Object.entries(value)) {
    if (key === '__proto__') continue
    output[key] = safeClone(item)
  }
  return output
}

function parseCandidate(
  candidate: unknown,
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (candidate !== null && typeof candidate !== 'string') return { ok: true, value: candidate }
  if (typeof candidate !== 'string') {
    return { ok: false, message: 'Output is not JSON or an object.' }
  }
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

  const candidate = safeClone(unwrapEnvelope(parsed.value))
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
  options: {
    readonly maxAttempts?: number
    readonly propagateProviderError?: (error: unknown) => boolean
  } = {},
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
          ? `Return only an agent_result JSON envelope conforming to schema version ${AGENT_RESULT_SCHEMA_VERSION}.`
          : 'Return corrected JSON only. Fix the listed fields; do not answer in prose.',
    }

    let output: unknown
    try {
      output = await provider(retry)
    } catch (error) {
      if (options.propagateProviderError?.(error)) throw error
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
