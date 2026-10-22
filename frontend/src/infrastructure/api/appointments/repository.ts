import type { AppointmentRepository } from '@/application/ports'
import type { HttpClient } from '../../http'
import { iso } from '../common'
import { AppointmentDto, AppointmentListDto } from './dto'
import { toAppointment } from './mappers'

export function createAppointmentRepository(http: HttpClient): AppointmentRepository {
  return {
    async listMine(signal) {
      const res = await http.send(
        { method: 'GET', path: '/appointments', query: { patient: 'me' }, signal },
        AppointmentListDto,
      )
      return res.items.map(toAppointment)
    },
    async listForPractitioner(id, range, signal) {
      const query = { practitionerId: id, from: iso(range.from), to: iso(range.to) }
      const res = await http.send({ method: 'GET', path: '/appointments', query, signal }, AppointmentListDto)
      return res.items.map(toAppointment)
    },
    async book(input) {
      const body = { ...input, start: iso(input.start) }
      return toAppointment(await http.send({ method: 'POST', path: '/appointments', body }, AppointmentDto))
    },
    async cancel(id, reason) {
      return toAppointment(
        await http.send({ method: 'POST', path: `/appointments/${id}/cancel`, body: { reason } }, AppointmentDto),
      )
    },
    async restore(id) {
      return toAppointment(await http.send({ method: 'POST', path: `/appointments/${id}/restore` }, AppointmentDto))
    },
    async reschedule(id, start) {
      const body = { start: iso(start) }
      return toAppointment(
        await http.send({ method: 'POST', path: `/appointments/${id}/reschedule`, body }, AppointmentDto),
      )
    },
  }
}
