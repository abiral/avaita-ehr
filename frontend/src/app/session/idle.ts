import { IDLE_LIMIT_MINUTES, LOCKED_LIMIT_MINUTES, type AccountKind } from '@/domain/identity'

export type IdleDecision = 'none' | 'lock' | 'end'

export interface IdleInput {
  readonly kind: AccountKind
  readonly status: 'active' | 'locked'
  readonly lastActivity: Date
  readonly lockedAt: Date | null
  readonly now: Date
}

const MINUTE = 60_000

/** Staff lock after 10 minutes, patients after 15; a lock older than 30 minutes ends the session. */
export function idleDecision({ kind, status, lastActivity, lockedAt, now }: IdleInput): IdleDecision {
  if (status === 'locked') {
    return lockedAt && now.getTime() - lockedAt.getTime() >= LOCKED_LIMIT_MINUTES * MINUTE ? 'end' : 'none'
  }
  return now.getTime() - lastActivity.getTime() >= IDLE_LIMIT_MINUTES[kind] * MINUTE ? 'lock' : 'none'
}
