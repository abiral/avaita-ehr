import type { BlockId, PractitionerId } from '@/core/branded'
import type {
  AvailabilityBlock,
  BookingRules,
  DateRange,
  NewAvailabilityBlock,
  NewTimeOff,
  Slot,
  TimeOff,
  TimeOffImpact,
  VisitMode,
} from '@/domain/scheduling/types'

export interface SchedulingRepository {
  blocks(id: PractitionerId, signal?: AbortSignal): Promise<AvailabilityBlock[]>
  saveBlocks(id: PractitionerId, blocks: readonly NewAvailabilityBlock[]): Promise<AvailabilityBlock[]>
  deleteBlock(id: PractitionerId, blockId: BlockId): Promise<void>
  timeOff(range: DateRange, signal?: AbortSignal): Promise<TimeOff[]>
  previewTimeOff(input: NewTimeOff): Promise<TimeOffImpact>
  createTimeOff(input: NewTimeOff): Promise<TimeOff>
  slots(id: PractitionerId, mode: VisitMode, range: DateRange, signal?: AbortSignal): Promise<Slot[]>
  rules(signal?: AbortSignal): Promise<BookingRules>
  saveRules(rules: BookingRules): Promise<BookingRules>
}
