import { assertNever } from '@/core/assertNever'
import type { Session } from '@/domain/identity'

export type SessionState =
  | { readonly status: 'loading' }
  | { readonly status: 'signed-out' }
  | { readonly status: 'active'; readonly session: Session }
  | { readonly status: 'locked'; readonly session: Session; readonly lockedAt: Date }

export type SessionAction =
  | { readonly type: 'loaded'; readonly session: Session | null }
  | { readonly type: 'signed-in'; readonly session: Session }
  | { readonly type: 'signed-out' }
  | { readonly type: 'locked'; readonly at: Date }
  | { readonly type: 'unlocked'; readonly session: Session }

/** Session state machine: loading -> signed-out | active <-> locked -> signed-out. */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'loaded':
      if (state.status !== 'loading') return state
      return action.session ? { status: 'active', session: action.session } : { status: 'signed-out' }
    case 'signed-in':
      return { status: 'active', session: action.session }
    case 'signed-out':
      return { status: 'signed-out' }
    case 'locked':
      return state.status === 'active' ? { status: 'locked', session: state.session, lockedAt: action.at } : state
    case 'unlocked':
      return state.status === 'locked' ? { status: 'active', session: action.session } : state
    default:
      return assertNever(action)
  }
}

export const sessionOf = (state: SessionState): Session | null =>
  state.status === 'active' || state.status === 'locked' ? state.session : null
