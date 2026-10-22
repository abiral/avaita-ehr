import { useEffect, useRef } from 'react'
import { useServices } from '../ServicesProvider'
import { clearUserData } from './clearUserData'
import { idleDecision } from './idle'
import { useSession } from './SessionProvider'

const CHECK_EVERY_MS = 5_000

/** Watches activity with the injected Clock and IdleDetector; locks or ends the session. */
export function useIdleLock(): void {
  const services = useServices()
  const { clock, idle, sessionStore } = services
  const { state, lock } = useSession()
  const lastActivity = useRef(clock.now())
  const active = state.status === 'active' || state.status === 'locked'
  useEffect(() => {
    if (!active) return
    lastActivity.current = clock.now()
    const stop = idle.onActivity(() => {
      if (sessionStore.get().status === 'active') lastActivity.current = clock.now()
    })
    const timer = setInterval(() => {
      const s = sessionStore.get()
      if (s.status !== 'active' && s.status !== 'locked') return
      const decision = idleDecision({
        kind: s.session.kind,
        status: s.status,
        lastActivity: lastActivity.current,
        lockedAt: s.status === 'locked' ? s.lockedAt : null,
        now: clock.now(),
      })
      if (decision === 'lock') lock()
      if (decision === 'end') {
        clearUserData(services)
        services.tenant.set(null)
        sessionStore.dispatch({ type: 'signed-out' })
      }
    }, CHECK_EVERY_MS)
    return () => {
      stop()
      clearInterval(timer)
    }
  }, [active, clock, idle, sessionStore, lock, services])
}
