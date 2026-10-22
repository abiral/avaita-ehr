/** In-memory drafts. Survive the idle lock, cleared on sign out and facility switch. Never persisted. */
export interface DraftStore {
  get(key: string): unknown
  set(key: string, value: unknown): void
  delete(key: string): void
  clear(): void
}

export function createDraftStore(): DraftStore {
  const values = new Map<string, unknown>()
  return {
    get: (key) => values.get(key),
    set: (key, value) => {
      values.set(key, value)
    },
    delete: (key) => {
      values.delete(key)
    },
    clear: () => {
      values.clear()
    },
  }
}
