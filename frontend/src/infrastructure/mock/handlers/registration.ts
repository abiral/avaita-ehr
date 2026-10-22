import { http, HttpResponse } from 'msw'
import { nextId, type Db } from '../db'
import { noContent, problem, readJson, str } from '../http'

const mask = (mobile: string): string => `+977 ${mobile.replace(/\D/g, '').slice(-10, -8)}XX XXX XXX`

export function registrationHandlers(db: Db, base: string) {
  return [
    http.post(`${base}/registrations`, async ({ request }) => {
      const body = await readJson(request)
      const email = str(body, 'email').trim().toLowerCase()
      const password = str(body, 'password')
      const fields: Record<string, string> = {}
      if (!str(body, 'givenName')) fields.givenName = 'required'
      if (!str(body, 'familyName')) fields.familyName = 'required'
      if (!/^\S+@\S+\.\S+$/.test(email)) fields.email = 'invalid'
      if (db.patientAccounts.some((a) => a.email === email)) fields.email = 'taken'
      if (password.length < 10 || !/\d/.test(password)) fields.password = 'weak'
      if (body.acceptedTerms !== true) fields.acceptedTerms = 'required'
      if (Object.keys(fields).length) return problem(422, 'validation_failed', 'Check the fields', fields)
      const reg = {
        id: nextId(db, 'reg'),
        email,
        mobile: str(body, 'mobile'),
        hospitalNumber: str(body, 'hospitalNumber').trim().toUpperCase(),
        verified: false,
      }
      db.registrations.push(reg)
      return HttpResponse.json({ id: reg.id, maskedMobile: mask(reg.mobile) }, { status: 201 })
    }),
    http.post(`${base}/registrations/:id/verify`, async ({ params, request }) => {
      const reg = db.registrations.find((r) => r.id === params.id)
      if (!reg) return problem(404, 'not_found', 'No such registration')
      const code = str(await readJson(request), 'code')
      if (!/^\d{6}$/.test(code) || code === '000000')
        return problem(422, 'invalid_code', 'Wrong code', { code: 'invalid' })
      reg.verified = true
      const linked = db.patients.find((p) => p.mrn === reg.hospitalNumber)
      const patientId = linked?.id ?? nextId(db, 'pt')
      const template = db.patients[db.patients.length - 1]
      if (!linked && template)
        db.patients.push({
          ...template,
          id: patientId,
          mrn: `NVG-${String(db.sequence + 200000)}`,
          displayName: reg.email,
          givenName: reg.email,
        })
      db.patientAccounts.push({ patientId, email: reg.email, phone: reg.mobile, facilityIds: ['fac_nvg'] })
      db.session = { kind: 'patient', userId: patientId, locked: false }
      const counts = linked ? { visits: 2, labReports: 6, medicines: 3 } : { visits: 0, labReports: 0, medicines: 0 }
      return HttpResponse.json({
        mrn: linked?.mrn ?? db.patients.find((p) => p.id === patientId)?.mrn ?? '',
        facilityName: linked ? 'Northvale General Hospital' : null,
        linked: counts,
      })
    }),
    http.post(`${base}/registrations/:id/resend`, () => noContent()),
  ]
}
