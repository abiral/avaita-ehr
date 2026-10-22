import type { Session } from '@/domain/identity'
import { sessionReducer, type SessionAction, type SessionState } from './sessionState'

export interface SessionStore {
  readonly get: () => SessionState
  readonly dispatch: (action: SessionAction) => void
  readonly subscribe: (fn: () => void) => () => void
  /** Resolves once the initial session check has finished. */
  readonly ready: () => Promise<SessionState>
  readonly csrfToken: () => string | null
}

/** External store so route loaders (guards) and React read the same session. */
export function createSessionStore(): SessionStore {
  const box: { state: SessionState } = { state: { status: 'loading' } }
  const listeners = new Set<() => void>()
  const waiters: ((s: SessionState) => void)[] = []
  const flush = () => {
    if (box.state.status === 'loading') return
    for (const w of waiters.splice(0)) w(box.state)
  }
  return {
    get: () => box.state,
    dispatch: (action) => {
      const next = sessionReducer(box.state, action)
      if (next === box.state) return
      box.state = next
      listeners.forEach((fn) => {
        fn()
      })
      flush()
    },
    subscribe: (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    ready: () => {
      if (box.state.status !== 'loading') return Promise.resolve(box.state)
      return new Promise((resolve) => waiters.push(resolve))
    },
    csrfToken: () => {
      const s: SessionState = box.state
      const session: Session | null = s.status === 'active' || s.status === 'locked' ? s.session : null
      return session?.csrfToken ?? null
    },
  }
}
