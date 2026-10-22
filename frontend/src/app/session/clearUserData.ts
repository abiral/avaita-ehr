import type { Services } from '../services'

/** Sign out, lock timeout and facility switch all drop cached PHI (section 3, rule 6). */
export function clearUserData(services: Pick<Services, 'queryClient' | 'drafts' | 'realtime'>): void {
  services.queryClient.clear()
  services.drafts.clear()
  services.realtime.close()
}
