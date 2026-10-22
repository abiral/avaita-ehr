import type { Db } from './db'
import type { SeedAppointment } from './seed/appointments'
import type { SeedPackage } from './seed/packages'

export const patientName = (db: Db, id: string): string => db.patients.find((p) => p.id === id)?.displayName ?? ''
export const practitioner = (db: Db, id: string | null) => db.practitioners.find((p) => p.id === id)

export function appointmentView(db: Db, a: SeedAppointment) {
  const doc = practitioner(db, a.practitionerId)
  const location =
    a.location || (a.mode === 'remote' ? 'Video consultation' : `${doc?.category ?? ''} · ${doc?.location ?? ''}`)
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: patientName(db, a.patientId),
    practitionerId: a.practitionerId,
    practitionerName: doc?.displayName ?? '',
    kind: a.kind,
    title: a.title || (doc?.displayName ?? ''),
    reason: a.reason,
    start: a.start,
    end: new Date(new Date(a.start).getTime() + a.minutes * 60_000).toISOString(),
    mode: a.mode,
    status: a.status,
    location,
    preparation: a.preparation,
    cancelReason: a.cancelReason,
    cancelledBy: a.cancelledBy,
    packageEnrollmentId: a.packageEnrollmentId,
    hasSummary: a.hasSummary,
  }
}

export function packageView(db: Db, p: SeedPackage) {
  const doc = practitioner(db, p.practitionerId)
  return {
    id: p.id,
    practitionerId: p.practitionerId,
    practitionerName: doc?.displayName ?? '',
    category: doc?.category ?? '',
    name: p.name,
    description: p.description,
    format: p.format,
    validityDays: p.validityDays,
    price: null,
    monthlyCap: null,
    published: p.published,
    items: p.items,
    bookedCount: p.bookedCount,
  }
}
