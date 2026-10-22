import type { SchedulingRepository } from '@/application/ports'
import type { HttpClient } from '../../http'
import { iso } from '../common'
import { BlockListDto, ImpactDto, RulesDto, SlotListDto, TimeOffDto, TimeOffListDto } from './dto'
import { toBlock, toImpact, toSlot, toTimeOff, toTimeOffBody } from './mappers'

export function createSchedulingRepository(http: HttpClient): SchedulingRepository {
  return {
    async blocks(id, signal) {
      const res = await http.send(
        { method: 'GET', path: `/practitioners/${id}/availability-blocks`, signal },
        BlockListDto,
      )
      return res.items.map(toBlock)
    },
    async saveBlocks(id, blocks) {
      const res = await http.send(
        { method: 'POST', path: `/practitioners/${id}/availability-blocks`, body: { blocks } },
        BlockListDto,
      )
      return res.items.map(toBlock)
    },
    deleteBlock(id, blockId) {
      return http.sendVoid({ method: 'DELETE', path: `/practitioners/${id}/availability-blocks/${blockId}` })
    },
    async timeOff(range, signal) {
      const res = await http.send(
        { method: 'GET', path: '/time-off', query: { from: iso(range.from), to: iso(range.to) }, signal },
        TimeOffListDto,
      )
      return res.items.map(toTimeOff)
    },
    async previewTimeOff(input) {
      return toImpact(
        await http.send({ method: 'POST', path: '/time-off/impact-preview', body: toTimeOffBody(input) }, ImpactDto),
      )
    },
    async createTimeOff(input) {
      return toTimeOff(await http.send({ method: 'POST', path: '/time-off', body: toTimeOffBody(input) }, TimeOffDto))
    },
    async slots(id, mode, range, signal) {
      const query = { mode, from: iso(range.from), to: iso(range.to) }
      const res = await http.send({ method: 'GET', path: `/practitioners/${id}/slots`, query, signal }, SlotListDto)
      return res.items.map(toSlot)
    },
    rules(signal) {
      return http.send({ method: 'GET', path: '/booking-rules', signal }, RulesDto)
    },
    saveRules(rules) {
      return http.send({ method: 'PUT', path: '/booking-rules', body: rules }, RulesDto)
    },
  }
}
