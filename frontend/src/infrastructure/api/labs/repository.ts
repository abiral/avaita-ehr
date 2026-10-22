import type { LabRepository } from '@/application/ports'
import type { HttpClient } from '../../http'
import { CatalogueDto, InboxDto, LabOrderDto, LabResultDto, RecentListDto, ReportListDto } from './dto'
import { toInboxItem, toLabOrder, toLabResult, toRecent, toReport } from './mappers'

export function createLabRepository(http: HttpClient): LabRepository {
  return {
    catalogue(signal) {
      return http.send({ method: 'GET', path: '/lab-catalogue', signal }, CatalogueDto)
    },
    async recentCollections(id, signal) {
      const res = await http.send({ method: 'GET', path: `/patients/${id}/recent-collections`, signal }, RecentListDto)
      return res.items.map(toRecent)
    },
    async placeOrder(input) {
      return toLabOrder(await http.send({ method: 'POST', path: '/lab-orders', body: input }, LabOrderDto))
    },
    async inbox(signal) {
      const res = await http.send({ method: 'GET', path: '/results/inbox', signal }, InboxDto)
      return res.items.map(toInboxItem)
    },
    async result(id, signal) {
      return toLabResult(await http.send({ method: 'GET', path: `/results/${id}`, signal }, LabResultDto))
    },
    async patientResults(id, signal) {
      const res = await http.send({ method: 'GET', path: `/patients/${id}/results`, signal }, InboxDto)
      return res.items.map(toInboxItem)
    },
    async acknowledge(id) {
      return toLabResult(await http.send({ method: 'POST', path: `/results/${id}/acknowledge` }, LabResultDto))
    },
    async release(id, comment) {
      return toLabResult(
        await http.send({ method: 'POST', path: `/results/${id}/release`, body: { comment } }, LabResultDto),
      )
    },
    async myReports(signal) {
      const res = await http.send({ method: 'GET', path: '/me/reports', signal }, ReportListDto)
      return res.items.map(toReport)
    },
  }
}
