import type { PackageRepository } from '@/application/ports'
import type { HttpClient } from '../../http'
import { iso } from '../common'
import { EnrollmentDto, PackageDto, PackageListDto } from './dto'
import { toEnrollment, toPackage } from './mappers'

export function createPackageRepository(http: HttpClient): PackageRepository {
  return {
    async list(signal) {
      const res = await http.send({ method: 'GET', path: '/packages', signal }, PackageListDto)
      return res.items.map(toPackage)
    },
    async save(draft) {
      const { id, ...body } = draft
      const req = id
        ? { method: 'PATCH' as const, path: `/packages/${id}`, body }
        : { method: 'POST' as const, path: '/packages', body }
      return toPackage(await http.send(req, PackageDto))
    },
    async publish(id) {
      return toPackage(await http.send({ method: 'POST', path: `/packages/${id}/publish` }, PackageDto))
    },
    async enroll(input) {
      const body = { ...input, firstVisit: { ...input.firstVisit, start: iso(input.firstVisit.start) } }
      return toEnrollment(await http.send({ method: 'POST', path: '/package-enrollments', body }, EnrollmentDto))
    },
  }
}
