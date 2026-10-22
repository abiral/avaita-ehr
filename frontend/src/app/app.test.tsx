import { act, screen, waitFor } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { renderApp, renderWithServices } from '@/test/renderWithServices'
import { expectNoA11yViolations } from '@/test/a11y'
import { NVE, NVG } from '@/test/fixtures/sessions'
import { useTenant } from './TenantProvider'
import { ALLOWED_PREFERENCE_KEYS } from '@/infrastructure/storage/preferenceStore'

const MIN = 60_000

describe('shells and guards', () => {
  it('renders the patient portal shell with nav and patient identity', async () => {
    const { container } = renderApp({ as: 'patient', route: '/portal' })
    expect(await screen.findByRole('navigation', { name: 'Patient portal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('NVG-188240')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('renders the staff shell with facility switcher', async () => {
    const { container } = renderApp({ as: 'staff', route: '/staff' })
    expect(
      await screen.findByRole('link', { name: /Switch facility or department, current: Northvale General/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Facilities and access' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search patients' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('renders the admin shell with grouped nav', async () => {
    const { container } = renderApp({ as: 'admin', route: '/admin/availability' })
    expect(await screen.findByRole('navigation', { name: 'Scheduling' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Appointment blocks' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Admin')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('shows "no access" for a forbidden admin page', async () => {
    renderApp({ as: 'staff', route: '/admin/packages' })
    expect(await screen.findByRole('heading', { name: 'You do not have access' })).toBeInTheDocument()
  })

  it('redirects signed-out users to sign in with returnTo', async () => {
    const { router } = renderApp({ as: 'signed-out', route: '/portal/book' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?returnTo=%2Fportal%2Fbook')
  })

  it('shows not found for unknown routes', async () => {
    renderApp({ as: 'patient', route: '/nowhere' })
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('sends staff with several facilities to the workspace picker', async () => {
    const { router } = renderApp({ as: 'staff', route: '/staff', withFacility: false })
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff/workspace'))
  })
})

describe('idle lock', () => {
  it('locks staff after 10 minutes, keeps the URL, unlocks with the password', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { clock, router, user, idle } = renderApp({ as: 'staff', route: '/staff/patients' })
    await screen.findByRole('heading', { name: 'Patients' })
    await act(() => vi.advanceTimersByTimeAsync(0))
    clock.advance(9 * MIN)
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    idle.fire()
    clock.advance(9 * MIN)
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    clock.advance(1 * MIN + 1)
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.getByRole('alertdialog', { name: 'Session locked' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/staff/patients')
    await user.type(screen.getByLabelText('Password'), 'correct horse')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    vi.useRealTimers()
  })

  it('locks patients after 15 minutes and signs out after 30 minutes locked, clearing the cache', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { clock, services, router } = renderApp({ as: 'patient', route: '/portal' })
    await screen.findByRole('navigation', { name: 'Patient portal' })
    await act(() => vi.advanceTimersByTimeAsync(0))
    services.queryClient.setQueryData(['f', NVG, 'probe'], 'cached')
    clock.advance(14 * MIN)
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    clock.advance(1 * MIN)
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(screen.getByRole('alertdialog', { name: 'Session locked' })).toBeInTheDocument()
    clock.advance(30 * MIN)
    await act(() => vi.advanceTimersByTimeAsync(5_000))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(services.queryClient.getQueryData(['f', NVG, 'probe'])).toBeUndefined()
    vi.useRealTimers()
  })
})

describe('facility switch', () => {
  it('clears the cache and drafts, and later requests carry the new facility header', async () => {
    const seen: string[] = []
    function Probe() {
      const { select, scope } = useTenant()
      useQuery({
        queryKey: ['f', scope?.facilityId ?? '', 'probe'],
        queryFn: async () => {
          const res = await fetch(`${import.meta.env.VITE_API_BASE}/probe`, {
            headers: { 'X-Facility-Id': scope?.facilityId ?? '' },
          })
          seen.push(res.headers.get('x-echo') ?? '')
          return 'ok'
        },
      })
      return (
        <button type="button" onClick={() => select(NVE)}>
          switch
        </button>
      )
    }
    const { server } = await import('@/test/server')
    const { http, HttpResponse } = await import('msw')
    server.use(
      http.get(`${import.meta.env.VITE_API_BASE}/probe`, ({ request }) =>
        HttpResponse.json({}, { headers: { 'x-echo': request.headers.get('X-Facility-Id') ?? '' } }),
      ),
    )
    const { services, user, realtime } = renderWithServices(<Probe />, { as: 'staff' })
    services.drafts.set('note', 'unsaved text')
    await waitFor(() => expect(seen).toEqual([NVG]))
    await user.click(screen.getByRole('button', { name: 'switch' }))
    expect(services.queryClient.getQueryData(['f', NVG, 'probe'])).toBeUndefined()
    expect(services.drafts.get('note')).toBeUndefined()
    expect(services.tenant.current()?.facilityId).toBe(NVE)
    await waitFor(() => expect(seen).toEqual([NVG, NVE]))
    expect(realtime.connections.at(-1)).toBeNull()
  })

  it('writes only allow-listed preference keys to browser storage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    renderWithServices(<span />, { as: 'staff', overrides: {} })
    for (const [key] of setItem.mock.calls) expect(ALLOWED_PREFERENCE_KEYS).toContain(key)
    setItem.mockRestore()
  })
})
