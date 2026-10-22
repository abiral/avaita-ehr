import type { IdleDetector } from '@/application/ports'

const EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const

export function createDomIdleDetector(target: Window): IdleDetector {
  return {
    onActivity(fn) {
      for (const name of EVENTS) target.addEventListener(name, fn, { passive: true })
      return () => {
        for (const name of EVENTS) target.removeEventListener(name, fn)
      }
    },
  }
}
