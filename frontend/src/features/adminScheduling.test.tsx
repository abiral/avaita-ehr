import { screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/renderWithServices'
import { expectNoA11yViolations } from '@/test/a11y'

describe('A1 appointment blocks', () => {
  it('shows the weekly template with slot counts and saves a new block', async () => {
    const { user, container, db } = renderApp({ as: 'admin', route: '/admin/availability' })
    expect(await screen.findByRole('heading', { name: 'Dr. Prakash Karki · weekly template' })).toBeInTheDocument()
    expect(await screen.findByText('60 bookable slots a week · 33 on-site, 27 remote')).toBeInTheDocument()
    expect(screen.getAllByText('On-site · Room 5 · 20 min · 9 slots').length).toBeGreaterThan(0)
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Add block on Sat' }))
    expect(screen.getByText('Creates 9 slots of 20 min on Sat, 09:00 to 12:00 · On-site.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save block' }))
    expect(
      await screen.findByText('Block saved for Dr. Prakash Karki on Sat. New slots are live in the patient portal.'),
    ).toBeInTheDocument()
    expect(db.blocks.filter((b) => b.practitionerId === 'pr_karki' && b.weekday === 6)).toHaveLength(1)
    expect(await screen.findByText('69 bookable slots a week · 42 on-site, 27 remote')).toBeInTheDocument()
  })

  it('rejects an overlapping block and an empty day choice, and saves booking rules', async () => {
    const { user, db } = renderApp({ as: 'admin', route: '/admin/availability' })
    await screen.findByText('60 bookable slots a week · 33 on-site, 27 remote')
    await user.click(screen.getByRole('button', { name: 'Add block on Mon' }))
    await user.click(screen.getByRole('button', { name: 'Save block' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This overlaps an existing block on Mon')
    await user.click(screen.getByRole('button', { name: 'Mon', pressed: true }))
    expect(screen.getByText('Choose at least one day.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save block' })).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Patients can book up to'), '30')
    await waitFor(() => expect(db.rules.maxDaysAhead).toBe(30))
    expect(await screen.findByText('Booking rules saved.')).toBeInTheDocument()
  })

  it('switches doctors and removes a block', async () => {
    const { user, db } = renderApp({ as: 'admin', route: '/admin/availability' })
    await user.click(await screen.findByRole('button', { name: /Dr. Nisha Pradhan/ }))
    expect(await screen.findByRole('heading', { name: 'Dr. Nisha Pradhan · weekly template' })).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Find a doctor' }), 'cardio')
    expect(
      screen.getAllByRole('button', { name: /Dr\./ }).filter((b) => b.getAttribute('aria-pressed') !== null),
    ).toHaveLength(1)
    await user.clear(screen.getByRole('searchbox', { name: 'Find a doctor' }))
    await user.click(screen.getByRole('button', { name: /Dr. Prakash Karki/ }))
    await user.click(await screen.findByRole('button', { name: 'Remove block Sun 10:00 to 12:00' }))
    await waitFor(() => expect(db.blocks.some((b) => b.practitionerId === 'pr_karki' && b.weekday === 7)).toBe(false))
  })

  it('is forbidden for staff without the scheduling admin permission', async () => {
    renderApp({ as: 'staff', route: '/admin/availability' })
    expect(await screen.findByRole('heading', { name: 'You do not have access' })).toBeInTheDocument()
  })
})

describe('A2 leave and blocked time', () => {
  it('shows the month with leave marks and upcoming entries', async () => {
    const { user, container } = renderApp({ as: 'admin', route: '/admin/time-off' })
    expect(await screen.findByRole('heading', { name: 'October 2026' })).toBeInTheDocument()
    expect((await screen.findAllByText('PK Conference')).length).toBe(3)
    const upcoming = screen.getByRole('region', { name: 'Upcoming leave and blocks' })
    expect(within(upcoming).getByText('Mon 26 to Wed 28 Oct · Conference or training')).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(await screen.findByRole('heading', { name: 'November 2026' })).toBeInTheDocument()
  })

  it('checks the impact, lists affected patients, then blocks and notifies them', async () => {
    const { user, db } = renderApp({ as: 'admin', route: '/admin/time-off' })
    await screen.findByRole('option', { name: 'Dr. Sabina Thapa Magar' })
    await user.selectOptions(screen.getByLabelText('Doctor'), 'pr_sabina')
    await user.clear(screen.getByLabelText('From'))
    await user.type(screen.getByLabelText('From'), '2026-10-29')
    await user.clear(screen.getByLabelText('To'))
    await user.type(screen.getByLabelText('To'), '2026-10-30')
    await user.click(screen.getByRole('button', { name: 'Check impact' }))
    expect(
      await screen.findByText('4 booked appointments fall inside Thu 29 to Fri 30 Oct. 20 open slots will be removed.'),
    ).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Affected appointments' })
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([
      'Gita ShresthaThu 29 Oct 09:20',
      'Prakash LamaThu 29 Oct 10:40',
      'Sunita KCFri 30 Oct 09:00',
      'Bishnu TamangFri 30 Oct 11:20',
    ])
    await user.click(screen.getByRole('button', { name: 'Block and notify 4 patients' }))
    expect(
      await screen.findByText('Dr. Sabina Thapa Magar is blocked Thu 29 to Fri 30 Oct. 4 patients notified.'),
    ).toBeInTheDocument()
    expect(db.appointments.filter((a) => a.practitionerId === 'pr_sabina' && a.status === 'cancelled')).toHaveLength(4)
    await user.click(screen.getByRole('button', { name: 'Block more time' }))
    expect(screen.getByRole('button', { name: 'Check impact' })).toBeInTheDocument()
  })

  it('requires a covering doctor to move patients, and blocks part of a day', async () => {
    const { user, db } = renderApp({ as: 'admin', route: '/admin/time-off' })
    await screen.findByRole('heading', { name: 'October 2026' })
    await user.click(screen.getByRole('radio', { name: /Move to a covering doctor/ }))
    await user.click(screen.getByRole('button', { name: 'Check impact' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a covering doctor')
    await user.click(screen.getByRole('radio', { name: /Keep them/ }))
    await user.click(screen.getByRole('button', { name: 'Part of day' }))
    await user.clear(screen.getByLabelText('From'))
    await user.type(screen.getByLabelText('From'), '2026-10-23')
    await user.click(screen.getByRole('button', { name: 'Check impact' }))
    await user.click(await screen.findByRole('button', { name: 'Block time' }))
    await waitFor(() =>
      expect(
        db.timeOff.some(
          (o) => o.practitionerId === 'pr_karki' && o.kind === 'part' && o.start === '2026-10-23T07:15:00.000Z',
        ),
      ).toBe(true),
    )
  })
})
