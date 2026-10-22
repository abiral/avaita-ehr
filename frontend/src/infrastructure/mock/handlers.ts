import type { Db } from './db'
import { appointmentHandlers } from './handlers/appointments'
import { clinicalHandlers } from './handlers/clinical'
import { eventHandlers } from './handlers/events'
import { labHandlers } from './handlers/labs'
import { medicationHandlers } from './handlers/medications'
import { packageHandlers } from './handlers/packages'
import { practitionerHandlers } from './handlers/practitioners'
import { registrationHandlers } from './handlers/registration'
import { schedulingHandlers } from './handlers/scheduling'
import { sessionHandlers } from './handlers/session'
import { tenancyHandlers } from './handlers/tenancy'

/** All mock API handlers, mounted under `base` (for example /api). */
export function createHandlers(db: Db, base: string) {
  return [
    ...sessionHandlers(db, base),
    ...registrationHandlers(db, base),
    ...tenancyHandlers(db, base),
    ...practitionerHandlers(db, base),
    ...schedulingHandlers(db, base),
    ...appointmentHandlers(db, base),
    ...packageHandlers(db, base),
    ...clinicalHandlers(db, base),
    ...labHandlers(db, base),
    ...medicationHandlers(db, base),
    ...(typeof EventSource === 'undefined' ? [] : eventHandlers(db, base)),
  ]
}
