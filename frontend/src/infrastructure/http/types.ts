export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface HttpRequest {
  readonly method: HttpMethod
  readonly path: string
  readonly query?: Readonly<Record<string, string | undefined>>
  readonly headers?: Readonly<Record<string, string>>
  readonly body?: unknown
  readonly signal?: AbortSignal | undefined
}

export interface HttpResponse {
  readonly status: number
  readonly headers: Headers
  readonly body: unknown
}

export type Handler = (req: HttpRequest) => Promise<HttpResponse>
export type Interceptor = (next: Handler) => Handler

export const compose = (interceptors: readonly Interceptor[], terminal: Handler): Handler =>
  interceptors.reduceRight<Handler>((next, wrap) => wrap(next), terminal)

export const withHeaders = (req: HttpRequest, headers: Readonly<Record<string, string>>): HttpRequest => ({
  ...req,
  headers: { ...req.headers, ...headers },
})
