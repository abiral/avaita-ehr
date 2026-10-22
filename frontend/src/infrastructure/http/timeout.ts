import { AppError } from '@/core/errors'
import type { Interceptor } from './types'

/** Own AbortController per request; forwards the caller's signal and tells timeout from abort. */
export const timeout =
  (ms: number): Interceptor =>
  (next) =>
  async (req) => {
    if (req.signal?.aborted) throw new AppError('Request aborted', 'aborted')
    const controller = new AbortController()
    const state = { timedOut: false }
    const timer = setTimeout(() => {
      state.timedOut = true
      controller.abort()
    }, ms)
    const onAbort = () => {
      controller.abort()
    }
    req.signal?.addEventListener('abort', onAbort)
    try {
      return await next({ ...req, signal: controller.signal })
    } catch (e) {
      if (controller.signal.aborted) {
        throw new AppError(
          state.timedOut ? 'Request timed out' : 'Request aborted',
          state.timedOut ? 'timeout' : 'aborted',
          {
            cause: e,
          },
        )
      }
      throw e
    } finally {
      clearTimeout(timer)
      req.signal?.removeEventListener('abort', onAbort)
    }
  }
