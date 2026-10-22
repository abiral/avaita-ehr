import type { MedicationId, MedicationRequestId, PatientId } from '@/core/branded'
import type { Medication, RefillRequest } from '@/domain/medications/types'
import { toDate, toDateOrNull } from '../common'
import type { MedicationDto, RefillRequestDto } from './dto'

export const toMedication = (dto: MedicationDto): Medication => ({
  ...dto,
  id: dto.id as MedicationId,
  endedAt: toDateOrNull(dto.endedAt),
  openRequest: dto.openRequest
    ? {
        ...dto.openRequest,
        id: dto.openRequest.id as MedicationRequestId,
        requestedAt: toDate(dto.openRequest.requestedAt),
      }
    : null,
})

export const toRefillRequest = (dto: RefillRequestDto): RefillRequest => ({
  ...dto,
  id: dto.id as MedicationRequestId,
  patientId: dto.patientId as PatientId,
  lastDispensed: dto.lastDispensed ? { ...dto.lastDispensed, at: toDate(dto.lastDispensed.at) } : null,
  requestedAt: toDate(dto.requestedAt),
  decidedAt: toDateOrNull(dto.decidedAt),
  labs: dto.labs.map((l) => ({ ...l, at: toDate(l.at) })),
})
