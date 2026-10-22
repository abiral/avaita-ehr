import { NOTE_SECTION_KEYS, type NoteDraft } from './types'
import { noteStatus, signProblems, type NoteEvent } from './noteStatus'

describe('noteStatus', () => {
  it.each<[NoteEvent, 'draft' | 'signed', string]>([
    ['edit', 'draft', 'ok:draft'],
    ['save', 'draft', 'ok:draft'],
    ['sign', 'draft', 'ok:signed'],
    ['addend', 'draft', 'err:draft-has-no-addenda'],
    ['edit', 'signed', 'err:signed-note-is-final'],
    ['save', 'signed', 'err:signed-note-is-final'],
    ['sign', 'signed', 'err:signed-note-is-final'],
    ['addend', 'signed', 'ok:signed'],
  ])('%s on a %s note gives %s', (event, from, expected) => {
    const r = noteStatus(from, event)
    expect(r.ok ? `ok:${r.value}` : `err:${r.error}`).toBe(expected)
  })

  it('needs a reason and an assessment to sign', () => {
    const empty = Object.fromEntries(NOTE_SECTION_KEYS.map((k) => [k, ''])) as NoteDraft['sections']
    const draft: NoteDraft = { template: 't', sections: empty, plan: [] }
    expect(signProblems(draft)).toEqual(['reason-required', 'assessment-required'])
    expect(signProblems({ ...draft, sections: { ...empty, reason: 'r', assessment: 'a' } })).toEqual([])
  })
})
