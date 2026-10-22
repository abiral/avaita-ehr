import type { ClinicalNote, NoteDraft, NoteSectionKey, PatientSummary, SignProblem } from '@/domain/clinical'
import { formatShortDate, formatTime, t } from '@/i18n'
import { Banner, Button, Card, StatusMessage, Tag } from '@/ui'
import styles from '../Notes.module.css'
import type { InsertKey } from '../model/noteForm'
import { Addenda } from './Addenda'
import { Investigations } from './Investigations'
import { PlanList } from './PlanList'
import { SectionField } from './SectionField'

export interface NoteEditorProps {
  readonly note: ClinicalNote | null
  readonly draft: NoteDraft
  readonly summary: PatientSummary
  readonly inserts: readonly InsertKey[]
  readonly problems: readonly SignProblem[]
  readonly addendum: string
  readonly busy: 'save' | 'sign' | 'addendum' | null
  readonly error: string | null
  readonly now: Date
  readonly timeZone: string
  readonly onDraft: (draft: NoteDraft) => void
  readonly onAddendum: (text: string) => void
  readonly onSave: () => void
  readonly onSign: () => void
  readonly onAddAddendum: () => void
}

const when = (d: Date, tz: string) => `${formatShortDate(d, tz)} ${formatTime(d, tz)}`
const PROBLEM_OF: Partial<Record<NoteSectionKey, SignProblem>> = {
  reason: 'reason-required',
  assessment: 'assessment-required',
}

function metaLine(note: ClinicalNote | null, ward: string | null, now: Date, timeZone: string): string {
  const base = t('clinical.note.meta', {
    department: note?.department ?? t('clinical.note.defaultDepartment'),
    when: when(note?.createdAt ?? now, timeZone),
  })
  return ward ? `${base} · ${ward}` : base
}

function Head({ note, now, timeZone, summary }: Pick<NoteEditorProps, 'note' | 'now' | 'timeZone' | 'summary'>) {
  const status = note?.status ?? 'draft'
  return (
    <div className={styles.head}>
      <div className={styles.titleBlock}>
        <h2 className={styles.title}>{note?.title ?? t('clinical.note.title')}</h2>
        <span className={styles.muted}>{metaLine(note, summary.banner.ward, now, timeZone)}</span>
      </div>
      <Tag tone={status === 'signed' ? 'info' : 'neutral'}>{t(`clinical.note.status.${status}`)}</Tag>
    </div>
  )
}

function SignedNotice({ note, timeZone }: { readonly note: ClinicalNote; readonly timeZone: string }) {
  const copies = note.copyTo.map((m) => `${m.name} (${m.role})`).join(', ')
  return (
    <div className={styles.notice}>
      <StatusMessage>
        {t('clinical.note.signedBanner', {
          time: formatTime(note.signedAt ?? note.createdAt, timeZone),
          author: note.authorName,
        })}
        {copies ? ` ${t('clinical.note.copySent', { names: copies })}` : ''} {t('clinical.note.addendaOnly')}
      </StatusMessage>
    </div>
  )
}

function Footer(
  p: Pick<NoteEditorProps, 'note' | 'busy' | 'timeZone' | 'addendum' | 'onSave' | 'onSign' | 'onAddAddendum'>,
) {
  const signed = p.note?.status === 'signed'
  const saved = p.note?.savedAt
  return (
    <div className={styles.foot}>
      <span className={styles.muted}>
        {saved ? t('clinical.note.savedAt', { time: formatTime(saved, p.timeZone) }) : t('clinical.note.notSaved')}
      </span>
      <div className={styles.buttons}>
        {signed ? (
          <Button variant="primary" disabled={!p.addendum.trim() || p.busy !== null} onClick={p.onAddAddendum}>
            {t('clinical.note.addAddendum')}
          </Button>
        ) : (
          <>
            <Button disabled={p.busy !== null} onClick={p.onSave}>
              {p.busy === 'save' ? t('clinical.note.saving') : t('clinical.note.saveDraft')}
            </Button>
            <Button variant="primary" disabled={p.busy !== null} onClick={p.onSign}>
              {p.busy === 'sign' ? t('clinical.note.signing') : t('clinical.note.sign')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/** C6 note: free-text sections, facts pulled from the chart, plan, then save, sign or add an addendum. */
export function NoteEditor(props: NoteEditorProps) {
  const { note, draft, onDraft, problems } = props
  const readOnly = note?.status === 'signed'
  const section = (name: NoteSectionKey) => {
    const problem = PROBLEM_OF[name]
    return (
      <SectionField
        name={name}
        value={draft.sections[name]}
        readOnly={readOnly}
        error={problem && problems.includes(problem) ? t(`clinical.note.signProblems.${problem}`) : undefined}
        onChange={(value) => onDraft({ ...draft, sections: { ...draft.sections, [name]: value } })}
      />
    )
  }
  return (
    <Card as="article" className={styles.editor}>
      <Head {...props} />
      {note?.status === 'signed' ? <SignedNotice note={note} timeZone={props.timeZone} /> : null}
      {props.error ? (
        <div className={styles.notice}>
          <Banner tone="critical">{props.error}</Banner>
        </div>
      ) : null}
      {section('reason')}
      {section('history')}
      {section('examination')}
      <Investigations summary={props.summary} inserts={props.inserts} pulledAt={props.now} timeZone={props.timeZone} />
      {section('assessment')}
      <PlanList plan={draft.plan} readOnly={readOnly} onChange={(plan) => onDraft({ ...draft, plan })} />
      {section('followUp')}
      {note && readOnly ? (
        <Addenda note={note} timeZone={props.timeZone} text={props.addendum} onText={props.onAddendum} />
      ) : null}
      <Footer {...props} />
    </Card>
  )
}
