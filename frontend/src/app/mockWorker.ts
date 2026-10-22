import { createOffsetClock, type Clock } from '@/core/clock'
import { startBrowserMock } from '@/infrastructure/mock/browser'
import { DEMO_NOW } from '@/infrastructure/mock/seed/time'

/** Dev only: starts the mock API and returns the demo clock shared by the app and the mock. */
export async function startMockWorker(): Promise<Clock> {
  const clock = createOffsetClock(new Date(DEMO_NOW))
  await startBrowserMock(import.meta.env.VITE_API_BASE, clock)
  return clock
}
