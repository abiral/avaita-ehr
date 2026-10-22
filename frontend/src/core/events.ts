/** Tiny typed emitter. */
export interface Emitter<E extends object> {
  on<K extends keyof E>(event: K, fn: (payload: E[K]) => void): () => void
  emit<K extends keyof E>(event: K, payload: E[K]): void
}

export function createEmitter<E extends object>(): Emitter<E> {
  const listeners = new Map<keyof E, Set<(payload: never) => void>>()
  return {
    on(event, fn) {
      const set = listeners.get(event) ?? new Set()
      set.add(fn)
      listeners.set(event, set)
      return () => {
        set.delete(fn)
      }
    },
    emit(event, payload) {
      listeners.get(event)?.forEach((fn) => {
        ;(fn as (p: typeof payload) => void)(payload)
      })
    },
  }
}
