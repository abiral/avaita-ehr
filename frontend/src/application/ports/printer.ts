export interface PrintableDocument {
  readonly title: string
  readonly patientName: string
  readonly mrn: string
  readonly printedBy: string
  readonly sections: readonly { readonly heading: string; readonly lines: readonly string[] }[]
}

export interface Printer {
  print(doc: PrintableDocument): void
}
