import styles from './Charts.module.css'

export interface TrendPoint {
  readonly label: string
  readonly value: number
  /** Text such as "18 Oct: 5.2 mmol/L, high". */
  readonly description: string
  readonly outOfRange: boolean
}

export interface TrendChartProps {
  readonly title: string
  readonly note: string
  readonly summary: string
  readonly points: readonly TrendPoint[]
  readonly band: { readonly low: number; readonly high: number }
  readonly domain: { readonly min: number; readonly max: number }
  readonly ticks: readonly number[]
}

const W = 560
const H = 170
const LEFT = 44
const RIGHT = 544
const MONO = 'IBM Plex Mono, monospace'

type Scale = (v: number) => number

function Grid({ ticks, yOf }: { readonly ticks: readonly number[]; readonly yOf: Scale }) {
  return ticks.map((tick) => (
    <g key={tick} aria-hidden="true">
      <line x1={LEFT} x2={RIGHT} y1={yOf(tick)} y2={yOf(tick)} stroke="#EDF0F4" strokeWidth="1" />
      <text x="36" y={yOf(tick) + 4} textAnchor="end" fontSize="11" fill="#5D6B7E" fontFamily={MONO}>
        {tick}
      </text>
    </g>
  ))
}

function Point({ p }: { readonly p: TrendPoint & { x: number; y: number } }) {
  return (
    <g className={styles.point} tabIndex={0} role="img" aria-label={p.description}>
      <title>{p.description}</title>
      <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
      <circle cx={p.x} cy={p.y} r="4.5" fill={p.outOfRange ? '#B42318' : '#1F56B4'} stroke="#fff" strokeWidth="2" />
      <text x={p.x} y="160" textAnchor="middle" fontSize="11" fill="#5D6B7E" fontFamily="IBM Plex Sans, sans-serif">
        {p.label}
      </text>
    </g>
  )
}

/** One series, reference band, value label on the latest point, keyboard-reachable points with text. */
export function TrendChart({ title, note, summary, points, band, domain, ticks }: TrendChartProps) {
  const yOf: Scale = (v) => 140 - ((v - domain.min) / (domain.max - domain.min)) * 124
  const stepX = points.length > 1 ? (RIGHT - LEFT - 80) / (points.length - 1) : 0
  const xy = points.map((p, i) => ({ ...p, x: LEFT + 40 + i * stepX, y: yOf(p.value) }))
  const last = xy[xy.length - 1]
  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        <span className={styles.captionTitle}>{title}</span>
        <span className={styles.captionNote}>{note}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="group" aria-label={summary}>
        <rect x={LEFT} y={yOf(band.high)} width={RIGHT - LEFT} height={yOf(band.low) - yOf(band.high)} fill="#EAF1FC" />
        <Grid ticks={ticks} yOf={yOf} />
        <polyline
          points={xy.map((p) => `${p.x},${p.y.toFixed(1)}`).join(' ')}
          fill="none"
          stroke="#1F56B4"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {xy.map((p) => (
          <Point key={p.label} p={p} />
        ))}
        {last ? (
          <text
            x={last.x - 12}
            y={last.y + 4}
            textAnchor="end"
            fontSize="12"
            fontWeight="600"
            fill="#101828"
            fontFamily={MONO}
            aria-hidden="true"
          >
            {last.value}
          </text>
        ) : null}
      </svg>
    </figure>
  )
}
