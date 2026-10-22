import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { paths } from './routes'
import { LockScreen } from './session/LockScreen'
import { useSession } from './session/SessionProvider'
import { useIdleLock } from './session/useIdleLock'

const PUBLIC: readonly string[] = [paths.login, paths.register, paths.forgotPassword]

/** Root route: idle lock, lock overlay (the screen stays mounted but inert) and redirect after the session ends. */
export function RootLayout() {
  const { state, unlock, signOut } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  useIdleLock()
  const signedOut = state.status === 'signed-out'
  const onPublic = PUBLIC.some((p) => location.pathname.startsWith(p))
  useEffect(() => {
    if (signedOut && !onPublic) {
      void navigate(`${paths.login}?returnTo=${encodeURIComponent(location.pathname)}`, { replace: true })
    }
  }, [signedOut, onPublic, navigate, location.pathname])
  const locked = state.status === 'locked'
  return (
    <>
      <div inert={locked}>
        <Outlet />
      </div>
      {locked ? <LockScreen session={state.session} onUnlock={unlock} onSignOut={() => void signOut()} /> : null}
    </>
  )
}
