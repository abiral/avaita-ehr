import { expect, test } from '@playwright/test'
import { expectNoPhiInStorage, openWorkspace, signIn, switchUser } from './helpers'

test('Flow 8: refill request, safety check with double confirmation, approval reaches the patient', async ({
  page,
}) => {
  await signIn(page, 'patient', '/portal/medicines')
  const panel = page.getByRole('complementary', { name: 'Request a refill' })
  await expect(panel.getByText('Atorvastatin 20 mg tablet')).toBeVisible()
  await panel.getByRole('button', { name: /^30 days/ }).click()
  await panel.getByLabel('Anything your doctor should know?').fill('No side effects.')
  await panel.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByText(/Request for Atorvastatin 20 mg tablet sent to Dr\. Prakash Karki/)).toBeVisible()

  await switchUser(page, 'staff')
  await openWorkspace(page)
  await page.getByRole('link', { name: /Medication requests/ }).click()
  const requests = page.getByRole('navigation', { name: 'Requests' })
  await expect(requests.getByRole('button', { name: /Atorvastatin 20 mg tablet/ })).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Losartan 50 mg tablet' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Safety checks' }).getByText('Potassium check')).toBeVisible()
  await page.getByRole('button', { name: 'Approve and send' }).click()
  const dialog = page.getByRole('alertdialog', { name: 'Approve despite a safety check?' })
  await expect(dialog).toContainText('Ramesh Pandey (NVG-188240)')
  await expect(dialog).toContainText('Potassium check')
  await dialog.getByRole('button', { name: 'Approve for Ramesh Pandey, NVG-188240' }).click()
  await expect(
    page.getByText(/Approved by Dr\. Anaya Shrestha at .*the patient was notified in the portal\./),
  ).toBeVisible()

  await requests.getByRole('button', { name: /Atorvastatin 20 mg tablet/ }).click()
  await page.getByRole('button', { name: 'Approve and send' }).click()
  await expect(page.getByText(/Approved by Dr\. Anaya Shrestha/)).toBeVisible()
  await expectNoPhiInStorage(page)

  await switchUser(page, 'patient')
  await page.getByRole('link', { name: 'Medicines' }).click()
  const losartan = page.getByRole('article', { name: 'Losartan 50 mg tablet' })
  await expect(losartan.getByText('Refill approved')).toBeVisible()
  await expect(
    page.getByRole('article', { name: 'Atorvastatin 20 mg tablet' }).getByText('Refill approved'),
  ).toBeVisible()
})
