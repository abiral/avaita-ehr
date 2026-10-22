import { setupWorker } from 'msw/browser'
import { createDb } from './db'
import { createHandlers } from './handlers'

/** Dev only: starts the MSW service worker with a fresh in-memory db. */
export async function startBrowserMock(base: string): Promise<void> {
  const worker = setupWorker(...createHandlers(createDb(), base))
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
}
