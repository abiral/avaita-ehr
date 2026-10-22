import { data, redirect, type LoaderFunctionArgs } from 'react-router'
import { can, type AccountKind, type Permission, type Session } from '@/domain/identity'
import { paths } from './routes'
import type { SessionStore } from './session/sessionStore'
import { sessionOf } from './session/sessionState'
import type { TenantSource } from './tenantSource'

export interface GuardDeps {
  readonly sessionStore: SessionStore
  readonly tenant: TenantSource
}

export const homeFor = (session: Session, tenant: TenantSource): string => {
  if (session.kind === 'patient') return paths.portal.home
  return tenant.current() ? paths.staff.today : paths.staff.workspace
}

const loginRedirect = (request: Request) => {
  const url = new URL(request.url)
  const returnTo = url.pathname + url.search
  return redirect(`${paths.login}?returnTo=${encodeURIComponent(returnTo)}`)
}

/** Forbidden routes show a "no access" screen, not a redirect loop. */
export const forbidden = () => data({ reason: 'forbidden' }, { status: 403 })

export const requireSignedOut = (deps: GuardDeps) => async () => {
  const session = sessionOf(await deps.sessionStore.ready())
  return session ? redirect(homeFor(session, deps.tenant)) : null
}

export const requireRole =
  (deps: GuardDeps, kind: AccountKind) =>
  async ({ request }: LoaderFunctionArgs) => {
    const session = sessionOf(await deps.sessionStore.ready())
    if (!session) return loginRedirect(request)
    if (session.kind !== kind) return redirect(homeFor(session, deps.tenant))
    return null
  }

/** Staff with a chosen facility and, when given, at least one of the permissions. */
export const requireStaffFacility =
  (deps: GuardDeps, anyOf: readonly Permission[] = []) =>
  async (args: LoaderFunctionArgs) => {
    const role = await requireRole(deps, 'staff')(args)
    if (role) return role
    const session = sessionOf(deps.sessionStore.get())
    const scope = deps.tenant.current()
    if (!scope || session?.kind !== 'staff') return redirect(paths.staff.workspace)
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- React Router expects thrown data responses
    if (anyOf.length && !anyOf.some((p) => can(session, scope.facilityId, p))) throw forbidden()
    return null
  }

export const redirectHome = (deps: GuardDeps) => async () => {
  const session = sessionOf(await deps.sessionStore.ready())
  return redirect(session ? homeFor(session, deps.tenant) : paths.login)
}
