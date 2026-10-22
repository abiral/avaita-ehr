export type LogData = Readonly<Record<string, string | number | boolean>>

/** Adapters must redact PHI fields before writing anywhere. */
export interface Logger {
  warn(event: string, data?: LogData): void
  error(event: string, data?: LogData): void
}

const PHI_KEYS = /name|mrn|phone|email|dob|birth|address|note|comment|diagnosis|reason|patient/i

export function redact(data: LogData = {}): LogData {
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(data)) {
    out[key] = PHI_KEYS.test(key) ? '[redacted]' : value
  }
  return out
}
