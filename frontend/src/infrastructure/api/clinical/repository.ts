import type { ClinicalRepository } from '@/application/ports'
import type { HttpClient } from '../../http'
import { NoteDto, NoteListDto, PatientListDto, SummaryDto, TodayDto } from './dto'
import { toNote, toPatientListItem, toSummary, toToday } from './mappers'

export function createClinicalRepository(http: HttpClient): ClinicalRepository {
  return {
    async patients(signal) {
      const res = await http.send({ method: 'GET', path: '/patients', signal }, PatientListDto)
      return res.items.map(toPatientListItem)
    },
    async summary(id, signal) {
      return toSummary(await http.send({ method: 'GET', path: `/patients/${id}/summary`, signal }, SummaryDto))
    },
    async today(signal) {
      return toToday(await http.send({ method: 'GET', path: '/staff/today', signal }, TodayDto))
    },
    async notes(id, signal) {
      const res = await http.send({ method: 'GET', path: `/patients/${id}/notes`, signal }, NoteListDto)
      return res.items.map(toNote)
    },
    async saveNote(id, draft, noteId) {
      const req = noteId
        ? { method: 'PATCH' as const, path: `/notes/${noteId}`, body: draft }
        : { method: 'POST' as const, path: `/patients/${id}/notes`, body: draft }
      return toNote(await http.send(req, NoteDto))
    },
    async signNote(noteId) {
      return toNote(await http.send({ method: 'POST', path: `/notes/${noteId}/sign` }, NoteDto))
    },
    async addAddendum(noteId, text) {
      return toNote(await http.send({ method: 'POST', path: `/notes/${noteId}/addenda`, body: { text } }, NoteDto))
    },
  }
}
