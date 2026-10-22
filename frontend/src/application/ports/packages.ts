import type { PackageId } from '@/core/branded'
import type { ConsultationPackage, NewEnrollment, PackageDraft, PackageEnrollment } from '@/domain/packages/types'

export interface PackageRepository {
  /** Published packages for patients; every package for admins. */
  list(signal?: AbortSignal): Promise<ConsultationPackage[]>
  save(draft: PackageDraft): Promise<ConsultationPackage>
  publish(id: PackageId): Promise<ConsultationPackage>
  enroll(input: NewEnrollment): Promise<PackageEnrollment>
}
