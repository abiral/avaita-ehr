import { QueryClient } from '@tanstack/react-query'
import { AppError } from '@/core/errors'

const NO_RETRY = new Set([
  'unauthenticated',
  'forbidden',
  'not_found',
  'validation_failed',
  'schema_mismatch',
  'session_locked',
])

export function createQueryClient(retry = true): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: retry ? (count, e) => count < 2 && !(e instanceof AppError && NO_RETRY.has(e.code)) : false,
      },
      mutations: { retry: false },
    },
  })
}
