import { NOTE_SECTION_KEYS, type ClinicalNote, type NoteDraft, type PlanItem } from '@/domain/clinical'
import { t } from '@/i18n'

export const TEMPLATES = ['consultation', 'progress', 'discharge', 'procedure'] as const
export type TemplateKey = (typeof TEMPLATES)[number]

export const INSERTS = ['vitals', 'labs', 'medications', 'problems', 'allergies'] as const
export type InsertKey = (typeof INSERTS)[number]
export const DEFAULT_INSERTS: readonly InsertKey[] = ['vitals', 'labs']

const emptySections = (): NoteDraft['sections'] =>
  Object.fromEntries(NOTE_SECTION_KEYS.map((k) => [k, ''])) as NoteDraft['sections']

export const templateLabel = (key: TemplateKey): string => t(`clinical.note.templates.${key}`)

export const templateKeyOf = (label: string): TemplateKey =>
  TEMPLATES.find((k) => templateLabel(k) === label) ?? 'consultation'

export const blankDraft = (): NoteDraft => ({
  template: templateLabel('consultation'),
  sections: emptySections(),
  plan: [],
})

export const draftOf = (note: ClinicalNote | null): NoteDraft =>
  note ? { template: note.template, sections: note.sections, plan: note.plan } : blankDraft()

export const addPlanItem = (plan: readonly PlanItem[], text: string): readonly PlanItem[] =>
  text.trim() ? [...plan, { text: text.trim(), orderStatus: 'none' }] : plan

export const removePlanItem = (plan: readonly PlanItem[], index: number): readonly PlanItem[] =>
  plan.filter((_, i) => i !== index)

/** The note to open: the one asked for, else the newest draft, else the newest note. */
export function pickNote(notes: readonly ClinicalNote[], requested: string | null): ClinicalNote | null {
  if (requested) return notes.find((n) => n.id === requested) ?? null
  return notes.find((n) => n.status === 'draft') ?? notes[0] ?? null
}
