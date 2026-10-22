import { expect, test } from '@playwright/test'
import { expectNoPhiInStorage, signIn, switchUser } from './helpers'

test.describe('Flow 4: consultation packages', () => {
  test('an admin publishes a package and the patient finds it in the portal', async ({ page }) => {
    await signIn(page, 'admin', '/admin/packages')
    await page.getByRole('button', { name: 'Knee pain programme, Dr. Suresh Bhattarai, Draft' }).click()
    await expect(page.getByRole('complementary', { name: 'Patient preview' })).toContainText('Knee pain programme')
    await page.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(page.getByText('Published to the patient portal')).toBeVisible()

    await switchUser(page, 'patient')
    await page.getByRole('navigation', { name: 'Patient portal' }).getByRole('link', { name: 'Appointments' }).click()
    await page.getByRole('link', { name: 'Book an appointment' }).click()
    await page.getByRole('link', { name: 'Consultation packages' }).click()
    await page.getByRole('button', { name: 'Orthopaedics' }).click()
    await expect(page.getByRole('button', { name: 'View package: Knee pain programme' })).toBeVisible()
    await expectNoPhiInStorage(page)
  })

  test('a patient books a hybrid package; the first visit is on-site inside the doctor blocks', async ({ page }) => {
    await signIn(page, 'patient', '/portal/packages')
    await page.getByRole('searchbox', { name: 'Search packages' }).fill('kidney')
    await page.getByRole('button', { name: 'View package: Kidney care, 3 months' }).click()
    await expect(page.getByRole('button', { name: /Hybrid/ })).toHaveAttribute('aria-pressed', 'true')
    const first = page.getByRole('group', { name: 'First visit' }).getByRole('button').first()
    const when = (await first.textContent()) ?? ''
    await first.click()
    await page.getByRole('button', { name: 'Book package' }).click()
    await expect(page.getByRole('heading', { name: 'Package booked' })).toBeVisible()
    await expect(page.getByText(`First visit ${when}, hybrid.`)).toBeVisible()
    await page.getByRole('link', { name: 'Go to my appointments' }).click()
    await expect(page.getByText(/Kidney care, 3 months/).first()).toBeVisible()
    await expectNoPhiInStorage(page)
  })
})
