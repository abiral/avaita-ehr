import { screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/renderWithServices'
import { expectNoA11yViolations } from '@/test/a11y'

describe('P5 book an appointment', () => {
  it('finds a doctor by concern and books an on-site slot', async () => {
    const { user, db, container } = renderApp({ as: 'patient', route: '/portal/book' })
    await user.type(await screen.findByRole('searchbox', { name: 'Search doctors' }), 'kidney')
    expect(await screen.findByText('1 doctor')).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Select Dr. Prakash Karki' }))
    await user.click(await screen.findByRole('button', { name: /On-site visit/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(await screen.findByRole('button', { name: /Thursday, 22 October, \d+ free/ }))
    const times = screen.getByRole('group', { name: 'Available times on Thursday, 22 October' })
    const first = within(times)
      .getAllByRole('button')
      .find((b) => !b.hasAttribute('disabled'))
    if (!first) throw new Error('no open slot')
    await user.click(first)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(screen.getByLabelText(/Reason for visit/), 'Kidney follow-up')
    const before = db.appointments.length
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))
    expect(await screen.findByRole('heading', { name: 'Appointment booked' })).toBeInTheDocument()
    expect(db.appointments).toHaveLength(before + 1)
    expect(db.appointments.at(-1)).toMatchObject({ practitionerId: 'pr_karki', patientId: 'pt_ramesh', mode: 'onsite' })
  })

  it('shows leave days as unavailable in the date strip', async () => {
    const { user } = renderApp({ as: 'patient', route: '/portal/book' })
    await user.click(await screen.findByRole('button', { name: 'Select Dr. Prakash Karki' }))
    await user.click(await screen.findByRole('button', { name: /On-site visit/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('button', { name: 'Monday, 26 October, On leave' })).toBeDisabled()
  })
})

describe('P7 my appointments', () => {
  it('cancels with a reason, releases the slot and undoes', async () => {
    const { user, db, container } = renderApp({ as: 'patient', route: '/portal/appointments' })
    const cancel = await screen.findByRole('button', { name: /Cancel appointment on Wednesday 21 Oct/ })
    await expectNoA11yViolations(container)
    await user.click(cancel)
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this appointment?' })
    await user.click(within(dialog).getByRole('radio', { name: 'The time no longer works' }))
    await user.click(within(dialog).getByRole('button', { name: 'Cancel appointment' }))
    expect(await screen.findByText(/was cancelled\. The slot has been released\./)).toBeInTheDocument()
    expect(db.appointments.find((a) => a.id === 'ap_r1')).toMatchObject({
      status: 'cancelled',
      cancelReason: 'time-no-longer-works',
    })
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(await screen.findByText('Your appointment is booked again.')).toBeInTheDocument()
    await waitFor(() => expect(db.appointments.find((a) => a.id === 'ap_r1')?.status).toBe('booked'))
  })

  it('lists past visits', async () => {
    const { user } = renderApp({ as: 'patient', route: '/portal/appointments' })
    await user.click(await screen.findByRole('tab', { name: 'Past' }))
    expect(await screen.findAllByText(/Completed|Cancelled by you/)).not.toHaveLength(0)
  })
})

describe('C4 clinic schedule', () => {
  it('shows each clinician day with visits, blocked time and a released slot', async () => {
    const { container } = renderApp({ as: 'staff', route: '/staff/schedule' })
    const anaya = await screen.findByRole('list', { name: 'Dr. Anaya Shrestha, Tuesday, 20 October' })
    expect(within(anaya).getByRole('link', { name: /Laxmi Thapa, 10:00/ })).toHaveAttribute(
      'href',
      '/staff/patients/pt_laxmi',
    )
    expect(within(anaya).getByText('Inpatient round · Ward 4B')).toBeInTheDocument()
    const karki = screen.getByRole('list', { name: 'Dr. Prakash Karki, Tuesday, 20 October' })
    expect(within(karki).getByText('Cancelled by patient · slot open')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Current time 14:20' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('pages to another day and shows leave', async () => {
    const { user } = renderApp({ as: 'staff', route: '/staff/schedule' })
    await screen.findByRole('list', { name: /Dr. Prakash Karki, Tuesday/ })
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    const karki = await screen.findByRole('list', { name: 'Dr. Prakash Karki, Tuesday, 27 October' })
    expect(await within(karki).findByText('On leave')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Current time/ })).not.toBeInTheDocument()
  })

  it('books on behalf of a patient', async () => {
    const { user, db } = renderApp({ as: 'staff', route: '/staff/schedule' })
    await screen.findByRole('list', { name: /Dr. Anaya Shrestha/ })
    await user.type(screen.getByRole('combobox', { name: 'Patient' }), 'Kamala')
    await user.click(await screen.findByRole('option', { name: /Kamala Adhikari/ }))
    expect(screen.getByText('NVG-187215')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Clinician'), 'Dr. Anaya Shrestha')
    const slots = await screen.findByRole('group', { name: 'Suggested times' })
    const second = (await within(slots).findAllByRole('button'))[1]
    if (!second) throw new Error('expected suggestions')
    await user.click(second)
    await user.type(screen.getByLabelText('Note'), 'Post-discharge review')
    const before = db.appointments.length
    await user.click(screen.getByRole('button', { name: /^Book / }))
    expect(await screen.findByText(/Booked Kamala Adhikari with Dr. Anaya Shrestha/)).toBeInTheDocument()
    expect(db.appointments).toHaveLength(before + 1)
    expect(db.appointments.at(-1)).toMatchObject({
      patientId: 'pt_kamala',
      practitionerId: 'pr_anaya',
      reason: 'Follow-up · Post-discharge review',
    })
  })
})
