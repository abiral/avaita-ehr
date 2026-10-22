import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { PackageId } from '@/core/branded'
import { errorCodeOf } from '@/core/errors'
import { draftProblems, type ConsultationPackage } from '@/domain/packages'
import { errorMessage, t } from '@/i18n'
import { formFromPackage, newPackageForm, toDraft, type PackageForm } from './packageForm'

export type SaveNotice = { readonly tone: 'ok' | 'error'; readonly text: string } | null

function useSave(onSaved: (p: ConsultationPackage, published: boolean) => void) {
  const { useCases } = useServices()
  const keys = useKeys()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { form: PackageForm; publish: boolean }) =>
      useCases.savePackage({ draft: toDraft(input.form), publish: input.publish }),
    onSuccess: async ({ value }, { publish }) => {
      onSaved(value, publish)
      await client.invalidateQueries({ queryKey: keys.packages })
    },
  })
}

/** A3: package list, the selected package in the editor, and save or publish. */
export function useAdminPackages() {
  const { repos } = useServices()
  const keys = useKeys()
  const list = useQuery({ queryKey: keys.packages, queryFn: ({ signal }) => repos.packages.list(signal) })
  const doctors = useQuery({
    queryKey: keys.practitioners({}),
    queryFn: ({ signal }) => repos.practitioners.list({}, signal),
  })
  const [form, setForm] = useState<PackageForm | null>(null)
  const [notice, setNotice] = useState<SaveNotice>(null)
  const [tried, setTried] = useState(false)
  const first = list.data?.[0]
  const current = form ?? (first ? formFromPackage(first) : null)
  const save = useSave((p, published) => {
    setForm(formFromPackage(p))
    setNotice({ tone: 'ok', text: published ? t('admin.packages.savedPublished') : t('admin.packages.savedDraft') })
  })
  const edit = (patch: Partial<PackageForm>) => {
    if (!current) return
    setForm({ ...current, ...patch })
    setNotice(null)
  }
  const select = (id: PackageId) => {
    const p = list.data?.find((x) => x.id === id)
    if (!p) return
    setForm(formFromPackage(p))
    setNotice(null)
    setTried(false)
  }
  const startNew = () => {
    setForm(newPackageForm(doctors.data?.[0]?.id ?? null))
    setNotice(null)
    setTried(false)
  }
  const problems = current ? draftProblems(toDraft(current)) : []
  const submit = (publish: boolean) => {
    setTried(true)
    if (!current || problems.length > 0) return
    save.mutate(
      { form: current, publish },
      { onError: (e) => setNotice({ tone: 'error', text: errorMessage(errorCodeOf(e)) }) },
    )
  }
  return {
    list,
    doctors: doctors.data ?? [],
    form: current,
    edit,
    select,
    startNew,
    submit,
    saving: save.isPending,
    notice,
    problems: tried ? problems : [],
  }
}
