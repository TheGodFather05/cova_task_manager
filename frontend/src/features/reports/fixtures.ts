import type { HeatmapDay, QuadrantCount, StatusCounts } from '../../types/report'
import type { TrendDatum } from './charts'

/**
 * Fixtures for the dev-only preview. The degenerate ones are not hypothetical: a brand-new
 * account produces every single one of them on its first visit.
 */

export const TREND_NORMAL: TrendDatum[] = [
  ['Mon', 3], ['Tue', 5], ['Wed', 2], ['Thu', 8], ['Fri', 11], ['Sat', 4], ['Sun', 1],
].map(([label, count]) => ({ label: label as string, count: count as number }))

export const TREND_ALL_ZERO: TrendDatum[] = TREND_NORMAL.map((point) => ({ ...point, count: 0 }))

export const TREND_SINGLE: TrendDatum[] = [{ label: '09:00', count: 4 }]

export const TREND_HOURLY: TrendDatum[] = Array.from({ length: 24 }, (_, hour) => ({
  label: `${String(hour).padStart(2, '0')}:00`,
  count: hour === 9 || hour === 14 ? 3 : hour === 16 ? 1 : 0,
}))

export const QUADRANTS_NORMAL: QuadrantCount[] = [
  { quadrant: 'DO_FIRST', count: 9, percentage: 50 },
  { quadrant: 'SCHEDULE', count: 6, percentage: 33.3 },
  { quadrant: 'DELEGATE', count: 3, percentage: 16.7 },
  { quadrant: 'DROP', count: 0, percentage: 0 },
]

export const QUADRANTS_EQUAL: QuadrantCount[] = [
  { quadrant: 'DO_FIRST', count: 4, percentage: 25 },
  { quadrant: 'SCHEDULE', count: 4, percentage: 25 },
  { quadrant: 'DELEGATE', count: 4, percentage: 25 },
  { quadrant: 'DROP', count: 4, percentage: 25 },
]

export const QUADRANTS_EMPTY: QuadrantCount[] = [
  { quadrant: 'DO_FIRST', count: 0, percentage: 0 },
  { quadrant: 'SCHEDULE', count: 0, percentage: 0 },
  { quadrant: 'DELEGATE', count: 0, percentage: 0 },
  { quadrant: 'DROP', count: 0, percentage: 0 },
]

export const STATUS_NORMAL: StatusCounts = { TODO: 12, IN_PROGRESS: 4, DONE: 27 }
export const STATUS_EMPTY: StatusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 }

function year(seed: (index: number) => number): HeatmapDay[] {
  const days: HeatmapDay[] = []
  const start = new Date('2026-01-01T00:00:00Z')
  for (let index = 0; index < 365; index++) {
    const date = new Date(start.getTime() + index * 86_400_000)
    days.push({ date: date.toISOString().slice(0, 10), count: seed(index) })
  }
  return days
}

export const HEATMAP_NORMAL = year((index) => (index % 7 === 0 ? 0 : index % 11 === 0 ? 7 : index % 3))
export const HEATMAP_EMPTY = year(() => 0)
