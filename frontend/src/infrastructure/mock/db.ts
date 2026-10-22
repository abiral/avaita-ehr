import type { Clock } from '@/core/clock'
import { createOffsetClock } from '@/core/clock'
import { APPOINTMENTS, type SeedAppointment } from './seed/appointments'
import { BLOCKS, RULES, type SeedBlock } from './seed/availability'
import { AGENDA, CHARTS, MED_RECONCILIATION, NOTES, type SeedNote } from './seed/clinical'
import { FACILITIES, ORG, PATIENT_ACCOUNTS, STAFF } from './seed/identities'
import { LAB_TESTS, ORDER_SETS, RECENT_COLLECTIONS, RESULTS, type SeedResult } from './seed/labs'
import { ALLERGIES, MEDICATIONS, REFILLS, type SeedMedication, type SeedRefill } from './seed/medications'
import { OUTPATIENTS } from './seed/outpatients'
import { PACKAGES, type SeedPackage } from './seed/packages'
import { PATIENTS } from './seed/patients'
import { PRACTITIONERS } from './seed/practitioners'
import { DEMO_NOW } from './seed/time'
import { TIME_OFF, type SeedTimeOff } from './seed/timeOff'

export interface MockSession {
  readonly kind: 'patient' | 'staff'
  readonly userId: string
  locked: boolean
}

export interface MockEnrollment {
  readonly id: string
  readonly patientId: string
  readonly packageId: string
  readonly chosenFormat: SeedPackage['format']
  readonly start: string
  readonly expires: string
  readonly firstAppointmentId: string
}

export interface MockRegistration {
  readonly id: string
  readonly email: string
  readonly mobile: string
  readonly hospitalNumber: string
  verified: boolean
}

const copy = <T extends object>(rows: readonly T[]): T[] => rows.map((r) => ({ ...r }))

/** In-memory database for the mock server. Each call returns a fresh copy of the seed. */
export function createDb(clock: Clock = createOffsetClock(new Date(DEMO_NOW))) {
  return {
    clock,
    org: ORG,
    facilities: copy(FACILITIES),
    staff: copy(STAFF),
    patientAccounts: copy(PATIENT_ACCOUNTS),
    patients: [...copy(PATIENTS), ...copy(OUTPATIENTS)],
    practitioners: copy(PRACTITIONERS),
    blocks: copy<SeedBlock>(BLOCKS),
    rules: { ...RULES },
    timeOff: copy<SeedTimeOff>(TIME_OFF),
    appointments: copy<SeedAppointment>(APPOINTMENTS),
    packages: PACKAGES.map((p) => ({ ...p, items: p.items.map((i) => ({ ...i })) })) as SeedPackage[],
    enrollments: [] as MockEnrollment[],
    results: copy<SeedResult>(RESULTS),
    labTests: LAB_TESTS,
    orderSets: ORDER_SETS,
    recentCollections: copy(RECENT_COLLECTIONS),
    labOrders: [] as { id: string; patientId: string; placedAt: string; itemCount: number }[],
    medications: copy<SeedMedication>(MEDICATIONS),
    refills: copy<SeedRefill>(REFILLS),
    allergies: ALLERGIES,
    charts: CHARTS,
    notes: NOTES.map((n) => ({
      ...n,
      plan: n.plan.map((p) => ({ ...p })),
      addenda: [] as { text: string; at: string; authorName: string }[],
      copyTo: [] as { name: string; role: string }[],
    })) as (SeedNote & {
      addenda: { text: string; at: string; authorName: string }[]
      copyTo: { name: string; role: string }[]
    })[],
    agenda: AGENDA,
    medReconciliation: MED_RECONCILIATION,
    registrations: [
      {
        id: 'reg_demo',
        email: 'ramesh.pandey@mail.com',
        mobile: '+977 9841234567',
        hospitalNumber: 'NVG-188240',
        verified: false,
      },
    ] as MockRegistration[],
    session: null as MockSession | null,
    csrfToken: 'mock-csrf-token',
    resetTokens: new Set<string>(['reset-demo-token']),
    sequence: 1000,
    /** Realtime listeners (SSE stream in the browser, direct in tests). */
    listeners: new Set<(event: string, data: string) => void>(),
  }
}

export type Db = ReturnType<typeof createDb>

export const nextId = (db: Db, prefix: string): string => `${prefix}_${String(db.sequence++)}`

export const emit = (db: Db, event: string, payload: Record<string, string>): void => {
  const data = JSON.stringify(payload)
  db.listeners.forEach((fn) => {
    fn(event, data)
  })
}
