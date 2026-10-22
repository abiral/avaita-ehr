export interface SparklineProps {
  readonly values: readonly number[]
  /** Text alternative listing the values. */
  readonly label: string
  readonly width?: number
  readonly height?: number
}

export const sparkPoints = (values: readonly number[], width: number, height: number): [number, number][] => {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const step = values.length > 1 ? (width - 12) / (values.length - 1) : 0
  return values.map((v, i) => [6 + i * step, height - 6 - ((v - lo) / span) * (height - 12)])
}

/** One series, 2px line, marker on the latest value. */
export function Sparkline({ values, label, width = 120, height = 28 }: SparklineProps) {
  const pts = sparkPoints(values, width, height)
  const last = pts[pts.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      <polyline
        points={pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="#1F56B4"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last ? <circle cx={last[0]} cy={last[1]} r="4" fill="#1F56B4" stroke="#fff" strokeWidth="2" /> : null}
    </svg>
  )
}
