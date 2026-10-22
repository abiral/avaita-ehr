import { screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/renderWithServices'
import { expectNoA11yViolations } from '@/test/a11y'

describe('C5 chart summary', () => {
  it('shows the banner on every chart screen, with the critical result, vitals and latest results', async () => {
    const { user, container } = renderApp({ as: 'staff', route: '/staff/patients/pt_ram' })
    const banner = await screen.findByRole('region', { name: 'Patient' })
    expect(within(banner).getByRole('heading', { name: 'Ram Bahadur Thapa', level: 1 })).toBeInTheDocument()
    expect(within(banner).getByText('NVG-204118')).toBeInTheDocument()
    expect(within(banner).getByText(/Allergy: Penicillin/)).toBeInTheDocument()
    expect(within(banner).getByText('Admitted 17 Oct · Day 4')).toBeInTheDocument()
    expect(await screen.findByText('Critical result · 06:10')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Temperature over 4 days: 38.6, 38.2, 37.9, 37.8 °C' })).toBeInTheDocument()
    const latest = screen.getByRole('region', { name: 'Latest results' })
    expect(within(latest).getByText('Potassium')).toBeInTheDocument()
    expect(within(latest).getAllByText('Critical').length).toBeGreaterThan(0)
    await expectNoA11yViolations(container)
    await user.click(within(banner).getByRole('link', { name: 'Results' }))
    expect(await screen.findByRole('heading', { name: 'Renal function panel' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Patient' })).toBeInTheDocument()
  })

  it('tells the user when the patient is not at this facility', async () => {
    renderApp({ as: 'staff', route: '/staff/patients/pt_nobody' })
    expect(await screen.findByText(/could not be loaded|not registered/)).toBeInTheDocument()
  })
})

describe('C6 consultation note', () => {
  it('opens the draft, needs an assessment to sign, then takes addenda only', async () => {
    const { user, db, container } = renderApp({ as: 'staff', route: '/staff/patients/pt_ram/notes' })
    const reason = await screen.findByLabelText('Reason for consultation')
    expect(reason).toHaveValue(db.notes.find((n) => n.id === 'note_ram_cons')?.sections.reason)
    await expectNoA11yViolations(container)
    await user.clear(screen.getByLabelText('Assessment'))
    await user.click(screen.getByRole('button', { name: 'Sign note' }))
    expect(screen.getByText('Add an assessment before signing.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Assessment'), 'Hyperkalaemia on CKD 3b, improving pneumonia.')
    await user.type(screen.getByLabelText('Plan item'), 'Repeat potassium at 11:00')
    await user.click(screen.getByRole('button', { name: 'Add to plan' }))
    await user.click(screen.getByRole('button', { name: 'Sign note' }))
    expect(await screen.findByText(/Signed at .* by Dr. Anaya Shrestha\./)).toBeInTheDocument()
    const signed = db.notes.find((n) => n.id === 'note_ram_cons')
    expect(signed).toMatchObject({ status: 'signed' })
    expect(signed?.plan.at(-1)).toMatchObject({ text: 'Repeat potassium at 11:00' })
    expect(screen.getByLabelText('Assessment')).toHaveAttribute('readonly')
    await user.type(screen.getByLabelText('Addendum'), 'ECG reviewed: no changes.')
    await user.click(screen.getByRole('button', { name: 'Add addendum' }))
    await waitFor(() => expect(db.notes.find((n) => n.id === 'note_ram_cons')?.addenda).toHaveLength(1))
    expect(await screen.findByText('ECG reviewed: no changes.')).toBeInTheDocument()
  })

  it('creates a new note on first save', async () => {
    const { user, db } = renderApp({ as: 'staff', route: '/staff/patients/pt_ram/notes/new' })
    await user.type(await screen.findByLabelText('Reason for consultation'), 'Breathlessness review')
    const before = db.notes.length
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => expect(db.notes).toHaveLength(before + 1))
    expect(db.notes[0]).toMatchObject({ patientId: 'pt_ram', status: 'draft' })
    expect((await screen.findAllByText(/Draft saved/)).length).toBeGreaterThan(0)
  })
})

describe('C7 lab order', () => {
  it('warns about a duplicate, needs an indication, then sends and raises a realtime critical alert', async () => {
    const { user, db, container } = renderApp({ as: 'staff', route: '/staff/patients/pt_ram/orders' })
    await user.click(await screen.findByRole('button', { name: 'Add Renal function panel' }))
    expect(await screen.findByText(/Already collected .*Repeat allowed with indication\./)).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Sign and send' }))
    expect(screen.getByText('Add the clinical indication.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Clinical indication'), 'Hyperkalaemia 6.1, CKD 3b')
    await user.click(screen.getByRole('button', { name: 'Sign and send' }))
    expect(await screen.findByText('Orders signed and sent to the laboratory')).toBeInTheDocument()
    expect(db.labOrders).toHaveLength(1)
    const alerts = await screen.findByRole('region', { name: 'Critical results' })
    expect(within(alerts).getByText('Critical result for Ram Bahadur Thapa: Potassium 6.3 mmol/L.')).toBeInTheDocument()
  })

  it('adds an order set and removes a test', async () => {
    const { user } = renderApp({ as: 'staff', route: '/staff/patients/pt_ram/orders' })
    await user.click(await screen.findByRole('button', { name: /^Add set:/ }))
    const basket = screen.getByRole('region', { name: 'Order basket' })
    const count = within(basket).getAllByRole('listitem').length
    expect(count).toBeGreaterThan(1)
    const [remove] = within(basket).getAllByRole('button', { name: /^Remove / })
    if (!remove) throw new Error('expected a remove button')
    await user.click(remove)
    expect(within(basket).getAllByRole('listitem')).toHaveLength(count - 1)
  })
})

describe('C8 results review', () => {
  it('lists critical first, needs acknowledgement, then releases with a comment', async () => {
    const { user, db, container } = renderApp({ as: 'staff', route: '/staff/results' })
    const inbox = await screen.findByRole('navigation', { name: 'Results inbox' })
    const first = (await within(inbox).findAllByRole('link'))[0]
    expect(first).toHaveTextContent('Ram Bahadur Thapa')
    expect(first).toHaveTextContent('Critical')
    expect(await screen.findByRole('heading', { name: 'Renal function panel' })).toBeInTheDocument()
    expect(screen.getByText('Critical · unreviewed')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Potassium rising from 4.9/ })).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await user.type(screen.getByLabelText('Comment for the patient portal'), 'Your potassium is high.')
    await user.click(screen.getByRole('button', { name: 'Acknowledge result' }))
    expect(await screen.findByText('Report and comment released to the patient portal.')).toBeInTheDocument()
    expect(db.results.find((r) => r.id === 'res_ram_renal')).toMatchObject({
      acknowledgedBy: 'Dr. Anaya Shrestha',
      releasedToPatient: true,
      patientComment: 'Your potassium is high.',
    })
    expect(within(screen.getByRole('article')).getByText('Reviewed')).toBeInTheDocument()
  })

  it('acknowledges without releasing, then releases later', async () => {
    const { user, db } = renderApp({ as: 'staff', route: '/staff/results/res_ram_renal' })
    await user.click(await screen.findByRole('checkbox', { name: 'Release report and comment to the patient' }))
    await user.click(screen.getByRole('button', { name: 'Acknowledge result' }))
    expect(await screen.findByText(/Not released to the patient\./)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Release to patient' }))
    await waitFor(() => expect(db.results.find((r) => r.id === 'res_ram_renal')?.releasedToPatient).toBe(true))
  })
})

describe('P8 lab reports', () => {
  it('shows released reports with range bars, flags in words and the doctor note, and prints', async () => {
    const { user, container, printer } = renderApp({ as: 'patient', route: '/portal/reports' })
    const nav = await screen.findByRole('navigation', { name: 'Reports' })
    expect(within(nav).getAllByRole('button').length).toBeGreaterThan(0)
    const detail = screen.getByRole('article')
    expect(within(detail).getAllByRole('img').length).toBeGreaterThan(0)
    expect(within(detail).getAllByText(/High|Low|Normal/).length).toBeGreaterThan(0)
    await expectNoA11yViolations(container)
    await user.click(screen.getByRole('button', { name: 'Print report' }))
    expect(printer.printed).toHaveLength(1)
    expect(printer.printed[0]).toMatchObject({ patientName: 'Ramesh Pandey', mrn: 'NVG-188240' })
  })
})
