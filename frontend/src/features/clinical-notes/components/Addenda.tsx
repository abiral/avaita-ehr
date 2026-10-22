import { useState } from 'react'
import type { ClinicalNote } from '@/domain/clinical'
import { formatShortDate, formatTime, t } from '@/i18n'
import styles from '../Notes.module.css'

export interface AddendaProps {
  readonly note: ClinicalNote
  readonly timeZone: string
  readonly text: string
  readonly onText: (text: string) => void
}

/** Addenda already on a signed note, and the box for a new one. */
export function Addenda({ note, timeZone, text, onText }: AddendaProps) {
  const [id] = useState('note-addendum')
  return (
    <div className={styles.sec}>
      {note.addenda.length > 0 ? (
        <>
          <span className={styles.secLabel}>{t('clinical.note.addenda')}</span>
          <ul className={styles.addenda}>
            {note.addenda.map((a) => (
              <li key={`${a.at.toISOString()}-${a.text}`} className={styles.addendum}>
                <span>{a.text}</span>
                <span className={styles.muted}>
                  {t('clinical.note.addendumMeta', {
                    author: a.authorName,
                    when: `${formatShortDate(a.at, timeZone)} ${formatTime(a.at, timeZone)}`,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <label htmlFor={id} className={styles.secLabel}>
        {t('clinical.note.addendum')}
      </label>
      <textarea id={id} className={styles.textarea} rows={2} value={text} onChange={(e) => onText(e.target.value)} />
    </div>
  )
}
