type Json = null | boolean | number | string | readonly Json[] | { readonly [k: string]: Json }

const PLAIN_KEY = /^[A-Za-z_$][A-Za-z0-9_.\-/{}$]*$/
const key = (k: string): string => (PLAIN_KEY.test(k) ? k : JSON.stringify(k))
const scalar = (v: null | boolean | number | string): string => (typeof v === 'string' ? JSON.stringify(v) : String(v))
const isScalar = (v: Json): v is null | boolean | number | string => v === null || typeof v !== 'object'

function lines(node: Json, indent: string): string[] {
  if (isScalar(node)) return [`${indent}${scalar(node)}`]
  if (Array.isArray(node)) {
    if (node.length === 0) return [`${indent}[]`]
    return (node as readonly Json[]).flatMap((item) => {
      if (isScalar(item)) return [`${indent}- ${scalar(item)}`]
      const inner = lines(item, `${indent}  `)
      const first = inner[0] ?? ''
      return [`${indent}- ${first.trimStart()}`, ...inner.slice(1)]
    })
  }
  const entries = Object.entries(node as Record<string, Json>)
  if (entries.length === 0) return [`${indent}{}`]
  return entries.flatMap(([k, v]) => {
    if (isScalar(v)) return [`${indent}${key(k)}: ${scalar(v)}`]
    if (Array.isArray(v) && v.length === 0) return [`${indent}${key(k)}: []`]
    if (!Array.isArray(v) && Object.keys(v).length === 0) return [`${indent}${key(k)}: {}`]
    return [`${indent}${key(k)}:`, ...lines(v, `${indent}  `)]
  })
}

/** Minimal YAML writer for JSON-like data (strings are always double-quoted). */
export const toYaml = (node: Json): string => `${lines(node, '').join('\n')}\n`
