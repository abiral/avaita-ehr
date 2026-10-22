import { z } from 'zod'
import {
  BLOCK_MODES,
  HANDLINGS,
  REPEAT_RULES,
  TIME_OFF_KINDS,
  TIME_OFF_REASONS,
  VISIT_MODES,
} from '@/domain/scheduling/types'
import { IsoDateTime, listOf, LocalDate, LocalTime } from '../common'

export const BlockDto = z.object({
  id: z.string(),
  practitionerId: z.string(),
  weekday: z.number().int().min(1).max(7),
  start: LocalTime,
  end: LocalTime,
  slotMinutes: z.number().int().positive(),
  mode: z.enum(BLOCK_MODES),
  room: z.string().nullable(),
  repeat: z.enum(REPEAT_RULES),
  effectiveFrom: LocalDate,
})
export type BlockDto = z.infer<typeof BlockDto>
export const BlockListDto = listOf(BlockDto)
export const NewBlocksBody = z.object({ blocks: z.array(BlockDto.omit({ id: true, practitionerId: true })) })

export const TimeOffDto = z.object({
  id: z.string(),
  practitionerId: z.string(),
  practitionerName: z.string(),
  kind: z.enum(TIME_OFF_KINDS),
  start: IsoDateTime,
  end: IsoDateTime,
  reason: z.enum(TIME_OFF_REASONS),
  patientNote: z.string(),
  handling: z.enum(HANDLINGS),
  coverPractitionerId: z.string().nullable(),
  affectedCount: z.number().int().min(0),
  impactNote: z.string(),
})
export type TimeOffDto = z.infer<typeof TimeOffDto>
export const TimeOffListDto = listOf(TimeOffDto)
export const NewTimeOffBody = TimeOffDto.omit({
  id: true,
  practitionerName: true,
  affectedCount: true,
  impactNote: true,
})

export const ImpactDto = z.object({
  affected: z.array(z.object({ appointmentId: z.string(), patientName: z.string(), start: IsoDateTime })),
  removedSlots: z.number().int().min(0),
})

export const RulesDto = z.object({
  maxDaysAhead: z.number().int().positive(),
  minNoticeMinutes: z.number().int().min(0),
  cancelCutoffMinutes: z.number().int().min(0),
  bufferMinutes: z.number().int().min(0),
})

export const SlotDto = z.object({
  start: IsoDateTime,
  end: IsoDateTime,
  mode: z.enum(VISIT_MODES),
  available: z.boolean(),
})
export const SlotListDto = listOf(SlotDto)
