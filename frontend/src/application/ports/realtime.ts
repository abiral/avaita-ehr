import type { TenantScope } from '@/core/tenant'

/** Events carry ids and types only, never PHI. */
export interface RealtimeEvents {
  'result.critical': { readonly resultId: string }
  'appointment.changed': { readonly appointmentId: string }
  'time-off.created': { readonly timeOffId: string }
}
export type RealtimeEventName = keyof RealtimeEvents
export type Unsubscribe = () => void

export interface RealtimeChannel {
  connect(scope: TenantScope): void
  subscribe<K extends RealtimeEventName>(event: K, handler: (payload: RealtimeEvents[K]) => void): Unsubscribe
  close(): void
}
