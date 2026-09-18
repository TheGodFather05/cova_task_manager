/**
 * Pure chart maths, kept out of the components so the degenerate cases can be tested without
 * rendering anything. Every function here is reachable with real data: a brand-new account
 * produces all-zero series, a zero total and an empty year on day one.
 */

/** The SVG viewBox the kit uses for trend lines. */
export const VIEW_WIDTH = 100
export const VIEW_HEIGHT = 40

export interface Point {
  x: number
  y: number
}

/**
 * Maps counts onto the 0 0 100 40 viewBox. yMax floors at 1 so an all-zero series draws a flat
 * line along the bottom instead of dividing by zero.
 */
export function toPoints(counts: number[]): Point[] {
  if (counts.length === 0) {
    return []
  }
  const yMax = Math.max(...counts, 1)
  const lastIndex = Math.max(counts.length - 1, 1)

  return counts.map((count, index) => ({
    x: (index / lastIndex) * VIEW_WIDTH,
    y: VIEW_HEIGHT - (count / yMax) * VIEW_HEIGHT,
  }))
}

function format(points: Point[]): string {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')
}

export function toPolyline(counts: number[]): string {
  return format(toPoints(counts))
}

/** The line closed down to the baseline, filled as the area beneath it. */
export function toAreaPolygon(counts: number[]): string {
  const points = toPoints(counts)
  if (points.length === 0) {
    return ''
  }
  const first = points[0]
  const last = points[points.length - 1]
  return format([{ x: first.x, y: VIEW_HEIGHT }, ...points, { x: last.x, y: VIEW_HEIGHT }])
}

export interface Slice {
  color: string
  value: number
}

/**
 * Cumulative conic-gradient stops. Returns null when the total is zero: a gradient built from
 * four zero-width stops renders as one solid colour, which would claim a 100% share that does
 * not exist. The caller draws an empty ring instead.
 */
export function toConicStops(slices: Slice[]): string | null {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  if (total <= 0) {
    return null
  }

  let accumulated = 0
  const stops = slices.map((slice) => {
    const from = (accumulated / total) * 100
    accumulated += slice.value
    const to = (accumulated / total) * 100
    return `${slice.color} ${from.toFixed(2)}% ${to.toFixed(2)}%`
  })
  return `conic-gradient(${stops.join(', ')})`
}

/** Bar height as a share of the tallest bar, not of the total: four equal bars fill the track. */
export function toBarHeight(count: number, counts: number[]): number {
  const max = Math.max(...counts, 1)
  return (count / max) * 100
}

/**
 * Five intensity buckets, GitHub-style: zero is its own step, everything else scales against
 * the busiest day so a single completed task still reads as activity.
 */
export function heatIntensity(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || maxCount <= 0) {
    return 0
  }
  return Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4))) as 1 | 2 | 3 | 4
}

/**
 * Pads the first heatmap column so the grid starts on the right weekday. Without this the
 * whole year is rotated and every weekday label lies. Monday-indexed, matching the backend.
 */
export function leadingBlanks(firstDate: string): number {
  const day = new Date(`${firstDate}T00:00:00Z`).getUTCDay()
  return (day + 6) % 7
}

/** Percent change, or null when the previous value was zero — undefined, not "no change". */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null
  }
  return ((current - previous) / previous) * 100
}

/** A delta the UI can render: null stays null all the way to the em dash. */
export function formatDelta(value: number | null, suffix = ''): string {
  if (value === null || Number.isNaN(value)) {
    return '—'
  }
  const rounded = Math.round(value * 10) / 10
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded}${suffix}`
}
