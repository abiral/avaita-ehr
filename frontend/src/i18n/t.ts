import { en, type Messages } from './en'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & (string | number)]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & (string | number)]

export type MessageKey = Leaves<Messages>
export type MessageParams = Readonly<Record<string, string | number>>

const lookup = (key: string): string => {
  let node: unknown = en
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return key
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : key
}

/** Reads a message from the English catalog and fills `{name}` placeholders. */
export function t(key: MessageKey, params?: MessageParams): string {
  const message = lookup(key)
  if (!params) return message
  return message.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

/** For error codes that may come from the server: falls back to the generic message. */
export function errorMessage(code: string): string {
  const key = `common.errors.${code}`
  const message = lookup(key)
  return message === key ? t('common.errors.unknown') : message
}
