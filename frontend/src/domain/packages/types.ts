import type { PackageId, PractitionerId } from '@/core/branded'
import type { Money } from '@/core/money'
import type { VisitMode } from '../scheduling/types'

export const PACKAGE_FORMATS = ['onsite', 'remote', 'hybrid', 'patient_choice'] as const
export type PackageFormat = (typeof PACKAGE_FORMATS)[number]

export const PACKAGE_ITEM_TYPES = ['consultation', 'lab', 'session', 'messaging', 'report'] as const
export type PackageItemType = (typeof PACKAGE_ITEM_TYPES)[number]

export interface PackageItem {
  readonly type: PackageItemType
  readonly quantity: number
  readonly label: string
}

export interface ConsultationPackage {
  readonly id: PackageId
  readonly practitionerId: PractitionerId
  readonly practitionerName: string
  readonly category: string
  readonly name: string
  readonly description: string
  readonly format: PackageFormat
  readonly validityDays: number
  readonly price: Money | null
  readonly monthlyCap: number | null
  readonly published: boolean
  readonly items: readonly PackageItem[]
  readonly bookedCount: number
}

export type PackageDraft = Omit<ConsultationPackage, 'id' | 'practitionerName' | 'category' | 'bookedCount'> & {
  readonly id: PackageId | null
}

export interface PackageEnrollment {
  readonly id: string
  readonly packageId: PackageId
  readonly chosenFormat: PackageFormat
  readonly start: Date
  readonly expires: Date
  readonly firstAppointmentId: string
}

export interface NewEnrollment {
  readonly packageId: PackageId
  readonly chosenFormat: PackageFormat
  readonly firstVisit: { readonly start: Date; readonly mode: VisitMode }
}
