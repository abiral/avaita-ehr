import type { AccountKind, Session } from '@/domain/identity'

export interface SignInInput {
  readonly kind: AccountKind
  readonly identifier: string
  readonly password: string
}

export interface SessionRepository {
  current(signal?: AbortSignal): Promise<Session | null>
  signIn(input: SignInInput): Promise<Session>
  signOut(): Promise<void>
  unlock(password: string): Promise<Session>
  requestPasswordReset(email: string): Promise<void>
  confirmPasswordReset(input: { token: string; password: string }): Promise<void>
}
