import { FACILITIES, ORG, PATIENT_ACCOUNTS, STAFF } from './seed/identities'
import { PATIENTS } from './seed/patients'

export interface MockSession {
  readonly kind: 'patient' | 'staff'
  readonly userId: string
  locked: boolean
}

/** In-memory database for the mock server. Each call returns a fresh copy of the seed. */
export function createDb() {
  return {
    org: ORG,
    facilities: FACILITIES.map((f) => ({ ...f })),
    staff: STAFF.map((s) => ({ ...s })),
    patientAccounts: PATIENT_ACCOUNTS.map((a) => ({ ...a })),
    patients: PATIENTS.map((p) => ({ ...p })),
    session: null as MockSession | null,
    csrfToken: 'mock-csrf-token',
    resetTokens: new Set<string>(['reset-demo-token']),
  }
}

export type Db = ReturnType<typeof createDb>
