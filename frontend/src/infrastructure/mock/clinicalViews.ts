import { isCritical, labFlag, worstFlag } from '@/domain/labs/flags'
import type { Db } from './db'
import { DEFAULT_CARE_TEAM } from './seed/clinical'

type SeedPatient = Db['patients'][number]
type SeedResult = Db['results'][number]
type SeedNote = Db['notes'][number]

const FLAG_NAMES = { penicillin: 'Penicillin', isolation: '', falls: '', dnacpr: '', nkda: '' } as const

export const staffName = (db: Db, id: string | null): string | null =>
  db.staff.find((s) => s.id === id)?.displayName ?? null

export const allergiesOf = (db: Db, p: SeedPatient) =>
  db.allergies[p.id] ??
  p.flags.filter((f) => FLAG_NAMES[f]).map((f) => ({ substance: FLAG_NAMES[f], reaction: 'rash' }))

export const listItemView = (db: Db, p: SeedPatient, userId: string) => ({
  id: p.id,
  displayName: p.displayName,
  sex: p.sex,
  birthDate: p.birthDate,
  mrn: p.mrn,
  bed: p.bed,
  attendingName: staffName(db, p.attendingId)?.replace('Dr. Anaya ', 'Dr. ').replace('Dr. Prakash ', 'Dr. ') ?? null,
  mine: p.attendingId === userId,
  admittedAt: p.admittedAt,
  diagnosis: p.diagnosis,
  flags: p.flags,
  next: p.next,
  nextTone: p.nextTone,
  seenAt: p.seenAt,
})

export const bannerView = (db: Db, p: SeedPatient) => ({
  id: p.id,
  displayName: p.displayName,
  sex: p.sex,
  birthDate: p.birthDate,
  mrn: p.mrn,
  bed: p.bed ? `${p.ward ?? ''}-${p.bed}` : null,
  ward: p.ward,
  admittedAt: p.admittedAt,
  attendingName: staffName(db, p.attendingId),
  allergies: allergiesOf(db, p),
  codeStatus: db.charts.find((c) => c.patientId === p.id)?.codeStatus ?? 'Full code',
})

export const resultFlag = (r: SeedResult) => worstFlag(r.analytes.map((a) => labFlag(a.value, a.range)))

export const inboxView = (db: Db, r: SeedResult) => ({
  id: r.id,
  patientName: db.patients.find((p) => p.id === r.patientId)?.displayName ?? '',
  panel: r.panel,
  reportedAt: r.reportedAt,
  worstFlag: resultFlag(r),
  preliminary: r.preliminary,
  review: r.acknowledgedBy ? ('acknowledged' as const) : ('unreviewed' as const),
})

export const resultView = (db: Db, r: SeedResult) => {
  const p = db.patients.find((x) => x.id === r.patientId)
  const { seenByPatient: _seen, ...rest } = r
  return {
    ...rest,
    patientName: p?.displayName ?? '',
    mrn: p?.mrn ?? '',
    review: r.acknowledgedBy ? ('acknowledged' as const) : ('unreviewed' as const),
  }
}

export const criticalUnacked = (db: Db, patientId?: string) =>
  db.results.filter((r) => (!patientId || r.patientId === patientId) && !r.acknowledgedBy && isCritical(resultFlag(r)))

export const noteView = (n: SeedNote) => {
  const { authorId: _a, needsCosign: _c, ...rest } = n
  return rest
}

const LATEST_LIMIT = 5

/** Newest value per analyte across the patient's results, newest report first. */
function latestResults(db: Db, patientId: string) {
  const seen = new Set<string>()
  return db.results
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    .flatMap((r) => r.analytes)
    .filter((a) => (seen.has(a.code) ? false : (seen.add(a.code), true)))
    .slice(0, LATEST_LIMIT)
    .map((a) => ({ name: a.name, value: a.value, unit: a.unit, flag: labFlag(a.value, a.range) }))
}

export function summaryView(db: Db, p: SeedPatient) {
  const chart = db.charts.find((c) => c.patientId === p.id)
  const critical = criticalUnacked(db, p.id)[0]
  const k = critical?.analytes.find((a) => isCritical(labFlag(a.value, a.range)))
  return {
    banner: bannerView(db, p),
    alert:
      critical && k
        ? {
            analyte: k.name,
            value: `${String(k.value)} ${k.unit}`,
            range: `${String(k.range.low ?? '')} to ${String(k.range.high ?? '')}`,
            at: critical.reportedAt,
            resultId: critical.id,
          }
        : null,
    vitals: chart?.vitals ?? [],
    vitalsTakenAt: chart?.vitalsTakenAt ?? null,
    vitalsTakenBy: chart?.vitalsTakenBy ?? '',
    problems: chart?.problems ?? [{ name: p.diagnosis, detail: '', status: 'active' as const }],
    medications: chart?.medications ?? [],
    careTeam: chart?.careTeam ?? [
      { name: staffName(db, p.attendingId) ?? 'Unassigned', role: 'Attending' },
      ...DEFAULT_CARE_TEAM,
    ],
    latestResults: latestResults(db, p.id),
    notes: db.notes
      .filter((n) => n.patientId === p.id && n.status === 'signed')
      .map((n) => ({
        id: n.id,
        title: n.title,
        authorName: n.authorName,
        at: n.signedAt ?? n.createdAt,
        status: n.status,
      })),
  }
}
