import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { createServices, type ServiceOverrides } from '@/app/createServices'
import { createQueryClient } from '@/app/queryClient'
import { buildRoutes } from '@/app/router'
import type { Services } from '@/app/services'
import { ServicesProvider } from '@/app/ServicesProvider'
import { SessionProvider } from '@/app/session/SessionProvider'
import { TenantProvider } from '@/app/TenantProvider'
import type { Session } from '@/domain/identity'
import { createMemoryPreferenceStore } from '@/infrastructure/storage/preferenceStore'
import { createDb, type Db } from '@/infrastructure/mock/db'
import { createHandlers } from '@/infrastructure/mock/handlers'
import { ConfirmProvider, ToastProvider } from '@/ui'
import { createFakeIdle, createFakeRealtime, createRecordingPrinter } from './fakes/browser'
import { createFakeClock, type FakeClock } from './fakes/clock'
import { adminSession, patientSession, staffSession } from './fixtures/sessions'
import { API_BASE, server } from './server'

export type AsWho = 'patient' | 'staff' | 'admin' | 'signed-out'

export interface TestOptions {
  readonly as?: AsWho
  readonly route?: string
  readonly clock?: FakeClock
  readonly overrides?: ServiceOverrides
  readonly withFacility?: boolean
  readonly db?: Db
}

const SESSIONS: Record<Exclude<AsWho, 'signed-out'>, Session> = {
  patient: patientSession,
  staff: staffSession,
  admin: adminSession,
}
const MOCK_USER: Record<Exclude<AsWho, 'signed-out'>, string> = {
  patient: 'pt_ramesh',
  staff: 'st_anaya',
  admin: 'st_sarita',
}

/** Builds Services from fakes plus the mock API (MSW node) and signs in as the chosen role. */
export function setupServices(options: TestOptions = {}) {
  const { as = 'signed-out', clock = createFakeClock(), withFacility = true } = options
  const db = options.db ?? createDb(clock)
  server.use(...createHandlers(db, API_BASE))
  const realtime = createFakeRealtime()
  const idle = createFakeIdle()
  const printer = createRecordingPrinter()
  const services = createServices(
    { apiBase: API_BASE, dev: false },
    {
      clock,
      realtime,
      idle,
      printer,
      prefs: createMemoryPreferenceStore(),
      queryClient: createQueryClient(false),
      ...options.overrides,
    },
  )
  if (as !== 'signed-out') {
    db.session = { kind: as === 'patient' ? 'patient' : 'staff', userId: MOCK_USER[as], locked: false }
    const session = SESSIONS[as]
    services.sessionStore.dispatch({ type: 'loaded', session })
    if (withFacility && !services.tenant.current()) {
      const facility = session.kind === 'patient' ? session.facilities[0] : session.memberships[0]?.facility
      if (facility) services.tenant.set({ organizationId: session.organizationId, facilityId: facility.id })
    }
  } else {
    services.sessionStore.dispatch({ type: 'loaded', session: null })
  }
  return { services, db, clock, realtime, idle, printer }
}

export function Providers({ services, children }: { readonly services: Services; readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={services.queryClient}>
      <ServicesProvider services={services}>
        <SessionProvider>
          <TenantProvider>
            <ToastProvider dismissLabel="Dismiss">
              <ConfirmProvider>{children}</ConfirmProvider>
            </ToastProvider>
          </TenantProvider>
        </SessionProvider>
      </ServicesProvider>
    </QueryClientProvider>
  )
}

/** Renders the whole app router at `route`. */
export function renderApp(options: TestOptions = {}) {
  const ctx = setupServices(options)
  const router = createMemoryRouter(buildRoutes(ctx.services), { initialEntries: [options.route ?? '/'] })
  const user = userEvent.setup()
  const view = render(
    <Providers services={ctx.services}>
      <RouterProvider router={router} />
    </Providers>,
  )
  return { ...ctx, ...view, router, user }
}

/** Renders a single component with providers and a memory router. */
export function renderWithServices(ui: ReactElement, options: TestOptions = {}) {
  const ctx = setupServices(options)
  const user = userEvent.setup()
  const view = render(
    <Providers services={ctx.services}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>{ui}</MemoryRouter>
    </Providers>,
  )
  return { ...ctx, ...view, user }
}
