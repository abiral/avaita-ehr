import { ApiError } from '@/core/errors'
import type { PractitionerId } from '@/core/branded'
import { validateNewBlocks } from '@/domain/scheduling/blocks'
import type {
  AvailabilityBlock,
  BookingRules,
  NewAvailabilityBlock,
  NewTimeOff,
  TimeOff,
  TimeOffImpact,
} from '@/domain/scheduling/types'
import type { SchedulingRepository } from '../ports'
import { outcome, type Outcome } from './outcome'

/** A1: rejects overlapping or empty blocks before saving (the server checks again). */
export const saveAvailabilityBlock =
  (deps: { scheduling: Pick<SchedulingRepository, 'saveBlocks'> }) =>
  async (input: {
    practitionerId: PractitionerId
    blocks: readonly NewAvailabilityBlock[]
    existing: readonly AvailabilityBlock[]
  }): Promise<Outcome<AvailabilityBlock[]>> => {
    const problem = validateNewBlocks(input.blocks, input.existing)
    if (problem) throw new ApiError('Invalid block', 'validation_failed', 422, { blocks: problem.kind })
    return outcome(await deps.scheduling.saveBlocks(input.practitionerId, input.blocks))
  }

export const saveBookingRules =
  (deps: { scheduling: Pick<SchedulingRepository, 'saveRules'> }) =>
  async (rules: BookingRules): Promise<Outcome<BookingRules>> => {
    const values = [rules.maxDaysAhead, rules.minNoticeMinutes, rules.cancelCutoffMinutes, rules.bufferMinutes]
    if (values.some((v) => !Number.isInteger(v) || v < 0) || rules.maxDaysAhead < 1) {
      throw new ApiError('Invalid rules', 'validation_failed', 422, { rules: 'invalid' })
    }
    return outcome(await deps.scheduling.saveRules(rules))
  }

/** A2: impact of one or more ranges (a recurring block is several), summed. */
export const previewTimeOff =
  (deps: { scheduling: Pick<SchedulingRepository, 'previewTimeOff'> }) =>
  async (ranges: readonly NewTimeOff[]): Promise<Outcome<TimeOffImpact>> => {
    if (ranges.length === 0) throw new ApiError('Nothing to block', 'validation_failed', 422, { range: 'empty' })
    const parts = await Promise.all(ranges.map((r) => deps.scheduling.previewTimeOff(r)))
    return outcome({
      affected: parts.flatMap((p) => p.affected).sort((a, b) => a.start.getTime() - b.start.getTime()),
      removedSlots: parts.reduce((n, p) => n + p.removedSlots, 0),
    })
  }

/** A2: the handling choice is required; saves every range and reports partial notification. */
export const createTimeOff =
  (deps: { scheduling: Pick<SchedulingRepository, 'createTimeOff'> }) =>
  async (ranges: readonly NewTimeOff[]): Promise<Outcome<TimeOff[]>> => {
    const [first] = ranges
    if (!first) throw new ApiError('Nothing to block', 'validation_failed', 422, { range: 'empty' })
    if (first.handling === 'reassign' && !first.coverPractitionerId) {
      throw new ApiError('Cover required', 'validation_failed', 422, { coverPractitionerId: 'required' })
    }
    const saved: TimeOff[] = []
    for (const r of ranges) saved.push(await deps.scheduling.createTimeOff(r))
    return outcome(saved)
  }
