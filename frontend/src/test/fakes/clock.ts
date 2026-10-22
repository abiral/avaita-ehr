import type { Clock } from '@/core/clock'

export interface FakeClock extends Clock {
  set(iso: string | Date): void
  advance(ms: number): void
}

/** Controllable clock. Starts at Tue 20 Oct 2026 08:30 in Kathmandu. */
export function createFakeClock(start = '2026-10-20T02:45:00Z'): FakeClock {
  const box = { now: new Date(start) }
  return {
    now: () => new Date(box.now),
    set: (iso) => {
      box.now = new Date(iso)
    },
    advance: (ms) => {
      box.now = new Date(box.now.getTime() + ms)
    },
  }
}
