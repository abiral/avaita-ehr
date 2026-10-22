import type { PractitionerId } from '@/core/branded'
import type { Practitioner } from '@/domain/scheduling/types'

export interface PractitionerFilter {
  readonly category?: string
  readonly q?: string
  /** Only clinicians who hold a staff account at the facility (clinic schedule). */
  readonly staffOnly?: boolean
}

export interface PractitionerRepository {
  list(filter: PractitionerFilter, signal?: AbortSignal): Promise<Practitioner[]>
  get(id: PractitionerId, signal?: AbortSignal): Promise<Practitioner>
}
