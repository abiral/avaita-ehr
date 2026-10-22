export type Warning =
  | { readonly code: 'reminder-not-scheduled'; readonly reason: string }
  | { readonly code: 'calendar-file-failed'; readonly reason: string }
  | { readonly code: 'notification-partial'; readonly notified: number; readonly total: number }
  | { readonly code: 'release-failed'; readonly reason: string }

export interface Outcome<T> {
  readonly value: T
  readonly warnings: readonly Warning[]
}

export function outcome<T>(value: T, warnings: readonly Warning[] = []): Outcome<T> {
  return { value, warnings }
}
