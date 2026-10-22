import type { RegistrationRepository } from '@/application/ports'
import type { RegistrationId } from '@/core/branded'
import type { HttpClient } from '../../http'
import { RegistrationDto, VerifiedDto } from './dto'

export function createRegistrationRepository(http: HttpClient): RegistrationRepository {
  return {
    async register(input) {
      const res = await http.send({ method: 'POST', path: '/registrations', body: input }, RegistrationDto)
      return { ...res, id: res.id as RegistrationId }
    },
    verify(id, code) {
      return http.send({ method: 'POST', path: `/registrations/${id}/verify`, body: { code } }, VerifiedDto)
    },
    resend(id) {
      return http.sendVoid({ method: 'POST', path: `/registrations/${id}/resend` })
    },
  }
}
