import type { MedicationRepository } from '@/application/ports'
import type { HttpClient } from '../../http'
import { MedicationDto, PatientMedicationsDto, RefillQueueDto, RefillRequestDto } from './dto'
import { toMedication, toRefillRequest } from './mappers'

export function createMedicationRepository(http: HttpClient): MedicationRepository {
  return {
    async mine(signal) {
      const res = await http.send({ method: 'GET', path: '/me/medications', signal }, PatientMedicationsDto)
      return { allergies: res.allergies, medications: res.medications.map(toMedication) }
    },
    async requestRefill(input) {
      return toMedication(await http.send({ method: 'POST', path: '/medication-requests', body: input }, MedicationDto))
    },
    async queue(signal) {
      const res = await http.send(
        { method: 'GET', path: '/medication-requests', query: { status: 'open' }, signal },
        RefillQueueDto,
      )
      return res.items.map(toRefillRequest)
    },
    async decide(id, decision) {
      return toRefillRequest(
        await http.send(
          { method: 'POST', path: `/medication-requests/${id}/decision`, body: decision },
          RefillRequestDto,
        ),
      )
    },
  }
}
