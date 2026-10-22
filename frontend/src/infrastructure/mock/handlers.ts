import type { Db } from './db'
import { sessionHandlers } from './handlers/session'

/** All mock API handlers, mounted under `base` (for example /api). */
export function createHandlers(db: Db, base: string) {
  return [...sessionHandlers(db, base)]
}
