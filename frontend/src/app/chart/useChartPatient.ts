import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import type { PatientId } from '@/core/branded'
import { useServices } from '../ServicesProvider'
import { useKeys } from '../useKeys'

/** The chart's patient from the route, and the summary (banner included) every chart screen shares. */
export function useChartPatient() {
  const { repos } = useServices()
  const keys = useKeys()
  const { patientId: param = '' } = useParams()
  const patientId = param as PatientId
  const summary = useQuery({
    queryKey: keys.patientSummary(patientId),
    queryFn: ({ signal }) => repos.clinical.summary(patientId, signal),
    enabled: patientId !== '',
  })
  return { patientId, summary }
}
