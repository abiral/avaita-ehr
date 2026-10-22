import { test as base, expect } from '@playwright/test'
import { expectNoPhiInStorage } from './helpers'

/** Fictional identifiers from the seed data that must never appear in an address or request URL. */
const PHI_MARKERS = ['Ramesh', 'Pandey', 'Ram Bahadur', 'Thapa', 'Kamala', 'NVG-']

/**
 * Runs after every e2e test (section 3): nothing but allow-listed preferences in browser storage,
 * and no patient name or MRN in any page address or API request URL.
 */
export const test = base.extend<{ phiGuard: undefined }>({
  phiGuard: [
    async ({ page }, use) => {
      const urls: string[] = []
      page.on('framenavigated', (frame) => urls.push(frame.url()))
      page.on('request', (request) => urls.push(request.url()))
      await use(undefined)
      await expectNoPhiInStorage(page)
      const leaks = urls.filter((u) => PHI_MARKERS.some((m) => decodeURIComponent(u).includes(m)))
      expect(leaks, 'patient identifiers in URLs').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
