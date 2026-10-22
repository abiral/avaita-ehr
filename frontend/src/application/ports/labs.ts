import type { LabResultId, PatientId } from '@/core/branded'
import type {
  InboxItem,
  LabOrder,
  LabResult,
  LabTest,
  NewLabOrder,
  OrderSet,
  PatientReport,
  RecentCollection,
} from '@/domain/labs/types'

export interface LabCatalogue {
  readonly tests: readonly LabTest[]
  readonly orderSets: readonly OrderSet[]
}

export interface LabRepository {
  catalogue(signal?: AbortSignal): Promise<LabCatalogue>
  recentCollections(id: PatientId, signal?: AbortSignal): Promise<RecentCollection[]>
  placeOrder(input: NewLabOrder): Promise<LabOrder>
  inbox(signal?: AbortSignal): Promise<InboxItem[]>
  result(id: LabResultId, signal?: AbortSignal): Promise<LabResult>
  patientResults(id: PatientId, signal?: AbortSignal): Promise<InboxItem[]>
  acknowledge(id: LabResultId): Promise<LabResult>
  release(id: LabResultId, comment: string): Promise<LabResult>
  myReports(signal?: AbortSignal): Promise<PatientReport[]>
}
