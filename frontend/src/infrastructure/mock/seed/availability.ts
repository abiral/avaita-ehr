import type { BlockMode, RepeatRule } from '@/domain/scheduling/types'
import { PRACTITIONERS } from './practitioners'

export interface SeedBlock {
  readonly id: string
  readonly practitionerId: string
  readonly weekday: number
  readonly start: string
  readonly end: string
  readonly slotMinutes: number
  readonly mode: BlockMode
  readonly room: string | null
  readonly repeat: RepeatRule
  readonly effectiveFrom: string
}

type Row = readonly [weekday: number, start: string, end: string, mode: BlockMode]

const KARKI: readonly Row[] = [
  [1, '09:00', '12:00', 'onsite'],
  [1, '14:00', '16:00', 'remote'],
  [2, '14:00', '17:00', 'remote'],
  [3, '09:00', '12:00', 'onsite'],
  [4, '09:00', '12:00', 'onsite'],
  [4, '15:00', '17:00', 'remote'],
  [5, '09:00', '11:00', 'onsite'],
  [7, '10:00', '12:00', 'remote'],
]
const GENERIC: readonly Row[] = [
  [1, '09:00', '13:00', 'onsite'],
  [2, '09:00', '13:00', 'onsite'],
  [3, '14:00', '16:00', 'remote'],
  [4, '09:00', '13:00', 'onsite'],
  [5, '09:00', '13:00', 'onsite'],
]
const REMOTE_ONLY: readonly Row[] = [1, 2, 3, 4, 5, 7].map((d) => [d, '15:00', '18:00', 'remote'] as const)
const ONSITE_ONLY: readonly Row[] = [1, 2, 3, 4, 5].map((d) => [d, '09:00', '13:00', 'onsite'] as const)

const rowsFor = (id: string, onsite: boolean, remote: boolean): readonly Row[] => {
  if (id === 'pr_karki') return KARKI
  if (!onsite) return REMOTE_ONLY
  if (!remote) return ONSITE_ONLY
  return GENERIC
}

export const BLOCKS: readonly SeedBlock[] = PRACTITIONERS.flatMap((p) =>
  rowsFor(p.id, p.offersOnsite, p.offersRemote).map(([weekday, start, end, mode], i) => ({
    id: `blk_${p.id.slice(3)}_${i + 1}`,
    practitionerId: p.id,
    weekday,
    start,
    end,
    slotMinutes: 20,
    mode,
    room: mode === 'remote' ? null : p.room,
    repeat: 'weekly' as const,
    effectiveFrom: '2026-09-07',
  })),
)

export const RULES = { maxDaysAhead: 60, minNoticeMinutes: 120, cancelCutoffMinutes: 240, bufferMinutes: 0 }
