import { useQueries } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { LabResultId } from '@/core/branded'
import { isCritical, labFlag, type LabResult } from '@/domain/labs'
import { useServices } from '../ServicesProvider'
import { useKeys } from '../useKeys'

export interface CriticalAlert {
  readonly result: LabResult
  readonly analyte: LabResult['analytes'][number]
}

/** Critical results pushed by the server (ids only); each stays until someone acknowledges it. */
export function useCriticalAlerts(): readonly CriticalAlert[] {
  const { realtime, repos } = useServices()
  const keys = useKeys()
  const [ids, setIds] = useState<readonly LabResultId[]>([])
  useEffect(
    () =>
      realtime.subscribe('result.critical', ({ resultId }) => {
        setIds((current) =>
          current.includes(resultId as LabResultId) ? current : [...current, resultId as LabResultId],
        )
      }),
    [realtime],
  )
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: keys.result(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => repos.labs.result(id, signal),
    })),
  })
  return results.flatMap((q) => {
    const result = q.data
    if (!result || result.review === 'acknowledged') return []
    const analyte = result.analytes.find((a) => isCritical(labFlag(a.value, a.range)))
    return analyte ? [{ result, analyte }] : []
  })
}
