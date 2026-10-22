import type { LabFlag, ReferenceRange } from './types'

const FLAG_ORDER: Readonly<Record<LabFlag, number>> = {
  normal: 0,
  low: 1,
  high: 1,
  'critical-low': 2,
  'critical-high': 2,
}

/** Maps a value and its reference range to a flag. */
export function labFlag(value: number, range: ReferenceRange): LabFlag {
  if (range.criticalHigh !== null && value >= range.criticalHigh) return 'critical-high'
  if (range.criticalLow !== null && value <= range.criticalLow) return 'critical-low'
  if (range.high !== null && value > range.high) return 'high'
  if (range.low !== null && value < range.low) return 'low'
  return 'normal'
}

export const isCritical = (flag: LabFlag): boolean => flag === 'critical-high' || flag === 'critical-low'
export const isAbnormal = (flag: LabFlag): boolean => flag !== 'normal'

/** The most severe flag of a set (critical over high or low over normal). */
export const worstFlag = (flags: readonly LabFlag[]): LabFlag =>
  flags.reduce<LabFlag>((worst, f) => (FLAG_ORDER[f] > FLAG_ORDER[worst] ? f : worst), 'normal')

/** Short flag text shown next to the value: never color alone. */
export const flagLetter = (flag: LabFlag): '' | 'H' | 'L' => {
  if (flag === 'high' || flag === 'critical-high') return 'H'
  if (flag === 'low' || flag === 'critical-low') return 'L'
  return ''
}

export type RangeShape =
  | { readonly kind: 'between'; readonly low: number; readonly high: number }
  | { readonly kind: 'above'; readonly low: number }
  | { readonly kind: 'below'; readonly high: number }
  | { readonly kind: 'none' }

export const rangeShape = (range: ReferenceRange): RangeShape => {
  if (range.low !== null && range.high !== null) return { kind: 'between', low: range.low, high: range.high }
  if (range.low !== null) return { kind: 'above', low: range.low }
  if (range.high !== null) return { kind: 'below', high: range.high }
  return { kind: 'none' }
}

/** Bounds for drawing a range bar when one side is open. */
export const barBounds = (range: ReferenceRange): { readonly low: number; readonly high: number } => {
  const shape = rangeShape(range)
  switch (shape.kind) {
    case 'between':
      return { low: shape.low, high: shape.high }
    case 'above':
      return { low: shape.low, high: shape.low * 2 }
    case 'below':
      return { low: 0, high: shape.high }
    case 'none':
      return { low: 0, high: 1 }
  }
}
