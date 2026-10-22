import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { organizationKeys } from '@/app/queryKeys'
import { paths } from '@/app/routes'
import { useServices } from '@/app/ServicesProvider'
import { useSession } from '@/app/session/SessionProvider'
import { sessionOf } from '@/app/session/sessionState'
import { useTenant } from '@/app/TenantProvider'
import type { FacilityId, OrganizationId } from '@/core/tenant'
import { membershipFor, safeReturnTo, type Department, type StaffSession } from '@/domain/identity'

const initialFacility = (
  staff: StaffSession | null,
  current: FacilityId | undefined,
  remembered: string | undefined,
): FacilityId | null => {
  if (current) return current
  const memberships = staff?.memberships ?? []
  return (memberships.find((m) => m.facility.id === remembered) ?? memberships[0])?.facility.id ?? null
}

const departmentsOf = (staff: StaffSession | null, facilityId: FacilityId | null): readonly Department[] =>
  staff && facilityId ? (membershipFor(staff, facilityId)?.departments ?? []) : []

function useStaff() {
  const { state, signOut } = useSession()
  const session = sessionOf(state)
  return { staff: session?.kind === 'staff' ? session : null, signOut }
}

/** Container hook for C1: pick a facility and department, then open the workspace. */
export function useWorkspaceScreen() {
  const { repos, prefs } = useServices()
  const { staff, signOut } = useStaff()
  const tenant = useTenant()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = useQuery({
    queryKey: organizationKeys(staff?.organizationId ?? ('' as OrganizationId)).myFacilities,
    queryFn: ({ signal }) => repos.tenancy.myFacilities(signal),
    enabled: staff !== null,
  })
  const [facilityId, setFacilityId] = useState(() =>
    initialFacility(staff, tenant.scope?.facilityId, prefs.get('lastFacilityId')),
  )
  const [departmentId, setDepartmentId] = useState<string | null>(tenant.department?.id ?? null)
  const [remember, setRemember] = useState(true)
  const departments = departmentsOf(staff, facilityId)
  const department = departments.find((d) => d.id === departmentId) ?? departments[0] ?? null
  const open = () => {
    if (!facilityId) return
    tenant.select(facilityId, department?.id)
    if (!remember) prefs.remove('lastFacilityId')
    void navigate(safeReturnTo(params.get('returnTo'), ['/staff', '/admin']) ?? paths.staff.today, { replace: true })
  }
  const pickFacility = (id: FacilityId) => {
    setFacilityId(id)
    setDepartmentId(null)
  }
  return {
    staff,
    query,
    facilityId,
    pickFacility,
    departments,
    department,
    setDepartmentId,
    remember,
    setRemember,
    open,
    signOut,
  }
}
