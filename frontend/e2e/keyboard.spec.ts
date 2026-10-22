import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { signIn } from './helpers'

const MAX_TABS = 120

/** Presses Tab until the target has focus; fails when it cannot be reached by keyboard. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  await target.waitFor()
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((el) => el === document.activeElement)) return
  }
  throw new Error('Not reachable with the Tab key')
}

async function activate(page: Page, target: Locator): Promise<void> {
  await tabTo(page, target)
  await page.keyboard.press('Enter')
}

test.describe('Keyboard only', () => {
  test('book an appointment', async ({ page }) => {
    await signIn(page, 'patient', '/portal/book')
    await tabTo(page, page.getByRole('searchbox', { name: 'Search doctors' }))
    await page.keyboard.type('kidney')
    await activate(page, page.getByRole('button', { name: 'Select Dr. Prakash Karki' }))
    await activate(page, page.getByRole('button', { name: /On-site visit/ }))
    await activate(page, page.getByRole('button', { name: 'Continue' }))
    await activate(page, page.getByRole('button', { name: /Thursday, 22 October, \d+ free/ }))
    const times = page.getByRole('group', { name: 'Available times on Thursday, 22 October' })
    await activate(page, times.getByRole('button', { disabled: false }).first())
    await activate(page, page.getByRole('button', { name: 'Continue' }))
    await activate(page, page.getByRole('button', { name: 'Confirm booking' }))
    await expect(page.getByRole('heading', { name: 'Appointment booked' })).toBeVisible()
  })

  test('cancel an appointment with a reason', async ({ page }) => {
    await signIn(page, 'patient', '/portal/appointments')
    await activate(page, page.getByRole('button', { name: /Cancel appointment on Wednesday 21 Oct/ }))
    const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?' })
    await expect(dialog).toBeVisible()
    const target = dialog.getByRole('radio', { name: 'The time no longer works' })
    await tabTo(page, dialog.getByRole('radio').first())
    for (let i = 0; i < 4 && !(await target.isChecked()); i++) await page.keyboard.press('ArrowDown')
    await expect(target).toBeChecked()
    await activate(page, dialog.getByRole('button', { name: 'Cancel appointment' }))
    await expect(page.getByText(/The slot has been released\./)).toBeVisible()
  })

  test('decide a refill request', async ({ page }) => {
    await signIn(page, 'staff')
    await activate(page, page.getByRole('button', { name: 'Open workspace' }))
    await activate(
      page,
      page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: /Medication requests/ }),
    )
    await expect(page.getByRole('heading', { name: 'Losartan 50 mg tablet' })).toBeVisible()
    await activate(page, page.getByRole('button', { name: 'Approve and send' }))
    const dialog = page.getByRole('alertdialog', { name: 'Approve despite a safety check?' })
    await expect(dialog).toBeVisible()
    await activate(page, dialog.getByRole('button', { name: 'Approve for Ramesh Pandey, NVG-188240' }))
    await expect(page.getByText(/Approved by Dr\. Anaya Shrestha/)).toBeVisible()
  })
})
