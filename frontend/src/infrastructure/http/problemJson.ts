import { ApiError, AppError } from '@/core/errors'
import type { Interceptor } from './types'

interface ProblemBody {
  readonly title?: unknown
  readonly code?: unknown
  readonly fields?: unknown
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

const toFields = (v: unknown): Record<string, string> => {
  if (!isRecord(v)) return {}
  const out: Record<string, string> = {}
  for (const [k, msg] of Object.entries(v)) if (typeof msg === 'string') out[k] = msg
  return out
}

const defaultCode = (status: number): string => {
  if (status === 401) return 'unauthenticated'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 422) return 'validation_failed'
  if (status === 423) return 'session_locked'
  return 'unknown'
}

/** Non-2xx becomes ApiError from problem+json; a rejected fetch becomes network_error. */
export const problemJson = (): Interceptor => (next) => async (req) => {
  let res
  try {
    res = await next(req)
  } catch (e) {
    if (e instanceof AppError) throw e
    throw new AppError('Network request failed', 'network_error', { cause: e })
  }
  if (res.status >= 200 && res.status < 300) return res
  const body: ProblemBody = isRecord(res.body) ? res.body : {}
  const code = typeof body.code === 'string' ? body.code : defaultCode(res.status)
  const title = typeof body.title === 'string' ? body.title : `HTTP ${res.status}`
  throw new ApiError(title, code, res.status, toFields(body.fields))
}
