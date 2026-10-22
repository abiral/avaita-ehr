import { expect, test } from '@playwright/test'
import { expectNoPhiInStorage, openWorkspace, signIn, switchUser } from './helpers'

test('Flow 7: note, lab order, realtime critical result, review and release to the portal', async ({ page }) => {
  await signIn(page, 'staff')
  await openWorkspace(page)
  await page.getByRole('link', { name: 'Schedule' }).click()
  await page.getByRole('button', { name: 'Wednesday, 21 October' }).click()
  await page.getByRole('link', { name: /^Ramesh Pandey, 10:20/ }).click()
  const banner = page.getByRole('region', { name: 'Patient' })
  await expect(banner.getByRole('heading', { name: 'Ramesh Pandey' })).toBeVisible()
  await expect(banner.getByText('NVG-188240')).toBeVisible()

  await banner.getByRole('link', { name: 'New consultation note' }).click()
  await page.getByLabel('Reason for consultation').fill('Kidney follow-up, potassium 5.3 last week.')
  await page.getByLabel('Assessment').fill('CKD 3b with mild hyperkalaemia.')
  await page.getByRole('button', { name: 'Sign note' }).click()
  await expect(page.getByText(/Signed at .* by Dr\. Anaya Shrestha\./)).toBeVisible()

  await banner.getByRole('link', { name: 'Order labs' }).click()
  await page.getByRole('button', { name: 'Add Renal function panel' }).click()
  await page.getByLabel('Clinical indication').fill('CKD 3b, potassium 5.3')
  await page.getByRole('button', { name: 'Sign and send' }).click()
  await expect(page.getByText('Orders signed and sent to the laboratory')).toBeVisible()

  const alerts = page.getByRole('region', { name: 'Critical results' })
  await expect(alerts.getByText('Critical result for Ramesh Pandey: Potassium 6.3 mmol/L.')).toBeVisible()
  await alerts.getByRole('link', { name: 'Review result' }).click()
  await expect(page.getByRole('heading', { name: 'Renal function panel' })).toBeVisible()
  await page
    .getByLabel('Comment for the patient portal')
    .fill('Your potassium is high. Please come in today for a repeat test.')
  await page.getByRole('button', { name: 'Acknowledge result' }).click()
  await expect(page.getByText('Report and comment released to the patient portal.')).toBeVisible()
  await expect(alerts).toBeHidden()
  await expectNoPhiInStorage(page)

  await switchUser(page, 'patient')
  await page.getByRole('link', { name: 'Lab reports' }).click()
  const reports = page.getByRole('navigation', { name: 'Reports' })
  await expect(reports.getByRole('button', { name: /Renal function panel.*New/ })).toBeVisible()
  await expect(page.getByText('Your potassium is high. Please come in today for a repeat test.')).toBeVisible()
  await expect(page.getByText('Note from Dr. Anaya Shrestha')).toBeVisible()
})
