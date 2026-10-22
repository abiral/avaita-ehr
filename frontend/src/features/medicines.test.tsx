import { screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/renderWithServices'
import { expectNoA11yViolations } from '@/test/a11y'

describe('P9 medicines', () => {
  it('shows supply and refill progress, and requests a refill', async () => {
    const { user, db, container } = renderApp({ as: 'patient', route: '/portal/medicines' })
    expect(await screen.findByText('Sulfa drugs')).toBeInTheDocument()
    const losartan = screen.getByRole('article', { name: /Losartan/ })
    expect(within(losartan).getByText('Refill requested')).toBeInTheDocument()
    expect(within(losartan).getByRole('list', { name: 'Refill progress' })).toBeInTheDocument()
    const panel = screen.getByRole('complementary', { name: 'Request a refill' })
    expect(within(panel).getByText('Atorvastatin 20 mg tablet')).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await user.click(within(panel).getByRole('button', { name: /^60 days/ }))
    await user.click(within(panel).getByRole('button', { name: /^Home delivery/ }))
    await user.type(within(panel).getByLabelText('Anything your doctor should know?'), 'No side effects.')
    await user.click(within(panel).getByRole('button', { name: 'Send request' }))
    expect(
      await screen.findByText(/Request for Atorvastatin 20 mg tablet sent to Dr. Prakash Karki/),
    ).toBeInTheDocument()
    expect(db.refills.at(-1)).toMatchObject({
      medicationId: 'med_ator',
      quantityDays: 60,
      pickup: 'home-delivery',
      note: 'No side effects.',
    })
    expect(await screen.findAllByText('Refill requested')).toHaveLength(2)
  })

  it('lists past medicines', async () => {
    renderApp({ as: 'patient', route: '/portal/medicines' })
    expect(await screen.findByText('Amoxicillin 500 mg capsule')).toBeInTheDocument()
    expect(screen.getAllByText('Ended 12 Aug')).toHaveLength(2)
  })
})

describe('C9 medication requests', () => {
  it('lists the fired safety check and needs a second confirmation naming it and the patient', async () => {
    const { user, db, container } = renderApp({ as: 'staff', route: '/staff/medication-requests' })
    expect(await screen.findByRole('heading', { name: 'Losartan 50 mg tablet' })).toBeInTheDocument()
    const checks = screen.getByRole('list', { name: 'Safety checks' })
    expect(within(checks).getByText('Potassium check')).toBeInTheDocument()
    expect(
      within(checks).getByText(/Potassium 5.3 mmol\/L .*Losartan 50 mg tablet can raise potassium/),
    ).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Approve and send' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Approve despite a safety check?' })
    expect(
      within(dialog).getByText(/For Ramesh Pandey \(NVG-188240\)\. These checks fired: Potassium check\./),
    ).toBeInTheDocument()
    const back = within(dialog).getAllByRole('button', { name: 'Go back' }).at(-1)
    if (!back) throw new Error('expected a cancel button')
    await user.click(back)
    expect(db.refills.find((r) => r.id === 'rq_los')?.status).toBe('requested')
    await user.click(screen.getByRole('button', { name: 'Approve and send' }))
    await user.click(await screen.findByRole('button', { name: 'Approve for Ramesh Pandey, NVG-188240' }))
    expect(await screen.findByText(/Approved by Dr. Anaya Shrestha at .*E-prescription sent/)).toBeInTheDocument()
    expect(db.refills.find((r) => r.id === 'rq_los')).toMatchObject({
      status: 'approved',
      decidedBy: 'Dr. Anaya Shrestha',
    })
  })

  it('changes a dose (dose required) and declines another request', async () => {
    const { user, db } = renderApp({ as: 'staff', route: '/staff/medication-requests' })
    await user.click(await screen.findByRole('button', { name: /Laxmi Thapa/ }))
    await user.click(screen.getByRole('button', { name: 'Change dose' }))
    await user.click(screen.getByRole('button', { name: 'Send new prescription' }))
    expect(screen.getByText('Enter the new dose.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('New dose'), 'Amlodipine 5 mg once daily')
    await user.click(screen.getByRole('button', { name: 'Send new prescription' }))
    await waitFor(() => expect(db.refills.find((r) => r.id === 'rq_laxmi')?.status).toBe('changed'))
    await user.click(screen.getByRole('button', { name: /Rajan KC/ }))
    await user.click(screen.getByRole('button', { name: 'Decline' }))
    await user.selectOptions(screen.getByLabelText('Reason shown to the patient'), 'Duplicate request')
    await user.click(screen.getByRole('button', { name: 'Decline request' }))
    expect(await screen.findByText(/Declined by Dr. Anaya Shrestha/)).toBeInTheDocument()
    expect(db.refills.find((r) => r.id === 'rq_rajan')?.status).toBe('declined')
  })
})
