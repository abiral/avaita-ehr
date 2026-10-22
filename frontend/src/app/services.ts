import type { QueryClient } from '@tanstack/react-query'
import type { IdleDetector, PreferenceStore, Printer, RealtimeChannel, SessionRepository } from '@/application/ports'
import type { Clock } from '@/core/clock'
import type { Emitter } from '@/core/events'
import type { Logger } from '@/core/logger'
import type { FacilityId } from '@/core/tenant'
import type { DraftStore } from './drafts'
import type { SessionStore } from './session/sessionStore'
import type { TenantSource } from './tenantSource'

export interface AppEvents {
  sessionEnded: undefined
  sessionLocked: undefined
  facilityChanged: FacilityId
}

export interface Repositories {
  readonly session: SessionRepository
}

export interface Services {
  readonly clock: Clock
  readonly logger: Logger
  readonly events: Emitter<AppEvents>
  readonly prefs: PreferenceStore
  readonly printer: Printer
  readonly realtime: RealtimeChannel
  readonly idle: IdleDetector
  readonly sessionStore: SessionStore
  readonly tenant: TenantSource
  readonly drafts: DraftStore
  readonly queryClient: QueryClient
  readonly repos: Repositories
}
