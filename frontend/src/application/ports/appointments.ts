import type { AppointmentId, PractitionerId } from '@/core/branded'
import type { Appointment, CancelReason, NewAppointment } from '@/domain/appointments/types'
import type { DateRange } from '@/domain/scheduling/types'

export interface AppointmentRepository {
  listMine(signal?: AbortSignal): Promise<Appointment[]>
  listForPractitioner(id: PractitionerId, range: DateRange, signal?: AbortSignal): Promise<Appointment[]>
  book(input: NewAppointment): Promise<Appointment>
  cancel(id: AppointmentId, reason: CancelReason): Promise<Appointment>
  restore(id: AppointmentId): Promise<Appointment>
  reschedule(id: AppointmentId, start: Date): Promise<Appointment>
}
