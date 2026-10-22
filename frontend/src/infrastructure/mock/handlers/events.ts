import { sse } from 'msw'
import type { Db } from '../db'

/** SSE stream: forwards realtime events (ids and types only) to the browser. */
export function eventHandlers(db: Db, base: string) {
  return [
    sse<{ message: string; 'result.critical': string; 'appointment.changed': string; 'time-off.created': string }>(
      `${base}/events`,
      ({ client }) => {
        const listener = (event: string, data: string) => {
          client.send({ event: event as 'result.critical', data })
        }
        db.listeners.add(listener)
      },
    ),
  ]
}
