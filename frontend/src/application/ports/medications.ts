import type { MedicationRequestId } from '@/core/branded'
import type { Medication, NewRefillRequest, RefillDecision, RefillRequest } from '@/domain/medications/types'

export interface PatientMedications {
  readonly allergies: readonly string[]
  readonly medications: readonly Medication[]
}

export interface MedicationRepository {
  mine(signal?: AbortSignal): Promise<PatientMedications>
  requestRefill(input: NewRefillRequest): Promise<Medication>
  queue(signal?: AbortSignal): Promise<RefillRequest[]>
  decide(id: MedicationRequestId, decision: RefillDecision): Promise<RefillRequest>
}
