/** UI preferences only. Never PHI (section 3). */
export interface PreferenceValues {
  readonly lastFacilityId: string
  readonly sidebarCollapsed: boolean
}
export type PreferenceKey = keyof PreferenceValues

export interface PreferenceStore {
  get<K extends PreferenceKey>(key: K): PreferenceValues[K] | undefined
  set<K extends PreferenceKey>(key: K, value: PreferenceValues[K]): void
  remove(key: PreferenceKey): void
}
