import { screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderWithServices'
import { expectNoA11yViolations } from '@/test/a11y'

describe('P4 portal home', () => {
  it('greets the patient with the prep reminder, shortcuts, next visit, reports and medicines', async () => {
    const { container } = renderApp({ as: 'patient', route: '/portal' })
    expect(await screen.findByRole('heading', { name: 'Hello, Ramesh' })).toBeInTheDocument()
    expect(await screen.findByText(/Before your blood test on 3 November:/)).toBeInTheDocument()
    const shortcuts = screen.getByRole('navigation', { name: 'Shortcuts' })
    expect(within(shortcuts).getAllByRole('link')).toHaveLength(5)
    expect(await within(shortcuts).findByText('1 new report')).toBeInTheDocument()
    const next = screen.getByRole('region', { name: 'Next appointment' })
    expect(await within(next).findByText('Wednesday, 10:20')).toBeInTheDocument()
    expect(within(next).getByRole('link', { name: 'Add to calendar' })).toHaveAttribute('download', 'appointment.ics')
    const reports = screen.getByRole('region', { name: 'Recent lab reports' })
    expect(await within(reports).findByText('Kidney function panel')).toBeInTheDocument()
    const meds = screen.getByRole('region', { name: 'My medicines' })
    expect(await within(meds).findByText('18 days left')).toBeInTheDocument()
    expect(within(meds).getByText('Refill requested')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})

describe('C2 today', () => {
  it('shows counts, my patients, what needs attention and the agenda', async () => {
    const { container } = renderApp({ as: 'staff', route: '/staff' })
    expect(await screen.findByRole('heading', { name: 'Today', level: 1 })).toBeInTheDocument()
    const stats = await screen.findByRole('list', { name: 'Summary' })
    expect(within(stats).getByRole('link', { name: /Critical results 1/ })).toBeInTheDocument()
    const attention = screen.getByRole('region', { name: 'Needs attention' })
    expect(
      within(attention).getByRole('link', { name: /Critical result.*Potassium.*Ram Bahadur Thapa · Bed 12 · 06:10/ }),
    ).toHaveAttribute('href', '/staff/results/res_ram_renal')
    const mine = screen.getByRole('region', { name: 'My patients' })
    expect(within(mine).getByRole('link', { name: 'Ram Bahadur Thapa' })).toHaveAttribute(
      'href',
      '/staff/patients/pt_ram',
    )
    expect(within(screen.getByRole('region', { name: 'Agenda' })).getAllByRole('listitem').length).toBeGreaterThan(0)
    await expectNoA11yViolations(container)
  })
})

describe('staff shell', () => {
  it('counts my patients, results and requests, and opens a chart from the patient search', async () => {
    const { user } = renderApp({ as: 'staff', route: '/staff/schedule' })
    const nav = await screen.findByRole('navigation', { name: 'Primary' })
    expect(await within(nav).findByRole('link', { name: /Medication requests 3/ })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /Results \d+/ })).toBeInTheDocument()
    await user.type(screen.getByRole('combobox', { name: 'Search patients' }), 'NVG-2041')
    await user.click(await screen.findByRole('option', { name: /Ram Bahadur Thapa/ }))
    expect(await screen.findByRole('heading', { name: 'Ram Bahadur Thapa', level: 1 })).toBeInTheDocument()
  })
})

describe('C3 patients', () => {
  it('switches between my patients and the ward, shows flags in words and prints a handover', async () => {
    const { user, container, printer } = renderApp({ as: 'staff', route: '/staff/patients' })
    const table = await screen.findByRole('table', { name: 'Patient list' })
    const mineCount = within(table).getAllByRole('row').length - 1
    expect(within(table).getByText('Penicillin allergy')).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: /^Ward/ }))
    const ward = screen.getByRole('table', { name: 'Patient list' })
    expect(within(ward).getAllByRole('row').length - 1).toBeGreaterThan(mineCount)
    await user.click(screen.getByRole('button', { name: 'Print handover' }))
    expect(printer.printed[0]?.sections.length).toBe(within(ward).getAllByRole('row').length - 1)
  })
})

describe('A4 organization', () => {
  it('shows facilities, onboarding with go-live, shared settings and roles', async () => {
    const { container } = renderApp({ as: 'staff', route: '/admin/organization' })
    const facilities = await screen.findByRole('table', { name: 'Facilities' })
    expect(within(facilities).getByText('Northvale General Hospital')).toBeInTheDocument()
    expect(within(facilities).getByText('Migrating')).toBeInTheDocument()
    expect(screen.getByText('Go-live 1 Dec')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'What is shared, what is local' })).toBeInTheDocument()
    const roles = screen.getByRole('table', { name: 'Roles by facility' })
    expect(within(roles).getByRole('columnheader', { name: 'Lakeview Hospital' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('is open to the facility admin', async () => {
    renderApp({ as: 'admin', route: '/admin/organization' })
    expect(await screen.findByRole('heading', { name: 'Facilities and access' })).toBeInTheDocument()
  })
})
