import type { PrintableDocument, Printer } from '@/application/ports'
import type { Clock } from '@/core/clock'

const el = (tag: string, text?: string): HTMLElement => {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

/** Renders into #print-root with the PHI footer on every page, then opens the print dialog. */
export function createBrowserPrinter(clock: Clock, formatStamp: (d: Date) => string): Printer {
  return {
    print(doc: PrintableDocument) {
      const root = document.getElementById('print-root')
      if (!root) return
      root.replaceChildren()
      root.append(el('h1', doc.title))
      for (const section of doc.sections) {
        root.append(el('h2', section.heading))
        for (const line of section.lines) root.append(el('p', line))
      }
      const footer = el(
        'footer',
        `${doc.patientName} · MRN ${doc.mrn} · Printed by ${doc.printedBy} · ${formatStamp(clock.now())}`,
      )
      footer.className = 'print-footer'
      root.append(footer)
      window.print()
      root.replaceChildren()
    },
  }
}
