import { expect, test } from '@playwright/test'
import { expectNoPhiInStorage, signIn, switchUser } from './helpers'

test.describe('Flow 5 and 6: blocks make slots bookable, leave shows as On leave', () => {
  test('an admin adds a Saturday block and the patient can book that day', async ({ page }) => {
    await signIn(page, 'admin', '/admin/availability')
    await expect(page.getByRole('heading', { name: 'Dr. Prakash Karki · weekly template' })).toBeVisible()
    await page.getByRole('button', { name: 'Add block on Sat' }).click()
    await page.getByLabel('Starts').fill('2026-10-20')
    await page.getByRole('button', { name: 'Save block' }).click()
    await expect(page.getByText(/New slots are live in the patient portal\./)).toBeVisible()

    await switchUser(page, 'patient')
    await page.getByRole('link', { name: 'Appointments' }).click()
    await page.getByRole('link', { name: 'Book an appointment' }).click()
    await page.getByRole('button', { name: 'Select Dr. Prakash Karki' }).click()
    await page.getByRole('button', { name: /On-site visit/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('button', { name: /Saturday, 24 October, \d+ free/ })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Sunday, 25 October, Closed' })).toBeDisabled()
    await expectNoPhiInStorage(page)
  })

  test('an admin blocks leave and the booking screen shows those days as On leave', async ({ page }) => {
    await signIn(page, 'admin', '/admin/time-off')
    await expect(page.getByRole('heading', { name: 'October 2026' })).toBeVisible()
    await page.getByLabel('Doctor', { exact: true }).selectOption('pr_karki')
    await page.getByLabel('From', { exact: true }).fill('2026-10-22')
    await page.getByLabel('To', { exact: true }).fill('2026-10-23')
    await page.getByRole('button', { name: 'Check impact' }).click()
    await expect(page.getByRole('button', { name: /^Block (and notify|time)/ })).toBeVisible()
    await page.getByRole('button', { name: /^Block (and notify|time)/ }).click()
    await expect(page.getByText(/Dr. Prakash Karki is blocked Thu 22 to Fri 23 Oct/)).toBeVisible()

    await switchUser(page, 'patient')
    await page.getByRole('link', { name: 'Appointments' }).click()
    await page.getByRole('link', { name: 'Book an appointment' }).click()
    await page.getByRole('button', { name: 'Select Dr. Prakash Karki' }).click()
    await page.getByRole('button', { name: /On-site visit/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('button', { name: 'Thursday, 22 October, On leave' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Friday, 23 October, On leave' })).toBeDisabled()
    await expect(page.getByText(/On leave 22 to 23 Oct, 26 to 28 Oct\./)).toBeVisible()
  })
})
