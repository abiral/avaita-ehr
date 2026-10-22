import type { PreferenceKey, PreferenceStore, PreferenceValues } from '@/application/ports'

const PREFIX = 'folio.pref.'
/** The only keys ever written to browser storage. UI preferences, never PHI. */
export const ALLOWED_PREFERENCE_KEYS: readonly string[] = [`${PREFIX}lastFacilityId`, `${PREFIX}sidebarCollapsed`]

export function createPreferenceStore(storage: Storage | undefined): PreferenceStore {
  const read = (key: PreferenceKey): unknown => {
    try {
      const raw = storage?.getItem(PREFIX + key)
      return raw ? (JSON.parse(raw) as unknown) : undefined
    } catch {
      return undefined
    }
  }
  return {
    get<K extends PreferenceKey>(key: K) {
      return read(key) as PreferenceValues[K] | undefined
    },
    set(key, value) {
      try {
        storage?.setItem(PREFIX + key, JSON.stringify(value))
      } catch {
        // Storage can be full or blocked; preferences are optional.
      }
    },
    remove(key) {
      try {
        storage?.removeItem(PREFIX + key)
      } catch {
        // Ignore blocked storage.
      }
    },
  }
}

export function createMemoryPreferenceStore(): PreferenceStore {
  const values = new Map<PreferenceKey, unknown>()
  return {
    get<K extends PreferenceKey>(key: K) {
      return values.get(key) as PreferenceValues[K] | undefined
    },
    set(key, value) {
      values.set(key, value)
    },
    remove(key) {
      values.delete(key)
    },
  }
}
