import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import type { SignInInput } from '@/application/ports'
import type { Session } from '@/domain/identity'
import { useServices } from '../ServicesProvider'
import { clearUserData } from './clearUserData'
import type { SessionState } from './sessionState'

export interface SessionApi {
  readonly state: SessionState
  readonly signIn: (input: SignInInput) => Promise<Session>
  readonly signOut: () => Promise<void>
  readonly unlock: (password: string) => Promise<void>
  readonly lock: () => void
}

const SessionContext = createContext<SessionApi | null>(null)

function useSessionLifecycle() {
  const services = useServices()
  const { sessionStore, repos, events, clock, logger } = services
  useEffect(() => {
    if (sessionStore.get().status !== 'loading') return
    const controller = new AbortController()
    repos.session.current(controller.signal).then(
      (session) => {
        sessionStore.dispatch({ type: 'loaded', session })
      },
      (e: unknown) => {
        logger.warn('session.load_failed', { error: e instanceof Error ? e.name : 'unknown' })
        sessionStore.dispatch({ type: 'loaded', session: null })
      },
    )
    return () => {
      controller.abort()
    }
  }, [sessionStore, repos, logger])
  useEffect(() => {
    const offEnded = events.on('sessionEnded', () => {
      clearUserData(services)
      services.tenant.set(null)
      sessionStore.dispatch({ type: 'signed-out' })
    })
    const offLocked = events.on('sessionLocked', () => {
      sessionStore.dispatch({ type: 'locked', at: clock.now() })
    })
    return () => {
      offEnded()
      offLocked()
    }
  }, [events, sessionStore, clock, services])
}

export function SessionProvider({ children }: { readonly children: ReactNode }) {
  const services = useServices()
  const { sessionStore, repos, clock } = services
  const state = useSyncExternalStore(sessionStore.subscribe, sessionStore.get)
  useSessionLifecycle()
  const signIn = useCallback(
    async (input: SignInInput) => {
      const session = await repos.session.signIn(input)
      clearUserData(services)
      sessionStore.dispatch({ type: 'signed-in', session })
      return session
    },
    [repos, sessionStore, services],
  )
  const signOut = useCallback(async () => {
    try {
      await repos.session.signOut()
    } finally {
      clearUserData(services)
      services.tenant.set(null)
      sessionStore.dispatch({ type: 'signed-out' })
    }
  }, [repos, sessionStore, services])
  const unlock = useCallback(
    async (password: string) => {
      const session = await repos.session.unlock(password)
      sessionStore.dispatch({ type: 'unlocked', session })
    },
    [repos, sessionStore],
  )
  const lock = useCallback(() => {
    sessionStore.dispatch({ type: 'locked', at: clock.now() })
  }, [sessionStore, clock])
  const api = useMemo<SessionApi>(
    () => ({ state, signIn, signOut, unlock, lock }),
    [state, signIn, signOut, unlock, lock],
  )
  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>
}

export function useSession(): SessionApi {
  const api = useContext(SessionContext)
  if (!api) throw new Error('useSession needs SessionProvider')
  return api
}
