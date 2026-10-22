declare const tag: unique symbol
export type Branded<T, Name extends string> = T & { readonly [tag]: Name }
export type PatientId = Branded<string, 'PatientId'>
export type PractitionerId = Branded<string, 'PractitionerId'>
export type StaffId = Branded<string, 'StaffId'>
export type AppointmentId = Branded<string, 'AppointmentId'>
export type PackageId = Branded<string, 'PackageId'>
export type LabOrderId = Branded<string, 'LabOrderId'>
export type LabResultId = Branded<string, 'LabResultId'>
export type MedicationId = Branded<string, 'MedicationId'>
export type MedicationRequestId = Branded<string, 'MedicationRequestId'>
export type NoteId = Branded<string, 'NoteId'>
export type BlockId = Branded<string, 'BlockId'>
export type TimeOffId = Branded<string, 'TimeOffId'>
export type RegistrationId = Branded<string, 'RegistrationId'>
