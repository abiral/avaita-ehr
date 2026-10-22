import type { RealtimeChannel, RealtimeEventName, RealtimeEvents } from '@/application/ports'
import type { TenantScope } from '@/core/tenant'

type AnyHandler = (payload: never) => void
const EVENT_NAMES: readonly RealtimeEventName[] = ['result.critical', 'appointment.changed', 'time-off.created']

export interface SseOptions {
  readonly url: string
  readonly create?: (url: string) => EventSource
  readonly schedule?: (fn: () => void, ms: number) => unknown
  readonly maxBackoffMs?: number
}

/** SSE adapter: reconnects with backoff, reconnects on facility switch, closes on sign out. */
export function createSseChannel(options: SseOptions): RealtimeChannel {
  const create = options.create ?? ((url: string) => new EventSource(url, { withCredentials: true }))
  const schedule = options.schedule ?? ((fn: () => void, ms: number) => setTimeout(fn, ms))
  const handlers = new Map<RealtimeEventName, Set<AnyHandler>>()
  let source: EventSource | null = null
  let scope: TenantScope | null = null
  let attempt = 0

  const dispatch = (name: RealtimeEventName, raw: string) => {
    try {
      const payload = JSON.parse(raw) as RealtimeEvents[typeof name]
      handlers.get(name)?.forEach((fn) => {
        ;(fn as (p: typeof payload) => void)(payload)
      })
    } catch {
      // Malformed event: ignore, the next refetch recovers.
    }
  }

  const open = () => {
    if (!scope) return
    const url = `${options.url}?facility=${encodeURIComponent(scope.facilityId)}`
    const es = create(url)
    source = es
    es.onopen = () => {
      attempt = 0
    }
    es.onerror = () => {
      es.close()
      if (source !== es) return
      source = null
      attempt += 1
      const delay = Math.min(options.maxBackoffMs ?? 30_000, 1000 * 2 ** (attempt - 1))
      schedule(open, delay)
    }
    for (const name of EVENT_NAMES)
      es.addEventListener(name, (ev) => {
        dispatch(name, (ev as MessageEvent<string>).data)
      })
  }

  return {
    connect(next) {
      source?.close()
      source = null
      scope = next
      attempt = 0
      open()
    },
    subscribe(event, handler) {
      const set = handlers.get(event) ?? new Set()
      set.add(handler)
      handlers.set(event, set)
      return () => set.delete(handler)
    },
    close() {
      scope = null
      source?.close()
      source = null
    },
  }
}
