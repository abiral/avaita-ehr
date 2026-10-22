import { needsFacilityChoice, safeReturnTo, type Session } from '@/domain/identity'
import { paths } from '@/app/routes'

/** Where to go after signing in: the safe returnTo for the role, or the role home. */
export function afterSignIn(session: Session, returnTo: string | null): string {
  if (session.kind === 'patient') return safeReturnTo(returnTo, paths.portal.home) ?? paths.portal.home
  const back = safeReturnTo(returnTo, ['/staff', '/admin'])
  if (needsFacilityChoice(session)) {
    return back ? `${paths.staff.workspace}?returnTo=${encodeURIComponent(back)}` : paths.staff.workspace
  }
  return back ?? paths.staff.today
}
