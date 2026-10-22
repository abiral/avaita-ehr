import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useChartPatient } from '@/app/chart/useChartPatient'
import { useServices } from '@/app/ServicesProvider'
import { useKeys } from '@/app/useKeys'
import type { PatientId } from '@/core/branded'
import { errorCodeOf } from '@/core/errors'
import { duplicateWarnings, type LabCategory, type LabOrder } from '@/domain/labs'
import { errorMessage } from '@/i18n'
import type { BasketItem } from './basket'

function useCatalogueFilter() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<LabCategory>('chemistry')
  return { q, setQ, category, setCategory }
}

function useSendOrder(patientId: PatientId, onSent: () => void) {
  const { useCases } = useServices()
  const keys = useKeys()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { items: readonly BasketItem[]; indication: string }) =>
      useCases.placeLabOrder({ patientId, ...input }),
    onSuccess: async () => {
      onSent()
      client.removeQueries({ queryKey: keys.labBasket(patientId) })
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.allResults }),
        client.invalidateQueries({ queryKey: keys.patientSummary(patientId) }),
      ])
    },
  })
}

/** C7: catalogue, recent collections, the basket (kept in the query cache, never in storage) and sending. */
export function useLabOrder() {
  const { repos, clock } = useServices()
  const { patientId } = useChartPatient()
  const keys = useKeys()
  const client = useQueryClient()
  const catalogue = useQuery({ queryKey: keys.labCatalogue, queryFn: ({ signal }) => repos.labs.catalogue(signal) })
  const recent = useQuery({
    queryKey: keys.recentCollections(patientId),
    queryFn: ({ signal }) => repos.labs.recentCollections(patientId, signal),
  })
  const [basket, setBasket] = useState<readonly BasketItem[]>(
    () => client.getQueryData(keys.labBasket(patientId)) ?? [],
  )
  const filter = useCatalogueFilter()
  const [indication, setIndication] = useState('')
  const [tried, setTried] = useState(false)
  const [sent, setSent] = useState<LabOrder | null>(null)
  const [keptForLater, setKeptForLater] = useState(false)
  const changeBasket = (next: readonly BasketItem[]) => {
    setBasket(next)
    setSent(null)
    setKeptForLater(false)
  }
  const send = useSendOrder(patientId, () => {
    setBasket([])
    setIndication('')
    setTried(false)
  })
  const submit = () => {
    setTried(true)
    if (basket.length > 0 && indication.trim())
      send.mutate({ items: basket, indication }, { onSuccess: ({ value }) => setSent(value) })
  }
  const keepForLater = () => {
    client.setQueryData(keys.labBasket(patientId), basket)
    setKeptForLater(true)
  }
  const error = send.error ? errorMessage(errorCodeOf(send.error)) : null
  return {
    patientId,
    catalogue,
    basket,
    changeBasket,
    filter,
    indication,
    setIndication,
    indicationMissing: tried && !indication.trim(),
    duplicates: duplicateWarnings(
      basket.map((b) => b.testCode),
      recent.data ?? [],
      clock.now(),
    ),
    submit,
    sending: send.isPending,
    sent,
    error,
    keepForLater,
    keptForLater,
  }
}
