import { canChooseFormat, firstVisitMode, packageFormats, validityParts } from './formats'

describe('packageFormats strategy', () => {
  it('books the hybrid first visit on-site and follow-ups remote', () => {
    expect(packageFormats.hybrid.allowedModes(true)).toEqual(['onsite'])
    expect(packageFormats.hybrid.allowedModes(false)).toEqual(['remote'])
    expect(firstVisitMode('hybrid')).toBe('onsite')
    expect(firstVisitMode('remote')).toBe('remote')
    expect(firstVisitMode('onsite')).toBe('onsite')
    expect(packageFormats.patient_choice.allowedModes(true)).toEqual(['onsite', 'remote'])
  })

  it('lets patients choose only where the format allows', () => {
    expect(canChooseFormat({ format: 'patient_choice' }, 'remote')).toBe(true)
    expect(canChooseFormat({ format: 'patient_choice' }, 'hybrid')).toBe(false)
    expect(canChooseFormat({ format: 'onsite' }, 'remote')).toBe(false)
    expect(canChooseFormat({ format: 'hybrid' }, 'hybrid')).toBe(true)
  })

  it('labels validity in days or months', () => {
    expect(validityParts(90)).toEqual({ unit: 'days', count: 90 })
    expect(validityParts(365)).toEqual({ unit: 'months', count: 12 })
  })
})
