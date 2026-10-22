import { screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/renderWithServices'
import { expectNoA11yViolations } from '@/test/a11y'

describe('P6 consultation packages', () => {
  it('browses, filters and searches published packages', async () => {
    const { user, container } = renderApp({ as: 'patient', route: '/portal/packages' })
    const grid = await screen.findByRole('list', { name: 'Consultation packages' })
    expect(within(grid).getAllByRole('article')).toHaveLength(6)
    expect(within(grid).queryByText('Knee pain programme')).not.toBeInTheDocument()
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Cardiology' }))
    expect(within(grid).getAllByRole('article')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'All' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search packages' }), 'zzz')
    expect(await screen.findByText(/No packages match/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Book a single appointment instead' })).toHaveAttribute(
      'href',
      '/portal/book',
    )
  })

  it('books a hybrid package with an on-site first visit', async () => {
    const { user, db, container } = renderApp({ as: 'patient', route: '/portal/packages' })
    await user.click(await screen.findByRole('button', { name: 'View package: Kidney care, 3 months' }))
    expect(screen.getByRole('heading', { name: 'Kidney care, 3 months' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hybrid/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Book package' })).toBeDisabled()
    const times = screen.getByRole('group', { name: 'First visit' })
    const first = (await within(times).findAllByRole('button'))[0]
    if (!first) throw new Error('expected first visit times')
    await user.click(first)
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Book package' }))
    expect(await screen.findByRole('heading', { name: 'Package booked' })).toBeInTheDocument()
    expect(
      screen.getByText(/Kidney care, 3 months with Dr. Prakash Karki\. First visit .*, hybrid\./),
    ).toBeInTheDocument()
    const enrollment = db.enrollments.at(-1)
    expect(enrollment).toMatchObject({ packageId: 'pkg_kidney', chosenFormat: 'hybrid' })
    expect(db.appointments.find((a) => a.id === enrollment?.firstAppointmentId)).toMatchObject({ mode: 'onsite' })
    expect(screen.getByRole('link', { name: 'Go to my appointments' })).toHaveAttribute('href', '/portal/appointments')
  })

  it('lets the patient choose remote when the package allows it', async () => {
    const { user, db } = renderApp({ as: 'patient', route: '/portal/packages' })
    await user.click(await screen.findByRole('button', { name: 'View package: Diabetes review' }))
    expect(screen.getByRole('button', { name: /^On-site/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /^Remote/ }))
    const times = screen.getByRole('group', { name: 'First visit' })
    const first = (await within(times).findAllByRole('button'))[0]
    if (!first) throw new Error('expected first visit times')
    await user.click(first)
    await user.click(screen.getByRole('button', { name: 'Book package' }))
    expect(await screen.findByRole('heading', { name: 'Package booked' })).toBeInTheDocument()
    const enrollment = db.enrollments.at(-1)
    expect(db.appointments.find((a) => a.id === enrollment?.firstAppointmentId)).toMatchObject({ mode: 'remote' })
    await user.click(screen.getByRole('link', { name: 'Go to my appointments' }))
    expect(await screen.findByRole('heading', { name: 'My appointments' })).toBeInTheDocument()
  })
})

describe('A3 package editor', () => {
  it('edits with a live preview and publishes to the portal', async () => {
    const { user, db, container } = renderApp({ as: 'admin', route: '/admin/packages' })
    expect(await screen.findByRole('heading', { name: 'Edit package' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Knee pain programme, Dr. Suresh Bhattarai, Draft' }))
    const preview = screen.getByRole('complementary', { name: 'Patient preview' })
    expect(within(preview).getByRole('heading', { name: 'Knee pain programme' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
    const name = screen.getByLabelText('Package name')
    await user.clear(name)
    await user.type(name, 'Knee care programme')
    expect(within(preview).getByRole('heading', { name: 'Knee care programme' })).toBeInTheDocument()
    await user.click(
      within(screen.getByRole('group', { name: 'Visit format' })).getByRole('button', { name: 'Remote' }),
    )
    expect(within(preview).getByText('Remote')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Item to add'), 'ECG')
    await user.click(screen.getByRole('button', { name: 'Add item' }))
    expect(within(preview).getByText('ECG')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(await screen.findByText('Published to the patient portal')).toBeInTheDocument()
    await waitFor(() =>
      expect(db.packages.find((p) => p.id === 'pkg_knee')).toMatchObject({
        name: 'Knee care programme',
        published: true,
        format: 'remote',
      }),
    )
    expect(
      screen.getByRole('button', { name: 'Knee care programme, Dr. Suresh Bhattarai, Published' }),
    ).toBeInTheDocument()
  })

  it('creates a new draft and blocks saving without a name or items', async () => {
    const { user, db } = renderApp({ as: 'admin', route: '/admin/packages' })
    await screen.findByRole('heading', { name: 'Edit package' })
    await user.click(screen.getByRole('button', { name: 'New package' }))
    expect(screen.getByRole('heading', { name: 'New package', level: 2 })).toBeInTheDocument()
    expect(
      within(screen.getByRole('complementary', { name: 'Patient preview' })).getByRole('heading', {
        name: 'Untitled package',
      }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove 1 consultation' }))
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(screen.getByText('Give the package a name.')).toBeInTheDocument()
    expect(screen.getByText('Add at least one item.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Package name'), 'Back pain review')
    await user.click(screen.getByRole('button', { name: 'Add item' }))
    const before = db.packages.length
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(await screen.findByText('Saved as draft')).toBeInTheDocument()
    expect(db.packages).toHaveLength(before + 1)
    expect(db.packages.at(-1)).toMatchObject({ name: 'Back pain review', published: false, monthlyCap: 20 })
  })

  it('is forbidden without the package admin permission', async () => {
    renderApp({ as: 'staff', route: '/admin/packages' })
    expect(await screen.findByRole('heading', { name: 'You do not have access' })).toBeInTheDocument()
  })
})
