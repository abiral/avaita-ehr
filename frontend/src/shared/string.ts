/** Case- and accent-insensitive match of every word in `query` against `text`. */
export const matchesQuery = (text: string, query: string): boolean => {
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
  const hay = norm(text)
  return norm(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word))
}

export const pad2 = (n: number): string => String(n).padStart(2, '0')
