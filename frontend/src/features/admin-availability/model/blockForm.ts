import { blockSlotCount } from '@/domain/scheduling/blocks'
import type {
  BlockMode,
  LocalDate,
  LocalTime,
  NewAvailabilityBlock,
  RepeatRule,
  Weekday,
} from '@/domain/scheduling/types'

export const ROOMS = ['room5', 'room3', 'video'] as const
export type RoomKey = (typeof ROOMS)[number]
export const ROOM_NAMES: Readonly<Record<RoomKey, string | null>> = { room5: 'Room 5', room3: 'Room 3', video: null }

export const HOURS: readonly LocalTime[] = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
]
export const SLOT_LENGTHS = [15, 20, 30, 40] as const

export interface BlockForm {
  readonly days: readonly Weekday[]
  readonly start: LocalTime
  readonly end: LocalTime
  readonly mode: BlockMode
  readonly slotMinutes: number
  readonly room: RoomKey
  readonly repeat: RepeatRule
  readonly startsOn: LocalDate
}

export const initialBlockForm = (startsOn: LocalDate): BlockForm => ({
  days: [2],
  start: '09:00',
  end: '12:00',
  mode: 'onsite',
  slotMinutes: 20,
  room: 'room5',
  repeat: 'weekly',
  startsOn,
})

export const toggleDay = (days: readonly Weekday[], day: Weekday): Weekday[] =>
  (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]).sort((a, b) => a - b)

export const slotsPerDay = (f: BlockForm): number => blockSlotCount(f)

export const toNewBlocks = (f: BlockForm): NewAvailabilityBlock[] =>
  f.days.map((weekday) => ({
    weekday,
    start: f.start,
    end: f.end,
    slotMinutes: f.slotMinutes,
    mode: f.mode,
    room: f.mode === 'remote' ? null : ROOM_NAMES[f.room],
    repeat: f.repeat,
    effectiveFrom: f.startsOn,
  }))
