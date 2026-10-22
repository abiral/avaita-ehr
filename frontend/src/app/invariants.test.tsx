import { act, screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/renderWithServices'

const MIN = 60_000

describe('section 1 invariants not covered elsewhere', () => {
  it.each(['', '/notes', '/notes/new', '/orders', '/results', '/results/res_ram_renal', '/medications'])(
    'clinical safety: the chart route %s shows name, age and sex, MRN and allergies',
    async (tab) => {
      renderApp({ as: 'staff', route: `/staff/patients/pt_ram${tab}` })
      const banner = await screen.findByRole('region', { name: 'Patient' })
      expect(within(banner).getByRole('heading', { name: 'Ram Bahadur Thapa', level: 1 })).toBeInTheDocument()
      expect(within(banner).getByText('68 y · Male')).toBeInTheDocument()
      expect(within(banner).getByText('NVG-204118')).toBeInTheDocument()
      expect(within(banner).getByText('Allergy: Penicillin (rash)')).toBeInTheDocument()
    },
  )

  it('scheduling: a mode the doctor does not offer is disabled and says why', async () => {
    const { user } = renderApp({ as: 'patient', route: '/portal/book' })
    await user.click(await screen.findByRole('button', { name: 'Select Dr. Sabina Thapa Magar' }))
    const remote = await screen.findByRole('button', { name: /Remote video consultation/ })
    expect(remote).toBeDisabled()
    expect(within(remote).getByText('Not offered by this doctor')).toBeInTheDocument()
  })

  it('scheduling: remote times are in the facility zone and also in the viewer zone when it differs', async () => {
    const { user } = renderApp({ as: 'patient', route: '/portal/book' })
    await user.click(await screen.findByRole('button', { name: 'Select Dr. Prakash Karki' }))
    await user.click(await screen.findByRole('button', { name: /Remote video consultation/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    const [openDay] = await screen.findAllByRole('button', { name: /, \d+ free$/ })
    if (!openDay) throw new Error('expected a day with remote times')
    await user.click(openDay)
    const times = screen.getByRole('group', { name: /^Available times on / })
    const first = within(times)
      .getAllByRole('button')
      .find((b) => !b.hasAttribute('disabled'))
    if (!first) throw new Error('expected an open remote slot')
    expect(first.textContent).toMatch(/^\d{2}:\d{2}$/)
    await user.click(first)
    const viewerDiffers = Intl.DateTimeFormat().resolvedOptions().timeZone !== 'Asia/Kathmandu'
    if (viewerDiffers) expect(screen.getByText(/^Your local time: /)).toBeInTheDocument()
  })

  it('session: signing out clears the whole query cache and every in-memory draft', async () => {
    const { user, services, router } = renderApp({ as: 'patient', route: '/portal/appointments' })
    await screen.findAllByRole('button', { name: /Cancel appointment on/ })
    services.drafts.set('note', 'unsaved text')
    expect(services.queryClient.getQueryCache().getAll().length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(
      services.queryClient
        .getQueryCache()
        .getAll()
        .filter((q) => q.queryKey[0] !== 'session'),
    ).toEqual([])
    expect(services.drafts.get('note')).toBeUndefined()
  })

  it('session: unsaved form text survives the idle lock in memory', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { clock, user } = renderApp({ as: 'staff', route: '/staff/patients/pt_ram/notes/new' })
    await user.type(await screen.findByLabelText('Reason for consultation'), 'Not saved yet')
    await act(() => vi.advanceTimersByTimeAsync(0))
    clock.advance(10 * MIN + 1)
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    await user.type(screen.getByLabelText('Password'), 'correct horse')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Reason for consultation')).toHaveValue('Not saved yet')
    vi.useRealTimers()
  })
})
