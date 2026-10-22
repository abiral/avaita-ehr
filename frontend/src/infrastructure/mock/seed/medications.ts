import type { Pickup, RefillStatus } from '@/domain/medications/types'
import { k } from './time'

export interface SeedMedication {
  readonly id: string
  readonly patientId: string
  readonly name: string
  readonly instructions: string
  readonly indication: string
  readonly prescriber: string
  readonly daysLeft: number
  readonly supplyDays: number
  readonly status: 'active' | 'ended'
  readonly endedAt: string | null
  readonly drugClass: string
  readonly lastDispensed: { readonly at: string; readonly quantity: number } | null
}

const M = (
  id: string,
  patientId: string,
  name: string,
  instructions: string,
  indication: string,
  daysLeft: number,
  drugClass: string,
  last: string,
  quantity = 30,
): SeedMedication => ({
  id,
  patientId,
  name,
  instructions,
  indication,
  prescriber: 'Dr. Prakash Karki',
  daysLeft,
  supplyDays: 30,
  status: 'active',
  endedAt: null,
  drugClass,
  lastDispensed: { at: k(last, '10:00'), quantity },
})

export const MEDICATIONS: readonly SeedMedication[] = [
  M(
    'med_aml',
    'pt_ramesh',
    'Amlodipine 5 mg tablet',
    'One tablet every morning',
    'Blood pressure',
    18,
    'calcium-channel-blocker',
    '2026-10-08',
  ),
  M(
    'med_los',
    'pt_ramesh',
    'Losartan 50 mg tablet',
    'One tablet every morning',
    'Blood pressure and kidney protection',
    7,
    'arb',
    '2026-09-21',
  ),
  M(
    'med_ator',
    'pt_ramesh',
    'Atorvastatin 20 mg tablet',
    'One tablet at night',
    'Cholesterol',
    5,
    'statin',
    '2026-09-25',
  ),
  {
    ...M(
      'med_amox',
      'pt_ramesh',
      'Amoxicillin 500 mg capsule',
      '3 times a day for 7 days',
      'Chest infection',
      0,
      'penicillin',
      '2026-08-05',
      21,
    ),
    status: 'ended',
    endedAt: k('2026-08-12', '10:00'),
  },
  {
    ...M(
      'med_para',
      'pt_ramesh',
      'Paracetamol 500 mg tablet',
      'When needed for pain',
      'Pain',
      0,
      'analgesic',
      '2026-08-05',
      20,
    ),
    status: 'ended',
    endedAt: k('2026-08-12', '10:00'),
  },
  M(
    'med_laxmi',
    'pt_laxmi',
    'Amlodipine 10 mg tablet',
    'One tablet every morning',
    'Hypertension',
    6,
    'calcium-channel-blocker',
    '2026-09-18',
  ),
  M(
    'med_rajan',
    'pt_rajan',
    'Metformin 500 mg tablet',
    'One tablet twice daily with food',
    'Type 2 diabetes',
    4,
    'biguanide',
    '2026-09-20',
    60,
  ),
]

export interface SeedRefill {
  readonly id: string
  readonly medicationId: string
  readonly quantityDays: number
  readonly pickup: Pickup
  readonly note: string
  readonly requestedAt: string
  readonly status: RefillStatus
  readonly decidedBy: string | null
  readonly decidedAt: string | null
}

const Q = (
  id: string,
  medicationId: string,
  quantityDays: number,
  pickup: Pickup,
  note: string,
  requestedAt: string,
): SeedRefill => ({
  id,
  medicationId,
  quantityDays,
  pickup,
  note,
  requestedAt,
  status: 'requested',
  decidedBy: null,
  decidedAt: null,
})

export const REFILLS: readonly SeedRefill[] = [
  Q('rq_los', 'med_los', 30, 'hospital-pharmacy', 'Running out next week.', k('2026-10-19', '18:42')),
  Q('rq_laxmi', 'med_laxmi', 90, 'home-delivery', 'Ankle swelling sometimes.', k('2026-10-20', '07:50')),
  Q('rq_rajan', 'med_rajan', 30, 'hospital-pharmacy', '', k('2026-10-19', '21:05')),
]

/** Allergies on file per patient. */
export const ALLERGIES: Readonly<Record<string, readonly { substance: string; reaction: string }[]>> = {
  pt_ramesh: [{ substance: 'Sulfa drugs', reaction: 'rash' }],
  pt_ram: [{ substance: 'Penicillin', reaction: 'rash' }],
}
