import type { z } from 'zod'

export type Who = 'none' | 'patient' | 'staff' | 'admin'

/** One API operation in the draft contract. Examples are recorded from the mock server. */
export interface Endpoint {
  readonly id: string
  readonly group: string
  readonly method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  /** OpenAPI path with {params}. */
  readonly path: string
  readonly summary: string
  readonly as: Who
  readonly params?: Readonly<Record<string, string>>
  readonly query?: Readonly<Record<string, string>>
  readonly headers?: Readonly<Record<string, string>>
  readonly body?: unknown
  readonly request?: z.ZodType
  /** Null for 204 responses. */
  readonly response: z.ZodType | null
  readonly status: number
  readonly errors: readonly string[]
  /** Calls made first on the same mock db (for example cancel before restore). */
  readonly before?: readonly { readonly method: 'post'; readonly path: string; readonly body?: unknown }[]
  /** Server-sent event stream: documented, not executed in the contract test. */
  readonly stream?: boolean
}
