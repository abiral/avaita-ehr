export interface Clock {
  now(): Date
}
export const systemClock: Clock = { now: () => new Date() }

/** A clock that starts at `start` and then moves with real time (demo mode). */
export function createOffsetClock(start: Date, real: Clock = systemClock): Clock {
  const offset = start.getTime() - real.now().getTime()
  return { now: () => new Date(real.now().getTime() + offset) }
}
