import type { SessionRepository } from '@/application/ports'
import { ApiError } from '@/core/errors'
import type { HttpClient } from '../../http'
import { ResetRequestedDto, SessionDto } from './dto'
import { toSession } from './mappers'

export function createSessionRepository(http: HttpClient): SessionRepository {
  return {
    async current(signal) {
      try {
        return toSession(await http.send({ method: 'GET', path: '/session', signal }, SessionDto))
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    async signIn(input) {
      return toSession(await http.send({ method: 'POST', path: '/session', body: input }, SessionDto))
    },
    signOut() {
      return http.sendVoid({ method: 'DELETE', path: '/session' })
    },
    async unlock(password) {
      return toSession(await http.send({ method: 'POST', path: '/session/unlock', body: { password } }, SessionDto))
    },
    requestPasswordReset(identifier) {
      return http.send({ method: 'POST', path: '/password-reset', body: { identifier } }, ResetRequestedDto)
    },
    confirmPasswordReset(input) {
      return http.sendVoid({ method: 'POST', path: '/password-reset/confirm', body: input })
    },
  }
}
