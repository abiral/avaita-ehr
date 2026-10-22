import type { MedicationRequestId, PatientId } from '@/core/branded'
import {
  allergyCheck,
  earlyRefillCheck,
  firedChecks,
  potassiumCheck,
  refillRequest,
  refillStep,
  renalFunctionCheck,
  unacknowledged,
  type RefillRequest,
} from './index'

const now = new Date('2026-10-20T03:00:00Z')
const base: RefillRequest = {
  id: 'rq_1' as MedicationRequestId,
  patientId: 'pt_ramesh' as PatientId,
  patientName: 'Ramesh Pandey',
  patientSex: 'male',
  patientBirthDate: '1965-03-12',
  mrn: 'NVG-188240',
  medicationName: 'Losartan 50 mg tablet',
  instructions: '',
  indication: '',
  lastDispensed: { at: new Date('2026-09-21T04:00:00Z'), quantity: 30 },
  quantityDays: 30,
  pickup: 'hospital-pharmacy',
  note: '',
  allergies: ['Sulfa drugs'],
  requestedAt: new Date('2026-10-19T12:57:00Z'),
  status: 'requested',
  decidedBy: null,
  decidedAt: null,
  labs: [
    { code: 'K', value: 4.8, at: new Date('2026-08-01T00:00:00Z') },
    { code: 'K', value: 5.3, at: new Date('2026-10-19T00:00:00Z') },
    { code: 'EGFR', value: 42, at: new Date('2026-10-19T00:00:00Z') },
  ],
  drugClass: 'arb',
}

describe('refillRequest machine', () => {
  it.each([
    ['requested', { type: 'review' }, 'under-review'],
    ['under-review', { type: 'decide', decision: 'approve' }, 'approved'],
    ['requested', { type: 'decide', decision: 'decline' }, 'declined'],
    ['under-review', { type: 'decide', decision: 'change' }, 'changed'],
    ['approved', { type: 'dispense', pickup: 'hospital-pharmacy' }, 'ready-for-pickup'],
    ['changed', { type: 'dispense', pickup: 'home-delivery' }, 'delivered'],
  ] as const)('%s + %o -> %s', (from, event, to) => {
    expect(refillRequest(from, event)).toEqual({ ok: true, value: to })
  })

  it.each([
    ['approved', { type: 'decide', decision: 'approve' }],
    ['declined', { type: 'dispense', pickup: 'hospital-pharmacy' }],
    ['under-review', { type: 'review' }],
    ['requested', { type: 'dispense', pickup: 'home-delivery' }],
  ] as const)('refuses %s + %o', (from, event) => {
    expect(refillRequest(from, event)).toEqual({ ok: false, error: 'not-allowed' })
  })

  it('maps status to the patient progress step', () => {
    expect([refillStep('requested'), refillStep('under-review'), refillStep('approved')]).toEqual([1, 2, 3])
  })
})

describe('refill safety checks', () => {
  it('potassium: potassium-raising medicine with the latest potassium above 5.0', () => {
    expect(potassiumCheck(base, now)).toMatchObject({ id: 'potassium', facts: { value: 5.3, egfr: 42 } })
    expect(potassiumCheck({ ...base, drugClass: 'statin' }, now)).toBeNull()
    expect(potassiumCheck({ ...base, labs: [{ code: 'K', value: 4.9, at: now }] }, now)).toBeNull()
  })

  it('renal function: metformin under eGFR 45, ARBs under 30', () => {
    expect(renalFunctionCheck(base, now)).toBeNull()
    expect(renalFunctionCheck({ ...base, drugClass: 'biguanide' }, now)).toMatchObject({
      id: 'renal-function',
      facts: { value: 42, limit: 45 },
    })
  })

  it('allergy: medicine class matches an allergy on file', () => {
    expect(allergyCheck(base, now)).toBeNull()
    expect(allergyCheck({ ...base, drugClass: 'sulfonamide' }, now)).toMatchObject({
      id: 'allergy',
      facts: { allergy: 'Sulfa drugs' },
    })
  })

  it('early refill: more than ten days of supply left', () => {
    expect(earlyRefillCheck(base, now)).toBeNull()
    expect(earlyRefillCheck({ ...base, requestedAt: new Date('2026-09-25T00:00:00Z') }, now)).toMatchObject({
      id: 'early-refill',
    })
  })

  it('lists every fired check and which are not yet acknowledged', () => {
    const fired = firedChecks(base, now)
    expect(fired.map((f) => f.id)).toEqual(['potassium'])
    expect(unacknowledged(fired, [])).toHaveLength(1)
    expect(unacknowledged(fired, ['potassium'])).toHaveLength(0)
  })
})
