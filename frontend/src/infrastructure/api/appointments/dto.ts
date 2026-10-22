import { z } from 'zod'
import { APPOINTMENT_KINDS, APPOINTMENT_STATUSES, CANCEL_REASONS, CANCELLED_BY } from '@/domain/appointments/types'
import { VISIT_MODES } from '@/domain/scheduling/types'
import { IsoDateTime, listOf } from '../common'

export const AppointmentDto = z.object({
  id: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  practitionerId: z.string().nullable(),
  practitionerName: z.string(),
  kind: z.enum(APPOINTMENT_KINDS),
  title: z.string(),
  reason: z.string(),
  start: IsoDateTime,
  end: IsoDateTime,
  mode: z.enum(VISIT_MODES),
  status: z.enum(APPOINTMENT_STATUSES),
  location: z.string(),
  preparation: z.string(),
  cancelReason: z.enum(CANCEL_REASONS).nullable(),
  cancelledBy: z.enum(CANCELLED_BY).nullable(),
  packageEnrollmentId: z.string().nullable(),
  hasSummary: z.boolean(),
})
export type AppointmentDto = z.infer<typeof AppointmentDto>
export const AppointmentListDto = listOf(AppointmentDto)

export const NewAppointmentBody = z.object({
  patientId: z.string().nullable(),
  practitionerId: z.string(),
  start: IsoDateTime,
  mode: z.enum(VISIT_MODES),
  reason: z.string(),
  notifyBySms: z.boolean().optional(),
})
export const CancelBody = z.object({ reason: z.enum(CANCEL_REASONS) })
export const RescheduleBody = z.object({ start: IsoDateTime })
