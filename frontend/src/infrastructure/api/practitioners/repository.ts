import type { PractitionerRepository } from '@/application/ports'
import type { HttpClient } from '../../http'
import { PractitionerDto, PractitionerListDto } from './dto'
import { toPractitioner } from './mappers'

export function createPractitionerRepository(http: HttpClient): PractitionerRepository {
  return {
    async list(filter, signal) {
      // The search text travels in a header, not the address bar (section 3).
      const headers: Record<string, string> = filter.q ? { 'X-Search': encodeURIComponent(filter.q) } : {}
      const res = await http.send(
        { method: 'GET', path: '/practitioners', query: { category: filter.category }, headers, signal },
        PractitionerListDto,
      )
      return res.items.map(toPractitioner)
    },
    async get(id, signal) {
      return toPractitioner(await http.send({ method: 'GET', path: `/practitioners/${id}`, signal }, PractitionerDto))
    },
  }
}
