import type { MedicationId, MedicationRequestId, PatientId } from '@/core/branded'
import type { Medication, RefillRequest } from '@/domain/medications'
import { decideRefill, requestRefill } from './medications'

const clock = { now: () => new Date('2026-10-20T03:00:00Z') }
const request = {
  id: 'rq_los' as MedicationRequestId,
  patientId: 'pt_ramesh' as PatientId,
  medicationName: 'Losartan 50 mg tablet',
  drugClass: 'arb',
  allergies: [],
  lastDispensed: null,
  requestedAt: new Date('2026-10-19T12:57:00Z'),
  status: 'requested',
  labs: [{ code: 'K', value: 5.3, at: new Date('2026-10-19T00:00:00Z') }],
} as unknown as RefillRequest
const approve = {
  kind: 'approve' as const,
  quantity: 30,
  repeats: 0,
  sendTo: 'hospital-pharmacy' as const,
  message: '',
}

describe('refill use cases', () => {
  it('will not approve with a fired check that was not confirmed', async () => {
    const decide = decideRefill({ medications: { decide: () => Promise.resolve(request) }, clock })
    await expect(decide({ request, decision: { ...approve, acknowledgedChecks: [] } })).rejects.toMatchObject({
      code: 'refill_not_allowed',
    })
    await expect(decide({ request, decision: { ...approve, acknowledgedChecks: ['potassium'] } })).resolves.toBeTruthy()
    await expect(
      decide({ request: { ...request, status: 'approved' }, decision: { kind: 'decline', reason: 'x', message: '' } }),
    ).rejects.toMatchObject({ code: 'conflict' })
  })

  it('refuses a second open request or an odd quantity', async () => {
    const medication = { id: 'med_los' as MedicationId, status: 'active', openRequest: null } as unknown as Medication
    const request = requestRefill({ medications: { requestRefill: () => Promise.resolve(medication) } })
    const input = { medicationId: medication.id, quantityDays: 30, pickup: 'hospital-pharmacy' as const, note: '' }
    await expect(request({ ...input, medication })).resolves.toBeTruthy()
    await expect(request({ ...input, quantityDays: 45, medication })).rejects.toMatchObject({
      code: 'validation_failed',
    })
    const open = {
      ...medication,
      openRequest: { id: 'rq' as MedicationRequestId, requestedAt: clock.now(), status: 'requested' as const },
    }
    await expect(request({ ...input, medication: open })).rejects.toMatchObject({ code: 'refill_not_allowed' })
  })
})
