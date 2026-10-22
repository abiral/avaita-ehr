import type { PractitionerId } from '@/core/branded'
import type { Practitioner } from '@/domain/scheduling/types'

export interface PractitionerFilter {
  readonly category?: string
  readonly q?: string
}

export interface PractitionerRepository {
  list(filter: PractitionerFilter, signal?: AbortSignal): Promise<Practitioner[]>
  get(id: PractitionerId, signal?: AbortSignal): Promise<Practitioner>
}
