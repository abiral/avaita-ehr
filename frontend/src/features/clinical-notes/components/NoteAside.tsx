import { Link } from 'react-router'
import { paths } from '@/app/routes'
import type { CareTeamMember, ClinicalNote } from '@/domain/clinical'
import { formatShortDate, t } from '@/i18n'
import { Card, Checkbox, Select, Tag } from '@/ui'
import styles from '../Notes.module.css'
import { INSERTS, TEMPLATES, templateKeyOf, templateLabel, type InsertKey, type TemplateKey } from '../model/noteForm'

const isTemplate = (v: string): v is TemplateKey => TEMPLATES.some((k) => k === v)

export interface NoteAsideProps {
  readonly patientId: string
  readonly notes: readonly ClinicalNote[]
  readonly openId: string | null
  readonly template: string
  readonly readOnly: boolean
  readonly inserts: readonly InsertKey[]
  readonly copyTo: readonly CareTeamMember[]
  readonly timeZone: string
  readonly onTemplate: (label: string) => void
  readonly onInserts: (inserts: readonly InsertKey[]) => void
}

function NoteList({
  patientId,
  notes,
  openId,
  timeZone,
}: Pick<NoteAsideProps, 'patientId' | 'notes' | 'openId' | 'timeZone'>) {
  return (
    <Card as="section" labelledBy="note-list" className={styles.side}>
      <span className={styles.row}>
        <h2 id="note-list" className={styles.sideTitle}>
          {t('clinical.note.notes')}
        </h2>
        <Link to={paths.staff.newNote(patientId)} className={styles.muted}>
          {t('clinical.note.newNote')}
        </Link>
      </span>
      <ul className={styles.noteLinks} aria-label={t('clinical.note.noteList')}>
        {notes.map((n) => (
          <li key={n.id}>
            <Link
              to={`${paths.staff.notes(patientId)}?note=${n.id}`}
              className={styles.noteLink}
              aria-current={n.id === openId ? 'true' : undefined}
            >
              <span className={styles.noteLinkText}>
                <span>{n.title}</span>
                <span className={styles.muted}>
                  {n.authorName} · {formatShortDate(n.signedAt ?? n.createdAt, timeZone)}
                </span>
              </span>
              <Tag tone={n.status === 'draft' ? 'outline' : 'neutral'}>{t(`clinical.note.status.${n.status}`)}</Tag>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** C6 side panel: other notes, template, what to insert from the chart, and copy recipients. */
export function NoteAside(props: NoteAsideProps) {
  const { template, readOnly, inserts, copyTo, onTemplate, onInserts } = props
  return (
    <aside className={styles.aside} aria-label={t('clinical.note.tools')}>
      <NoteList {...props} />
      <Card as="section" labelledBy="note-template" className={styles.side}>
        <h2 id="note-template" className={styles.sideTitle}>
          {t('clinical.note.template')}
        </h2>
        <Select
          aria-label={t('clinical.note.templateLabel')}
          value={templateKeyOf(template)}
          disabled={readOnly}
          onChange={(e) => {
            if (isTemplate(e.target.value)) onTemplate(templateLabel(e.target.value))
          }}
          options={TEMPLATES.map((k) => ({ value: k, label: templateLabel(k) }))}
        />
      </Card>
      <Card as="section" labelledBy="note-insert" className={styles.side}>
        <h2 id="note-insert" className={styles.sideTitle}>
          {t('clinical.note.insert')}
        </h2>
        {INSERTS.map((k) => (
          <Checkbox
            key={k}
            label={t(`clinical.note.insertItems.${k}`)}
            checked={inserts.includes(k)}
            onChange={(e) => onInserts(e.target.checked ? [...inserts, k] : inserts.filter((x) => x !== k))}
          />
        ))}
      </Card>
      {copyTo.length > 0 ? (
        <Card as="section" labelledBy="note-copy" className={styles.side}>
          <h2 id="note-copy" className={styles.sideTitle}>
            {t('clinical.note.copyTo')}
          </h2>
          {copyTo.map((m) => (
            <span key={m.name} className={styles.row}>
              <span>{m.name}</span>
              <Tag>{m.role}</Tag>
            </span>
          ))}
        </Card>
      ) : null}
    </aside>
  )
}
