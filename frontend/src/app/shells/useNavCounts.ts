import { useQuery } from '@tanstack/react-query'
import type { Permission } from '@/domain/identity'
import { isOpenRefill } from '@/domain/medications'
import { useServices } from '../ServicesProvider'
import { useTenant } from '../TenantProvider'
import { useKeys } from '../useKeys'
import type { NavCounts } from './staffNav'

/** Sidebar counts: my patients, results to review, open medication requests (only where permitted). */
export function useNavCounts(): NavCounts {
  const { repos } = useServices()
  const keys = useKeys()
  const { membership } = useTenant()
  const has = (p: Permission) => membership?.permissions.includes(p) ?? false
  const patients = useQuery({
    queryKey: keys.patients,
    queryFn: ({ signal }) => repos.clinical.patients(signal),
    enabled: has('chart:read'),
  })
  const inbox = useQuery({
    queryKey: keys.resultsInbox,
    queryFn: ({ signal }) => repos.labs.inbox(signal),
    enabled: has('result:review'),
  })
  const refills = useQuery({
    queryKey: keys.medicationRequests,
    queryFn: ({ signal }) => repos.medications.queue(signal),
    enabled: has('refill:decide'),
  })
  return {
    ...(patients.data ? { patients: patients.data.filter((p) => p.mine).length } : {}),
    ...(inbox.data ? { results: inbox.data.filter((r) => r.review === 'unreviewed').length } : {}),
    ...(refills.data ? { medicationRequests: refills.data.filter((r) => isOpenRefill(r.status)).length } : {}),
  }
}
