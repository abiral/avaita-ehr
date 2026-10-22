export interface PasswordCheck {
  readonly length: boolean
  readonly number: boolean
  readonly match: boolean
}

export const MIN_PASSWORD_LENGTH = 10

/** Password policy shown live on P2 and P3. */
export const checkPassword = (password: string, confirm: string = password): PasswordCheck => ({
  length: password.length >= MIN_PASSWORD_LENGTH,
  number: /\d/.test(password),
  match: password.length > 0 && password === confirm,
})

export const passwordOk = (c: PasswordCheck): boolean => c.length && c.number && c.match

/** Only same-app paths are allowed after sign in (no open redirects). */
export const safeReturnTo = (
  value: string | null,
  area: '/portal' | '/staff' | '/admin' | readonly string[],
): string | null => {
  if (!value?.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  const areas = typeof area === 'string' ? [area] : area
  return areas.some((a) => value === a || value.startsWith(`${a}/`) || value.startsWith(`${a}?`)) ? value : null
}
