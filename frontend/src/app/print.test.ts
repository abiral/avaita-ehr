import { createFakeClock } from '@/test/fakes/clock'
import { createServices } from './createServices'

describe('print view', () => {
  const footerOf = (mrn: string): string => {
    document.body.innerHTML = '<div id="print-root"></div>'
    let footer = ''
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      footer = document.querySelector('.print-footer')?.textContent ?? ''
    })
    const services = createServices({ apiBase: 'http://localhost/api', dev: false }, { clock: createFakeClock() })
    services.printer.print({
      title: 'Report',
      patientName: mrn ? 'Ramesh Pandey' : '',
      mrn,
      printedBy: 'Dr. Anaya Shrestha',
      sections: [],
    })
    print.mockRestore()
    return footer
  }

  it('puts the patient, MRN, who printed and when on every printed page', () => {
    expect(footerOf('NVG-188240')).toMatch(/^Ramesh Pandey · MRN NVG-188240 · Printed by Dr\. Anaya Shrestha · /)
  })

  it('marks multi-patient prints (handover) as containing patient information', () => {
    expect(footerOf('')).toMatch(/^Contains patient information · Printed by Dr\. Anaya Shrestha · /)
  })
})
