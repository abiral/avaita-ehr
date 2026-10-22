import { redact, type Logger } from '@/core/logger'

/** Writes redacted events to the console in development only. */
export function createConsoleLogger(enabled: boolean): Logger {
  return {
    warn(event, data) {
      // eslint-disable-next-line no-console -- the Logger adapter is the one allowed console sink
      if (enabled) console.warn(event, redact(data))
    },
    error(event, data) {
      // eslint-disable-next-line no-console -- the Logger adapter is the one allowed console sink
      if (enabled) console.error(event, redact(data))
    },
  }
}
