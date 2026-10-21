import { CryptoDigestAlgorithm, CryptoEncoding, digestStringAsync } from 'expo-crypto'
import { requiresPermission, type PermissionBroker } from './permission'
import type {
  AgentAuditEvent,
  AgentToolSchemaNode,
  AgentToolDefinition,
  PermissionRequest,
  ToolRiskLevel,
} from './types'
import { newId } from '../../lib/id'

export class ToolPermissionDeniedError extends Error {
  constructor(
    readonly toolId: string,
    readonly risk: ToolRiskLevel,
  ) {
    super(`Permission denied for tool ${toolId}.`)
    this.name = 'ToolPermissionDeniedError'
  }
}

export interface ToolExecutionContext {
  readonly sessionId: string
  readonly turnId: string
  readonly permissionBroker: PermissionBroker
  readonly recordAudit: (event: AgentAuditEvent) => Promise<void>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function hasOwnKey(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function schemaTypeMatches(expected: readonly string[], value: unknown): boolean {
  return expected.some((type) => {
    if (type === 'object') return isPlainObject(value)
    if (type === 'array') return Array.isArray(value)
    if (type === 'null') return value === null
    if (type === 'string') return typeof value === 'string'
    if (type === 'number') return typeof value === 'number' && Number.isFinite(value)
    if (type === 'integer') {
      return typeof value === 'number' && Number.isInteger(value)
    }
    if (type === 'boolean') return typeof value === 'boolean'
    return false
  })
}

function validateJsonSchema(
  schema: AgentToolSchemaNode,
  value: unknown,
  path: string,
  depth: number,
): readonly string[] {
  if (depth > 8) return [`${path}: nested too deeply`]

  const errors: string[] = []
  if (schema.type !== undefined) {
    const expected = typeof schema.type === 'string' ? [schema.type] : schema.type
    if (!schemaTypeMatches(expected, value)) errors.push(`${path}: expected ${expected.join('|')}`)
  }
  if (schema.enum !== undefined && !schema.enum.some((option) => option === value)) {
    errors.push(`${path}: value is outside the allowed enum`)
  }
  if (Array.isArray(value)) {
    if (schema.items !== undefined) {
      for (const [index, item] of value.entries()) {
        errors.push(...validateJsonSchema(schema.items, item, `${path}[${index}]`, depth + 1))
      }
    }
    return errors
  }
  if (!isPlainObject(value)) return errors

  for (const key of schema.required ?? []) {
    if (!hasOwnKey(value, key)) errors.push(`${path}.${key}: required`)
  }
  for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
    if (hasOwnKey(value, key)) {
      errors.push(...validateJsonSchema(propertySchema, value[key], `${path}.${key}`, depth + 1))
    }
  }
  return errors
}

function validateToolInput(tool: AgentToolDefinition, input: unknown): void {
  const errors = validateJsonSchema(tool.inputSchema, input, '$', 0)
  if (errors.length > 0) throw new Error(`Invalid input for tool ${tool.id}: ${errors.join('; ')}`)
}

function stableSerialize(value: unknown, seen: WeakSet<object>, depth = 0): string {
  if (depth > 8) throw new Error('Tool input is nested too deeply.')
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error('Tool input contains a cycle.')
    seen.add(value)
    const serialized = `[${value.map((item) => stableSerialize(item, seen, depth + 1)).join(',')}]`
    seen.delete(value)
    return serialized
  }
  if (!isPlainObject(value)) {
    if (value === undefined) return 'null'
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      return JSON.stringify(value) ?? 'null'
    }
    throw new Error('Tool input must contain only JSON-compatible values.')
  }
  if (seen.has(value)) throw new Error('Tool input contains a cycle.')
  seen.add(value)
  const entries = Object.entries(value)
    .filter(([key]) => key !== '__proto__')
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
  const serialized = `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item, seen, depth + 1)}`)
    .join(',')}}`
  seen.delete(value)
  if (serialized.length > 64_000) throw new Error('Tool input is too large.')
  return serialized
}

export function createToolRegistry(
  tools: readonly AgentToolDefinition[],
): ReadonlyMap<string, AgentToolDefinition> {
  const registry = new Map<string, AgentToolDefinition>()
  for (const tool of tools) {
    if (registry.has(tool.id)) throw new Error(`Duplicate agent tool id: ${tool.id}`)
    registry.set(tool.id, tool)
  }
  return registry
}

function auditEvent(
  context: ToolExecutionContext,
  tool: AgentToolDefinition,
  type: 'tool-started' | 'tool-finished',
  outcome: Record<string, unknown>,
): AgentAuditEvent {
  return {
    id: newId(),
    sessionId: context.sessionId,
    turnId: context.turnId,
    type,
    payload: { toolId: tool.id, risk: tool.risk, ...outcome },
    createdAt: new Date().toISOString(),
  }
}

export async function executeRegisteredTool(
  registry: ReadonlyMap<string, AgentToolDefinition>,
  toolId: string,
  input: unknown,
  context: ToolExecutionContext,
): Promise<unknown> {
  const tool = registry.get(toolId)
  if (!tool) throw new Error(`Unknown tool: ${toolId}`)
  validateToolInput(tool, input)

  const inputDigest = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    stableSerialize(input, new WeakSet<object>(), 0),
    {
      encoding: CryptoEncoding.HEX,
    },
  )
  await context.recordAudit(auditEvent(context, tool, 'tool-started', { inputDigest }))

  let output: unknown
  try {
    if (requiresPermission(tool.risk)) {
      const request: PermissionRequest = {
        id: newId(),
        sessionId: context.sessionId,
        turnId: context.turnId,
        toolId: tool.id,
        reason: tool.description,
        risk: tool.risk,
        inputDigest,
      }
      const decision = await context.permissionBroker.request(request)
      if (decision.decision !== 'allowed') {
        throw new ToolPermissionDeniedError(tool.id, tool.risk)
      }
    }

    output = await tool.execute(input)
  } catch (error) {
    const outcome = error instanceof ToolPermissionDeniedError ? 'denied' : 'failed'
    await context.recordAudit(auditEvent(context, tool, 'tool-finished', { inputDigest, outcome }))
    throw error
  }

  await context.recordAudit(
    auditEvent(context, tool, 'tool-finished', { inputDigest, outcome: 'succeeded' }),
  )
  return output
}
