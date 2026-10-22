import type { IdleDetector, PrintableDocument, Printer, RealtimeChannel, RealtimeEventName } from '@/application/ports'
import type { TenantScope } from '@/core/tenant'

export function createFakeIdle(): IdleDetector & { fire(): void } {
  const fns = new Set<() => void>()
  return {
    onActivity(fn) {
      fns.add(fn)
      return () => fns.delete(fn)
    },
    fire() {
      fns.forEach((fn) => {
        fn()
      })
    },
  }
}

export function createRecordingPrinter(): Printer & { printed: PrintableDocument[] } {
  const printed: PrintableDocument[] = []
  return {
    printed,
    print(doc) {
      printed.push(doc)
    },
  }
}

export interface FakeRealtime extends RealtimeChannel {
  readonly connections: (TenantScope | null)[]
  emit(event: RealtimeEventName, payload: unknown): void
}

export function createFakeRealtime(): FakeRealtime {
  const handlers = new Map<string, Set<(p: never) => void>>()
  const connections: (TenantScope | null)[] = []
  return {
    connections,
    connect(scope) {
      connections.push(scope)
    },
    close() {
      connections.push(null)
    },
    subscribe(event, handler) {
      const set = handlers.get(event) ?? new Set()
      set.add(handler)
      handlers.set(event, set)
      return () => set.delete(handler)
    },
    emit(event, payload) {
      handlers.get(event)?.forEach((fn) => {
        ;(fn as (p: unknown) => void)(payload)
      })
    },
  }
}
