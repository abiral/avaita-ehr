import type { RefillStatus } from '@/domain/medications'

export type RequestState = 'pending' | 'approved' | 'changed' | 'declined' | 'ready' | 'delivered'

export function requestState(status: RefillStatus): RequestState {
  if (status === 'requested' || status === 'under-review') return 'pending'
  if (status === 'ready-for-pickup') return 'ready'
  return status
}
