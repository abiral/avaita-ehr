import type { Handler, HttpRequest } from './types'

const buildUrl = (base: string, req: HttpRequest): string => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, value)
  }
  const qs = params.toString()
  return `${base}${req.path}${qs ? `?${qs}` : ''}`
}

const parseBody = async (res: Response): Promise<unknown> => {
  if (res.status === 204) return undefined
  const text = await res.text()
  if (!text) return undefined
  const type = res.headers.get('content-type') ?? ''
  return type.includes('json') ? (JSON.parse(text) as unknown) : text
}

/** The only fetch call in the app. Always sends the session cookie. */
export const fetchTerminal =
  (baseUrl: string): Handler =>
  async (req) => {
    const hasBody = req.body !== undefined
    const res = await fetch(buildUrl(baseUrl, req), {
      method: req.method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...req.headers,
      },
      body: hasBody ? JSON.stringify(req.body) : null,
      signal: req.signal ?? null,
    })
    return { status: res.status, headers: res.headers, body: await parseBody(res) }
  }
