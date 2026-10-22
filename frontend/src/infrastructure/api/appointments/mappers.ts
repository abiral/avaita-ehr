import type { AppointmentId, PatientId, PractitionerId } from '@/core/branded'
import type { Appointment } from '@/domain/appointments/types'
import { toDate } from '../common'
import type { AppointmentDto } from './dto'

export const toAppointment = (dto: AppointmentDto): Appointment => ({
  ...dto,
  id: dto.id as AppointmentId,
  patientId: dto.patientId as PatientId,
  practitionerId: dto.practitionerId as PractitionerId | null,
  start: toDate(dto.start),
  end: toDate(dto.end),
})
