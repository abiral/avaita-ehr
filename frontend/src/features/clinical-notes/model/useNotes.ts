import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { useChartPatient } from '@/app/chart/useChartPatient'
import { paths } from '@/app/routes'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import { errorCodeOf } from '@/core/errors'
import type { ClinicalNote, NoteDraft } from '@/domain/clinical'
import { errorMessage, t } from '@/i18n'
import { useToast } from '@/ui'
import { pickNote } from './noteForm'

/** C6 data: the patient's notes, which one is open, and save, sign and addendum. */
export function useNotes() {
  const { repos, useCases } = useServices()
  const { patientId } = useChartPatient()
  const keys = useKeys()
  const client = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const isNew = useLocation().pathname.endsWith('/new')
  const [params] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const list = useQuery({
    queryKey: keys.notes(patientId),
    queryFn: ({ signal }) => repos.clinical.notes(patientId, signal),
  })
  const note = isNew ? null : pickNote(list.data ?? [], params.get('note'))
  const settle = async (saved: ClinicalNote, message: string) => {
    setError(null)
    toast.show({ message })
    await Promise.all([
      client.invalidateQueries({ queryKey: keys.notes(patientId) }),
      client.invalidateQueries({ queryKey: keys.patientSummary(patientId) }),
    ])
    if (note?.id !== saved.id) void navigate(`${paths.staff.notes(patientId)}?note=${saved.id}`, { replace: true })
  }
  const onError = (e: unknown) => setError(errorMessage(errorCodeOf(e)))
  const base = { patientId, noteId: note?.id ?? null, status: note?.status ?? ('draft' as const) }
  const save = useMutation({
    mutationFn: (draft: NoteDraft) => useCases.saveNoteDraft({ ...base, draft }),
    onSuccess: ({ value }) => settle(value, t('clinical.note.saved')),
    onError,
  })
  const sign = useMutation({
    mutationFn: (draft: NoteDraft) => useCases.signNote({ ...base, draft }),
    onSuccess: ({ value }) => settle(value, t('clinical.note.signedToast')),
    onError,
  })
  const addendum = useMutation({
    mutationFn: (text: string) => {
      if (!note) throw new Error('no note')
      return useCases.addAddendum({ note, text })
    },
    onSuccess: ({ value }) => settle(value, t('clinical.note.addendumSaved')),
    onError,
  })
  return { patientId, list, note, isNew, save, sign, addendum, error }
}
