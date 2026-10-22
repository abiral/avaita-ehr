import { expect, test } from '@playwright/test'
import { expectNoPhiInStorage, openWorkspace, signIn, switchUser } from './helpers'

test.describe('Flow 2 and 3: book, cancel, see the slot open in the clinic schedule', () => {
  test('a patient finds a doctor, chooses on-site, picks a slot and confirms', async ({ page }) => {
    await signIn(page, 'patient', '/portal/book')
    await page.getByRole('searchbox', { name: 'Search doctors' }).fill('kidney')
    await expect(page.getByText('1 doctor', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Select Dr. Prakash Karki' }).click()
    await page.getByRole('button', { name: /On-site visit/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: /Thursday, 22 October, \d+ free/ }).click()
    await page
      .getByRole('group', { name: 'Available times on Thursday, 22 October' })
      .getByRole('button', { disabled: false })
      .first()
      .click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel(/Reason for visit/).fill('Kidney follow-up')
    await page.getByRole('button', { name: 'Confirm booking' }).click()
    await expect(page.getByRole('heading', { name: 'Appointment booked' })).toBeVisible()
    await page.getByRole('link', { name: 'View my appointments' }).click()
    await expect(page.getByRole('heading', { name: 'My appointments' })).toBeVisible()
    await expect(page.getByText(/Thursday 22 Oct/).first()).toBeVisible()
    await expectNoPhiInStorage(page)
  })

  test('a patient cancels and the clinic schedule shows the slot open', async ({ page }) => {
    await signIn(page, 'patient', '/portal/appointments')
    await page.getByRole('button', { name: /Cancel appointment on Wednesday 21 Oct/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?' })
    await dialog.getByRole('radio', { name: 'The time no longer works' }).check()
    await dialog.getByRole('button', { name: 'Cancel appointment' }).click()
    await expect(page.getByText(/The slot has been released\./)).toBeVisible()

    await switchUser(page, 'staff')
    await openWorkspace(page)
    await page.getByRole('link', { name: 'Schedule' }).click()
    await page.getByRole('button', { name: 'Wednesday, 21 October' }).click()
    const karki = page.getByRole('list', { name: 'Dr. Prakash Karki, Wednesday, 21 October' })
    await expect(
      karki.getByRole('group', { name: 'Ramesh Pandey, 10:20, Cancelled by patient · slot open' }),
    ).toBeVisible()
    await expect(karki.getByText('Cancelled by patient · slot open')).toBeVisible()
    await expectNoPhiInStorage(page)
  })
})
