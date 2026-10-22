import type { z } from 'zod'
import { SchemaError } from '@/core/errors'
import { compose, type Handler, type HttpRequest, type Interceptor } from './types'

export interface HttpClient {
  send<S extends z.ZodType>(req: HttpRequest, schema: S): Promise<z.infer<S>>
  sendVoid(req: HttpRequest): Promise<void>
}

export function parseWith<S extends z.ZodType>(schema: S, body: unknown, endpoint: string): z.infer<S> {
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new SchemaError(endpoint, parsed.error.message)
  return parsed.data
}

export function createHttpClient(interceptors: readonly Interceptor[], terminal: Handler): HttpClient {
  const handler = compose(interceptors, terminal)
  return {
    async send(req, schema) {
      const res = await handler(req)
      return parseWith(schema, res.body, `${req.method} ${req.path}`)
    },
    async sendVoid(req) {
      await handler(req)
    },
  }
}
