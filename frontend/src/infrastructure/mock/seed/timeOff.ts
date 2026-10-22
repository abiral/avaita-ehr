import type { Handling, TimeOffKind, TimeOffReason } from '@/domain/scheduling/types'
import { k } from './time'

export interface SeedTimeOff {
  readonly id: string
  readonly practitionerId: string
  readonly kind: TimeOffKind
  readonly start: string
  readonly end: string
  readonly reason: TimeOffReason
  readonly patientNote: string
  readonly handling: Handling
  readonly coverPractitionerId: string | null
  readonly impactNote: string
  readonly affectedCount: number
}

const T = (
  id: string,
  practitionerId: string,
  kind: TimeOffKind,
  start: string,
  end: string,
  reason: TimeOffReason,
  handling: Handling,
  impactNote: string,
  affectedCount: number,
  cover: string | null = null,
): SeedTimeOff => ({
  id,
  practitionerId,
  kind,
  start,
  end,
  reason,
  patientNote: '',
  handling,
  coverPractitionerId: cover,
  impactNote,
  affectedCount,
})

export const TIME_OFF: readonly SeedTimeOff[] = [
  T(
    'to_round',
    'pr_anaya',
    'part',
    k('2026-10-20', '08:00'),
    k('2026-10-20', '10:00'),
    'duty',
    'keep',
    'Inpatient round · Ward 4B',
    0,
  ),
  T(
    'to_family',
    'pr_anaya',
    'part',
    k('2026-10-20', '11:30'),
    k('2026-10-20', '12:00'),
    'meeting',
    'keep',
    'Family meeting',
    0,
  ),
  T(
    'to_mdt',
    'pr_anaya',
    'part',
    k('2026-10-20', '13:00'),
    k('2026-10-20', '14:00'),
    'meeting',
    'keep',
    'Multidisciplinary team',
    0,
  ),
  T(
    'to_admin',
    'pr_karki',
    'part',
    k('2026-10-20', '14:00'),
    k('2026-10-20', '15:00'),
    'duty',
    'keep',
    'Admin time',
    0,
  ),
  T(
    'to_ra',
    'pr_rohan',
    'part',
    k('2026-10-22', '14:00'),
    k('2026-10-22', '16:00'),
    'meeting',
    'keep',
    'No booked appointments affected',
    0,
  ),
  T(
    'to_pk',
    'pr_karki',
    'full',
    k('2026-10-26', '00:00'),
    k('2026-10-29', '00:00'),
    'conference',
    'notify',
    '9 rebooked, 5 waiting for the patient',
    14,
  ),
  T(
    'to_mr',
    'pr_meena',
    'part',
    k('2026-11-04', '13:00'),
    k('2026-11-04', '17:00'),
    'conference',
    'reassign',
    '3 appointments moved to Dr. Anaya Shrestha',
    3,
    'pr_anaya',
  ),
  T(
    'to_as',
    'pr_anaya',
    'full',
    k('2026-11-10', '00:00'),
    k('2026-11-15', '00:00'),
    'annual',
    'notify',
    'Patients notified',
    22,
  ),
]
