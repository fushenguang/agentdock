export const ACTIVE_SESSION_IDLE_TTL_MS = 5 * 60 * 1000

export type AutomaticSessionStartReason = 'no-active-session' | 'idle-timeout' | 'context-quality'

export interface ActiveSessionSnapshot {
  readonly sessionId: string | undefined
  readonly closedAt: number | undefined
}

export function resolveActiveSession(
  snapshot: ActiveSessionSnapshot,
  now = Date.now(),
): {
  readonly sessionId: string | undefined
  readonly reason: AutomaticSessionStartReason | undefined
} {
  if (!snapshot.sessionId) return { sessionId: undefined, reason: 'no-active-session' }
  if (snapshot.closedAt !== undefined && now - snapshot.closedAt > ACTIVE_SESSION_IDLE_TTL_MS) {
    return { sessionId: undefined, reason: 'idle-timeout' }
  }

  return { sessionId: snapshot.sessionId, reason: undefined }
}
