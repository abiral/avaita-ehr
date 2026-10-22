import type { TagTone } from '@/ui'
import type { Medication } from '@/domain/medications'

export const LOW_SUPPLY_DAYS = 7

export type MedicineState = 'active' | 'low' | 'requested' | 'approved' | 'ready'

export function medicineState(m: Medication): MedicineState {
  const status = m.openRequest?.status
  if (status === 'requested' || status === 'under-review') return 'requested'
  if (status === 'approved' || status === 'changed') return 'approved'
  if (status === 'ready-for-pickup' || status === 'delivered') return 'ready'
  return m.daysLeft <= LOW_SUPPLY_DAYS ? 'low' : 'active'
}

export const STATE_TONE: Readonly<Record<MedicineState, TagTone>> = {
  active: 'neutral',
  low: 'alert',
  requested: 'info',
  approved: 'info',
  ready: 'info',
}

export const canRequest = (m: Medication): boolean => m.status === 'active' && medicineState(m) !== 'requested'

/** The panel opens on the active medicine closest to running out that has no open request. */
export const defaultPanel = (meds: readonly Medication[]): Medication | null =>
  [...meds].filter(canRequest).sort((a, b) => a.daysLeft - b.daysLeft)[0] ?? null

export const supplyPercent = (m: Medication): number =>
  Math.max(0, Math.min(100, Math.round((m.daysLeft / (m.supplyDays || 1)) * 100)))
