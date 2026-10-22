import { http, HttpResponse } from 'msw'
import { addLocalDays, localDateOf } from '@/domain/time'
import { matchesQuery } from '@/shared/string'
import type { Db } from '../db'
import { guard, isResponse, list, problem } from '../http'
import { bookability, slotsFor } from '../rules'

type SeedPractitioner = Db['practitioners'][number]

const nextAvailable = (db: Db, doc: SeedPractitioner, facilityId: string): string | null => {
  const today = localDateOf(db.clock.now(), 'Asia/Kathmandu')
  const dates = Array.from({ length: 14 }, (_, i) => addLocalDays(today, i))
  const starts = (['onsite', 'remote'] as const).flatMap((mode) => {
    const input = bookability(db, doc.id, mode, facilityId)
    return input ? slotsFor(input, dates).filter((s) => s.available) : []
  })
  const first = starts.sort((a, b) => a.start.getTime() - b.start.getTime())[0]
  return first ? first.start.toISOString() : null
}

const view = (db: Db, doc: SeedPractitioner, facilityId: string) => ({
  id: doc.id,
  displayName: doc.displayName,
  category: doc.category,
  qualifications: doc.qualifications,
  languages: doc.languages,
  keywords: doc.keywords,
  offersOnsite: doc.offersOnsite,
  offersRemote: doc.offersRemote,
  location: doc.location,
  nextAvailableAt: nextAvailable(db, doc, facilityId),
})

export function practitionerHandlers(db: Db, base: string) {
  return [
    http.get(`${base}/practitioners`, ({ request }) => {
      const caller = guard(db, request)
      if (isResponse(caller)) return caller
      const url = new URL(request.url)
      const category = url.searchParams.get('category') ?? ''
      const q = decodeURIComponent(request.headers.get('X-Search') ?? '')
      const items = db.practitioners
        .filter((d) => !category || d.category === category)
        .filter((d) => matchesQuery(`${d.displayName} ${d.category} ${d.keywords.join(' ')}`, q))
        .map((d) => view(db, d, caller.facilityId))
      return list(items)
    }),
    http.get(`${base}/practitioners/:id`, ({ request, params }) => {
      const caller = guard(db, request)
      if (isResponse(caller)) return caller
      const doc = db.practitioners.find((d) => d.id === params.id)
      return doc
        ? HttpResponse.json(view(db, doc, caller.facilityId))
        : problem(404, 'not_found', 'No such practitioner')
    }),
  ]
}
