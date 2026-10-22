import { z } from 'zod'
import { PICKUPS, REFILL_STATUSES } from '@/domain/medications/types'
import { IsoDateTime, listOf, LocalDate } from '../common'

export const MedicationDto = z.object({
  id: z.string(),
  name: z.string(),
  instructions: z.string(),
  indication: z.string(),
  prescriber: z.string(),
  daysLeft: z.number().int().min(0),
  supplyDays: z.number().int().positive(),
  status: z.enum(['active', 'ended']),
  endedAt: IsoDateTime.nullable(),
  openRequest: z.object({ id: z.string(), requestedAt: IsoDateTime, status: z.enum(REFILL_STATUSES) }).nullable(),
})
export type MedicationDto = z.infer<typeof MedicationDto>
export const PatientMedicationsDto = z.object({ allergies: z.array(z.string()), medications: z.array(MedicationDto) })

export const RefillBody = z.object({
  medicationId: z.string(),
  quantityDays: z.union([z.literal(30), z.literal(60), z.literal(90)]),
  pickup: z.enum(PICKUPS),
  note: z.string().max(500),
})

export const RefillRequestDto = z.object({
  id: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  patientSex: z.enum(['male', 'female', 'other']),
  patientBirthDate: LocalDate,
  mrn: z.string(),
  medicationName: z.string(),
  instructions: z.string(),
  indication: z.string(),
  lastDispensed: z.object({ at: IsoDateTime, quantity: z.number().int().positive() }).nullable(),
  quantityDays: z.number().int().positive(),
  pickup: z.enum(PICKUPS),
  note: z.string(),
  allergies: z.array(z.string()),
  requestedAt: IsoDateTime,
  status: z.enum(REFILL_STATUSES),
  decidedBy: z.string().nullable(),
  decidedAt: IsoDateTime.nullable(),
  labs: z.array(z.object({ code: z.string(), value: z.number(), at: IsoDateTime })),
  drugClass: z.string(),
})
export type RefillRequestDto = z.infer<typeof RefillRequestDto>
export const RefillQueueDto = listOf(RefillRequestDto)

export const DecisionBody = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('approve'),
    quantity: z.number().int().positive(),
    repeats: z.number().int().min(0),
    sendTo: z.enum(PICKUPS),
    message: z.string(),
    acknowledgedChecks: z.array(z.string()),
  }),
  z.object({ kind: z.literal('change'), newDose: z.string().min(1), labFollowUp: z.string(), message: z.string() }),
  z.object({ kind: z.literal('decline'), reason: z.string().min(1), message: z.string() }),
])
