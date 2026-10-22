import { useState } from 'react'
import { useChartPatient } from '@/app/chart/useChartPatient'
import { useServices } from '@/app/ServicesProvider'
import { useSession } from '@/app/session/SessionProvider'
import { sessionOf } from '@/app/session/sessionState'
import { useTenant } from '@/app/TenantProvider'
import { signProblems, type ClinicalNote, type NoteDraft } from '@/domain/clinical'
import { t } from '@/i18n'
import { Card, Page, SkeletonRows, useConfirm } from '@/ui'
import { NoteAside } from './components/NoteAside'
import { NoteEditor } from './components/NoteEditor'
import { DEFAULT_INSERTS, draftOf, type InsertKey } from './model/noteForm'
import { useNotes } from './model/useNotes'
import styles from './Notes.module.css'

type Notes = ReturnType<typeof useNotes>

/** The confirm control names the patient and MRN before the signature (section 1). */
function useSignConfirm() {
  const confirm = useConfirm()
  const banner = useChartPatient().summary.data?.banner
  return () =>
    confirm({
      title: t('clinical.note.confirmTitle'),
      description: t('clinical.note.confirmBody'),
      confirmLabel: t('clinical.note.confirmSign', { patient: banner?.displayName ?? '', mrn: banner?.mrn ?? '' }),
      cancelLabel: t('clinical.note.confirmCancel'),
    })
}

function useMyName(): string {
  const session = sessionOf(useSession().state)
  return session?.kind === 'staff' ? session.displayName : ''
}

function busyOf(n: Notes): 'save' | 'sign' | 'addendum' | null {
  if (n.save.isPending) return 'save'
  if (n.sign.isPending) return 'sign'
  return n.addendum.isPending ? 'addendum' : null
}

/** One open note; keyed by note id so switching notes starts from that note's text. */
function Workspace({ n, note }: { readonly n: Notes; readonly note: ClinicalNote | null }) {
  const { clock } = useServices()
  const { timeZone } = useTenant()
  const { summary } = useChartPatient()
  const me = useMyName()
  const confirmSign = useSignConfirm()
  const [draft, setDraft] = useState<NoteDraft>(() => draftOf(note))
  const [inserts, setInserts] = useState<readonly InsertKey[]>(DEFAULT_INSERTS)
  const [tried, setTried] = useState(false)
  const [addendum, setAddendum] = useState('')
  if (!summary.data) return null
  const copyTo = summary.data.careTeam.filter((m) => m.name !== me)
  return (
    <div className={styles.layout}>
      <NoteEditor
        note={note}
        draft={draft}
        summary={summary.data}
        inserts={inserts}
        problems={tried ? signProblems(draft) : []}
        addendum={addendum}
        busy={busyOf(n)}
        error={n.error}
        now={clock.now()}
        timeZone={timeZone}
        onDraft={setDraft}
        onAddendum={setAddendum}
        onSave={() => n.save.mutate(draft)}
        onSign={() => {
          setTried(true)
          if (signProblems(draft).length === 0) void confirmSign().then((yes) => yes && n.sign.mutate(draft))
        }}
        onAddAddendum={() => n.addendum.mutate(addendum, { onSuccess: () => setAddendum('') })}
      />
      <NoteAside
        patientId={n.patientId}
        notes={n.list.data ?? []}
        openId={note?.id ?? null}
        template={draft.template}
        readOnly={note?.status === 'signed'}
        inserts={inserts}
        copyTo={copyTo}
        timeZone={timeZone}
        onTemplate={(template) => setDraft({ ...draft, template })}
        onInserts={setInserts}
      />
    </div>
  )
}

/** C6: consultation notes for the chart's patient. */
export function NotesScreen() {
  const n = useNotes()
  return (
    <Page area="staff" gap={20}>
      {n.list.isPending ? (
        <Card>
          <SkeletonRows label={t('clinical.note.loading')} rows={6} />
        </Card>
      ) : (
        <Workspace key={n.note ? `${n.note.id}-${n.note.status}` : 'new'} n={n} note={n.note} />
      )}
    </Page>
  )
}
