import type { LabResultId, NoteId, PatientId } from '@/core/branded'
import { NOTE_SECTION_KEYS, type ClinicalNote, type NoteDraft } from '@/domain/clinical'
import type { LabResult } from '@/domain/labs'
import { acknowledgeResult, addAddendum, placeLabOrder, releaseResult, signNote } from './clinical'

const sections = Object.fromEntries(NOTE_SECTION_KEYS.map((k) => [k, 'text'])) as NoteDraft['sections']
const draft: NoteDraft = { template: 'Consultation', sections, plan: [] }
const note = { id: 'note_1' as NoteId, status: 'draft' } as ClinicalNote
const patientId = 'pt_ram' as PatientId
const result = {
  id: 'res_1' as LabResultId,
  review: 'unreviewed',
  releasedToPatient: false,
  analytes: [
    {
      code: 'K',
      name: 'Potassium',
      value: 6.3,
      unit: 'mmol/L',
      range: { low: 3.5, high: 5.1, criticalLow: 2.5, criticalHigh: 6 },
      history: [],
    },
  ],
} as unknown as LabResult

describe('clinical use cases', () => {
  it('saves then signs, and refuses to sign without an assessment or twice', async () => {
    const calls: string[] = []
    const clinical = {
      saveNote: () => (calls.push('save'), Promise.resolve(note)),
      signNote: () => (calls.push('sign'), Promise.resolve({ ...note, status: 'signed' as const })),
    }
    const sign = signNote({ clinical })
    expect((await sign({ patientId, noteId: null, status: 'draft', draft })).value.status).toBe('signed')
    expect(calls).toEqual(['save', 'sign'])
    await expect(
      sign({
        patientId,
        noteId: null,
        status: 'draft',
        draft: { ...draft, sections: { ...sections, assessment: ' ' } },
      }),
    ).rejects.toMatchObject({ code: 'validation_failed' })
    await expect(sign({ patientId, noteId: note.id, status: 'signed', draft })).rejects.toMatchObject({
      code: 'conflict',
    })
    expect(calls).toHaveLength(2)
  })

  it('adds addenda to signed notes only', async () => {
    const add = addAddendum({ clinical: { addAddendum: () => Promise.resolve(note) } })
    await expect(add({ note, text: 'x' })).rejects.toMatchObject({ code: 'conflict' })
    await expect(add({ note: { ...note, status: 'signed' }, text: 'Repeat potassium 5.2' })).resolves.toBeTruthy()
  })

  it('needs tests and an indication to order', async () => {
    const order = placeLabOrder({ labs: { placeOrder: () => Promise.reject(new Error('not called')) } })
    await expect(order({ patientId, items: [], indication: 'x' })).rejects.toMatchObject({ code: 'validation_failed' })
  })

  it('acknowledges and releases; a failed release is a warning', async () => {
    const labs = {
      acknowledge: () => Promise.resolve({ ...result, review: 'acknowledged' as const }),
      release: () => Promise.reject(new Error('offline')),
    }
    const out = await acknowledgeResult({ labs })({ result, release: true, comment: 'High' })
    expect(out.value.review).toBe('acknowledged')
    expect(out.warnings).toEqual([{ code: 'release-failed', reason: 'Acknowledged, but not released to the patient' }])
  })

  it('will not release a critical result before acknowledgement', async () => {
    const release = releaseResult({ labs: { release: () => Promise.resolve(result) } })
    await expect(release({ result, comment: '' })).rejects.toMatchObject({ code: 'conflict' })
  })
})
