export type LocalCode = 'network_error' | 'timeout' | 'aborted' | 'schema_mismatch' | 'session_locked' | 'unknown'
export type RemoteCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation_failed'
  | 'slot_taken'
  | 'slot_outside_availability'
  | 'practitioner_on_leave'
  | 'mode_not_offered'
  | 'package_unavailable'
  | 'cancellation_window_closed'
  | 'duplicate_lab_order'
  | 'refill_not_allowed'
  | 'invalid_credentials'
  | 'invalid_code'
export type ErrorCode = LocalCode | RemoteCode | (string & Record<never, never>)

export class AppError extends Error {
  readonly code: ErrorCode
  constructor(message: string, code: ErrorCode, options?: { cause?: unknown }) {
    super(message, options)
    this.name = new.target.name
    this.code = code
  }
}

/** Non-2xx answer parsed from RFC 9457 problem+json. `fields` holds per-field validation errors. */
export class ApiError extends AppError {
  readonly status: number
  readonly fields: Readonly<Record<string, string>>
  constructor(message: string, code: ErrorCode, status: number, fields: Readonly<Record<string, string>> = {}) {
    super(message, code)
    this.status = status
    this.fields = fields
  }
}

export class SchemaError extends AppError {
  readonly endpoint: string
  readonly issues: string
  constructor(endpoint: string, issues: string) {
    super(`Unexpected response from ${endpoint}`, 'schema_mismatch')
    this.endpoint = endpoint
    this.issues = issues
  }
}

export const hasCode = (e: unknown, code: ErrorCode): e is AppError => e instanceof AppError && e.code === code

export const errorCodeOf = (e: unknown): ErrorCode => (e instanceof AppError ? e.code : 'unknown')
