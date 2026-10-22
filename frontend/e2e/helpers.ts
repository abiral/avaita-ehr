import { expect, type Page } from '@playwright/test'

export const ACCOUNTS = {
  patient: 'ramesh.pandey@mail.com',
  staff: 'anaya.shrestha@northvale.health',
  admin: 'sarita.joshi@northvale.health',
} as const

const ALLOWED_KEYS = ['folio.pref.lastFacilityId', 'folio.pref.sidebarCollapsed']

export async function signIn(page: Page, who: keyof typeof ACCOUNTS, returnTo?: string): Promise<void> {
  await page.goto(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login')
  await fillSignIn(page, who)
}

/**
 * Signs out and in as someone else without reloading: the mock database lives in the page,
 * so a reload would reset what the previous user changed.
 */
export async function switchUser(page: Page, who: keyof typeof ACCOUNTS): Promise<void> {
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
  await fillSignIn(page, who)
}

async function fillSignIn(page: Page, who: keyof typeof ACCOUNTS): Promise<void> {
  if (who !== 'patient') await page.getByRole('button', { name: 'Hospital staff' }).click()
  await page.getByLabel(who === 'patient' ? 'Email or mobile number' : 'Work email').fill(ACCOUNTS[who])
  await page.getByLabel('Password', { exact: true }).fill('demo-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

/** Staff with several facilities pick Northvale General on C1. */
export async function openWorkspace(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Select a workspace' })).toBeVisible()
  await page.getByRole('button', { name: 'Open workspace' }).click()
  await expect(page).toHaveURL(/\/staff$/)
}

/** PHI rule: nothing but allow-listed UI preferences in browser storage, and no JS cookies. */
export async function expectNoPhiInStorage(page: Page): Promise<void> {
  const stored = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    session: Object.keys(window.sessionStorage),
    cookie: document.cookie,
  }))
  expect(stored.local.filter((k) => !ALLOWED_KEYS.includes(k))).toEqual([])
  expect(stored.session).toEqual([])
  expect(stored.cookie).toBe('')
}
