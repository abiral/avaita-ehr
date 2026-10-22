import type { BlockId, PractitionerId, TimeOffId } from '@/core/branded'
import type { AvailabilityBlock, NewTimeOff, Slot, TimeOff, TimeOffImpact, Weekday } from '@/domain/scheduling/types'
import type { z } from 'zod'
import { iso, toDate } from '../common'
import type { BlockDto, ImpactDto, NewTimeOffBody, SlotDto, TimeOffDto } from './dto'

export const toBlock = (dto: BlockDto): AvailabilityBlock => ({
  ...dto,
  id: dto.id as BlockId,
  practitionerId: dto.practitionerId as PractitionerId,
  weekday: dto.weekday as Weekday,
})

export const toTimeOff = (dto: TimeOffDto): TimeOff => ({
  ...dto,
  id: dto.id as TimeOffId,
  practitionerId: dto.practitionerId as PractitionerId,
  coverPractitionerId: dto.coverPractitionerId as PractitionerId | null,
  start: toDate(dto.start),
  end: toDate(dto.end),
})

export const toTimeOffBody = (input: NewTimeOff): z.infer<typeof NewTimeOffBody> => ({
  ...input,
  start: iso(input.start),
  end: iso(input.end),
})

export const toImpact = (dto: z.infer<typeof ImpactDto>): TimeOffImpact => ({
  removedSlots: dto.removedSlots,
  affected: dto.affected.map((a) => ({ ...a, start: toDate(a.start) })),
})

export const toSlot = (dto: z.infer<typeof SlotDto>): Slot => ({
  ...dto,
  start: toDate(dto.start),
  end: toDate(dto.end),
})
