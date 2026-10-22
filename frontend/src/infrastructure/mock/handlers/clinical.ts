import { http, HttpResponse } from 'msw'
import { NOTE_SECTION_KEYS } from '@/domain/clinical/types'
import { nextId, type Db } from '../db'
import { guard, isResponse, list, problem, readJson, str } from '../http'
import { criticalUnacked, listItemView, noteView, summaryView } from '../clinicalViews'

type SeedNote = Db['notes'][number]

const parseNote = (body: Record<string, unknown>) => {
  const raw = (body.sections ?? {}) as Record<string, unknown>
  const sections = Object.fromEntries(
    NOTE_SECTION_KEYS.map((key) => [key, typeof raw[key] === 'string' ? raw[key] : '']),
  ) as SeedNote['sections']
  const plan = Array.isArray(body.plan) ? (body.plan as SeedNote['plan']) : []
  return {
    template: typeof body.template === 'string' ? body.template : 'Consultation · Internal Medicine',
    sections,
    plan,
  }
}

function todayHandler(db: Db, base: string) {
  return http.get(`${base}/staff/today`, ({ request }) => {
    const caller = guard(db, request, { kind: 'staff' })
    if (isResponse(caller)) return caller
    const name = (id: string) => db.patients.find((p) => p.id === id)
    const critical = criticalUnacked(db).map((r) => {
      const a = r.analytes[0]
      const p = name(r.patientId)
      return {
        kind: 'critical-result' as const,
        title: `${a?.name ?? r.panel} ${String(a?.value ?? '')} ${a?.unit ?? ''}`,
        patientName: p?.displayName ?? '',
        context: `Bed ${p?.bed ?? ''} · ${r.reportedAt}`,
        target: { type: 'result' as const, id: r.id, patientId: r.patientId },
      }
    })
    const cosign = db.notes
      .filter((n) => n.needsCosign && n.status === 'draft' && n.authorId !== caller.userId)
      .slice(0, 1)
      .map((n) => ({
        kind: 'cosign' as const,
        title: `${n.title} by ${n.authorName}`,
        patientName: name(n.patientId)?.displayName ?? '',
        context: `Bed ${name(n.patientId)?.bed ?? ''}`,
        target: { type: 'note' as const, id: n.id, patientId: n.patientId },
      }))
    const meds = db.medReconciliation.map((m) => ({
      kind: 'medication' as const,
      title: m.title,
      patientName: name(m.patientId)?.displayName ?? '',
      context: `Bed ${name(m.patientId)?.bed ?? ''}`,
      target: { type: 'chart' as const, id: m.patientId, patientId: m.patientId },
    }))
    return HttpResponse.json({
      attention: [...critical, ...cosign, ...meds],
      agenda: db.agenda,
      notesToSign: db.notes.filter((n) => n.status === 'draft').length,
      plannedDischarges: db.patients.filter((p) => p.next === 'Discharge today').length,
    })
  })
}

function patientHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/patients`, ({ request }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'chart:read' })
      if (isResponse(caller)) return caller
      return list(
        db.patients
          .filter((p) => p.facilityId === caller.facilityId && p.bed)
          .map((p) => listItemView(db, p, caller.userId)),
      )
    }),
    http.get(`${base}/patients/:id/summary`, ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'chart:read' })
      if (isResponse(caller)) return caller
      const p = db.patients.find((x) => x.id === params.id && x.facilityId === caller.facilityId)
      return p ? HttpResponse.json(summaryView(db, p)) : problem(404, 'not_found', 'No such patient')
    }),
  ]
}

function noteHandlers(db: Db, base: string) {
  const find = (id: unknown) => db.notes.find((n) => n.id === id)
  const save = (n: SeedNote) => {
    db.notes[db.notes.findIndex((x) => x.id === n.id)] = n
    return HttpResponse.json(noteView(n))
  }
  return [
    http.get(`${base}/patients/:id/notes`, ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'chart:read' })
      return isResponse(caller) ? caller : list(db.notes.filter((n) => n.patientId === params.id).map(noteView))
    }),
    http.post(`${base}/patients/:id/notes`, async ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'note:write' })
      if (isResponse(caller)) return caller
      const now = db.clock.now().toISOString()
      const note: SeedNote = {
        ...parseNote(await readJson(request)),
        id: nextId(db, 'note'),
        patientId: String(params.id),
        title: 'Consultation note',
        department: 'Internal Medicine',
        status: 'draft',
        authorId: caller.userId,
        authorName: caller.displayName,
        createdAt: now,
        savedAt: now,
        signedAt: null,
        needsCosign: false,
        addenda: [],
        copyTo: [],
      }
      db.notes.unshift(note)
      return HttpResponse.json(noteView(note), { status: 201 })
    }),
    http.patch(`${base}/notes/:id`, async ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'note:write' })
      if (isResponse(caller)) return caller
      const note = find(params.id)
      if (!note) return problem(404, 'not_found', 'No such note')
      if (note.status === 'signed') return problem(409, 'conflict', 'Signed notes take addenda only')
      return save({ ...note, ...parseNote(await readJson(request)), savedAt: db.clock.now().toISOString() })
    }),
    http.post(`${base}/notes/:id/sign`, ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'note:sign' })
      if (isResponse(caller)) return caller
      const note = find(params.id)
      if (!note) return problem(404, 'not_found', 'No such note')
      if (note.status === 'signed') return problem(409, 'conflict', 'Already signed')
      return save({
        ...note,
        status: 'signed',
        signedAt: db.clock.now().toISOString(),
        copyTo: [{ name: 'Dr. Prakash Karki', role: 'Nephrology' }],
      })
    }),
    http.post(`${base}/notes/:id/addenda`, async ({ request, params }) => {
      const caller = guard(db, request, { kind: 'staff', permission: 'note:write' })
      if (isResponse(caller)) return caller
      const note = find(params.id)
      const text = str(await readJson(request), 'text')
      if (note?.status !== 'signed' || !text) return problem(409, 'conflict', 'Addenda need a signed note and text')
      return save({
        ...note,
        addenda: [...note.addenda, { text, at: db.clock.now().toISOString(), authorName: caller.displayName }],
      })
    }),
  ]
}

export function clinicalHandlers(db: Db, base: string) {
  return [todayHandler(db, base), ...patientHandlers(db, base), ...noteHandlers(db, base)]
}
