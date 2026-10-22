import type { AppointmentKind, AppointmentStatus, CancelReason, CancelledBy } from '@/domain/appointments/types'
import type { VisitMode } from '@/domain/scheduling/types'
import { k } from './time'

export interface SeedAppointment {
  readonly id: string
  readonly patientId: string
  readonly practitionerId: string | null
  readonly kind: AppointmentKind
  readonly title: string
  readonly reason: string
  readonly start: string
  readonly minutes: number
  readonly mode: VisitMode
  readonly status: AppointmentStatus
  readonly location: string
  readonly preparation: string
  readonly cancelReason: CancelReason | null
  readonly cancelledBy: CancelledBy | null
  readonly packageEnrollmentId: string | null
  readonly hasSummary: boolean
}

const A = (
  id: string,
  patientId: string,
  practitionerId: string | null,
  date: string,
  time: string,
  minutes: number,
  reason: string,
  status: AppointmentStatus = 'booked',
  mode: VisitMode = 'onsite',
): SeedAppointment => ({
  id,
  patientId,
  practitionerId,
  kind: 'consultation',
  title: '',
  reason,
  start: k(date, time),
  minutes,
  mode,
  status,
  location: '',
  preparation: '',
  cancelReason: null,
  cancelledBy: null,
  packageEnrollmentId: null,
  hasSummary: false,
})

const LAB = {
  kind: 'lab' as const,
  practitionerId: null,
  title: 'Blood test: kidney function',
  location: 'Laboratory · Ground floor, Block A',
}

export const APPOINTMENTS: readonly SeedAppointment[] = [
  // Ramesh Pandey (P4, P7)
  A('ap_r1', 'pt_ramesh', 'pr_karki', '2026-10-21', '10:20', 20, 'Follow-up'),
  {
    ...A('ap_r2', 'pt_ramesh', null, '2026-11-03', '08:00', 15, 'Fasting'),
    ...LAB,
    preparation: 'No food for 8 hours. Water and your usual morning medicines are fine.',
  },
  A('ap_r3', 'pt_ramesh', 'pr_karki', '2026-11-03', '09:30', 20, 'Kidney follow-up'),
  {
    ...A('ap_r4', 'pt_ramesh', 'pr_karki', '2026-10-20', '09:30', 30, 'Follow-up · CKD', 'completed'),
    hasSummary: true,
  },
  { ...A('ap_r5', 'pt_ramesh', null, '2026-10-19', '07:45', 15, 'Report ready', 'completed'), ...LAB },
  {
    ...A('ap_r6', 'pt_ramesh', 'pr_anaya', '2026-08-14', '11:00', 20, 'General review', 'cancelled'),
    cancelReason: 'time-no-longer-works',
    cancelledBy: 'patient',
  },
  // Clinic schedule, Tuesday 20 October (C4)
  A('ap_s1', 'pt_laxmi', 'pr_anaya', '2026-10-20', '10:00', 30, 'New · Hypertension', 'completed'),
  A('ap_s2', 'pt_rajan', 'pr_anaya', '2026-10-20', '10:30', 30, 'Follow-up · Diabetes', 'completed'),
  A('ap_s3', 'pt_anita', 'pr_anaya', '2026-10-20', '14:00', 30, 'Follow-up · Thyroid', 'arrived'),
  A('ap_s4', 'pt_prem', 'pr_anaya', '2026-10-20', '15:00', 30, 'Follow-up · Asthma', 'booked', 'remote'),
  A('ap_s5', 'pt_bhim', 'pr_anaya', '2026-10-20', '16:00', 30, 'Post-discharge', 'booked'),
  A('ap_s6', 'pt_sarita', 'pr_karki', '2026-10-20', '08:30', 60, 'New · Anaemia', 'completed'),
  A('ap_s7', 'pt_kiran', 'pr_karki', '2026-10-20', '10:30', 30, 'Follow-up · Gout', 'completed'),
  A('ap_s8', 'pt_usha', 'pr_karki', '2026-10-20', '11:00', 30, 'Joint injection', 'completed'),
  {
    ...A('ap_s9', 'pt_nabin', 'pr_karki', '2026-10-20', '15:30', 30, 'Follow-up', 'cancelled'),
    cancelReason: 'time-no-longer-works',
    cancelledBy: 'patient',
  },
  // Booked slots on Wednesday 21 October (P5 shows these as taken)
  A('ap_w1', 'pt_kiran', 'pr_karki', '2026-10-21', '09:40', 20, 'Follow-up'),
  A('ap_w2', 'pt_usha', 'pr_karki', '2026-10-21', '11:00', 20, 'Follow-up'),
  // Dr. Sabina Thapa Magar, 29 and 30 October (A2 impact preview)
  A('ap_l1', 'pt_gita', 'pr_sabina', '2026-10-29', '09:20', 20, 'Follow-up'),
  A('ap_l2', 'pt_plama', 'pr_sabina', '2026-10-29', '10:40', 20, 'Follow-up'),
  A('ap_l3', 'pt_sunitakc', 'pr_sabina', '2026-10-30', '09:00', 20, 'New patient'),
  A('ap_l4', 'pt_bishnu', 'pr_sabina', '2026-10-30', '11:20', 20, 'Follow-up'),
]
